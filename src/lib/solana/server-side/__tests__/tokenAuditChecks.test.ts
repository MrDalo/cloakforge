import { describe, it, expect } from 'vitest'
import type {
  AuditCheck,
  HolderConcentration,
  Token2022ExtensionInfo,
  TokenAuditFacts,
  TokenAuditMetadata,
  TransferFeeInfo,
} from '@/types/tokenAudit'
import {
  checkExtensions,
  checkFreezeAuthority,
  checkHolderConcentration,
  checkMetadata,
  checkMintAuthority,
  checkTransferFee,
  evaluateTokenAuditChecks,
  HIGH_TRANSFER_FEE_BASIS_POINTS,
  summarizeAuditChecks,
} from '../tokenAuditChecks'

const AUTHORITY = 'So11111111111111111111111111111111111111112'
const OTHER = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const noExtensions: Token2022ExtensionInfo = {
  present: [],
  transferFee: null,
  permanentDelegate: null,
  transferHook: null,
  defaultAccountStateFrozen: false,
  pausable: null,
  nonTransferable: false,
  mintCloseAuthority: null,
  confidentialTransfer: false,
  metadataPointer: null,
}

const lockedMetadata: TokenAuditMetadata = {
  source: 'token-2022',
  name: 'Token',
  symbol: 'TKN',
  uri: 'https://example.com/m.json',
  updateAuthority: null,
  isMutable: false,
}

const holders = (overrides: Partial<HolderConcentration> = {}): HolderConcentration => ({
  topHolders: [],
  top10SharePercent: 5,
  walletSharePercent: 5,
  largestWalletSharePercent: 2,
  unclassifiedSharePercent: 0,
  ...overrides,
})

const byId = (checks: AuditCheck[], id: AuditCheck['id']): AuditCheck | undefined => checks.find((item) => item.id === id)

describe('checkMintAuthority', () => {
  it('should fail with the authority address while minting is possible', () => {
    expect(checkMintAuthority(AUTHORITY)).toMatchObject({ status: 'fail', address: AUTHORITY })
  })

  it('should pass once the authority is revoked', () => {
    const result = checkMintAuthority(null)
    expect(result.status).toBe('pass')
    expect(result.address).toBeUndefined()
  })
})

describe('checkFreezeAuthority', () => {
  it('should fail while accounts can be frozen and pass when revoked', () => {
    expect(checkFreezeAuthority(AUTHORITY).status).toBe('fail')
    expect(checkFreezeAuthority(null).status).toBe('pass')
  })
})

describe('checkTransferFee', () => {
  const UNCAPPED = '18446744073709551615'
  const terms = (basisPoints: number, maximumFeeRaw = UNCAPPED) => ({ basisPoints, maximumFeeRaw })
  const fee: TransferFeeInfo = { epochKnown: true, inForce: terms(0, '0'), scheduled: null, configAuthority: null }
  // 1,000,000.000000 tokens (6 decimals); 0.01% of the supply is 100 TKN (100000000 raw)
  const mint = { decimals: 6, supplyRaw: '1000000000000', symbol: 'TKN' }

  it('should pass a zero fee that can no longer be changed', () => {
    expect(checkTransferFee(fee, mint).status).toBe('pass')
  })

  it('should warn on a small fee or a fee authority that can still change it', () => {
    expect(checkTransferFee({ ...fee, inForce: terms(100) }, mint).status).toBe('warn')
    expect(checkTransferFee({ ...fee, configAuthority: AUTHORITY }, mint)).toMatchObject({ status: 'warn', address: AUTHORITY })
  })

  it(`should fail at ${HIGH_TRANSFER_FEE_BASIS_POINTS / 100}% or more`, () => {
    expect(checkTransferFee({ ...fee, inForce: terms(1_000) }, mint).status).toBe('fail')
  })

  it('should fail on a high fee scheduled for a later epoch and say so', () => {
    const scheduled = checkTransferFee({ ...fee, inForce: terms(50), scheduled: terms(2_500) }, mint)
    expect(scheduled.status).toBe('fail')
    expect(scheduled.explanation).toContain('A fee of 25%')
    expect(scheduled.explanation).toContain('is scheduled to take effect')
  })

  it('should not fail or mention a schedule when the fee was lowered and the lower fee is in force', () => {
    const result = checkTransferFee({ ...fee, inForce: terms(0, '0') }, mint)
    expect(result.status).toBe('pass')
    expect(result.explanation).toContain('No fee is charged right now.')
    expect(result.explanation).not.toContain('scheduled')
    expect(result.explanation).not.toContain('10%')
  })

  it('should warn, not fail, for a lowered but non-zero fee in force without a schedule', () => {
    const result = checkTransferFee({ ...fee, inForce: terms(100) }, mint)
    expect(result.status).toBe('warn')
    expect(result.explanation).not.toContain('scheduled')
  })

  it('should fall back to the highest configured fee when the epoch is unknown, and say so', () => {
    const result = checkTransferFee({ ...fee, epochKnown: false, inForce: terms(300) }, mint)
    expect(result.status).toBe('warn')
    expect(result.explanation).toContain('3%')
    expect(result.explanation).toContain('epoch could not be determined')
    expect(result.explanation).not.toContain('scheduled')
  })

  it('should warn and state the cap when a high fee is limited to a tiny maximum fee', () => {
    const result = checkTransferFee({ ...fee, inForce: terms(10_000, '1') }, mint)
    expect(result.status).toBe('warn')
    expect(result.explanation).toContain('100%, at most 0.000001 TKN per transfer')
    expect(result.explanation).not.toContain('with no per-transfer cap')
  })

  it('should fall back to "tokens" and format the cap with the mint decimals when there is no symbol', () => {
    const result = checkTransferFee({ ...fee, inForce: terms(10_000, '1500000') }, { ...mint, symbol: null })
    expect(result.explanation).toContain('at most 1.5 tokens per transfer')
  })

  it('should fail unless the cap is reached by transfers of at most 0.01% of the supply', () => {
    // 10% fee: the cap kicks in at cap × 10 — 10 TKN cap → 100 TKN transfers (exactly 0.01%)
    expect(checkTransferFee({ ...fee, inForce: terms(1_000, '10000000') }, mint).status).toBe('warn')
    expect(checkTransferFee({ ...fee, inForce: terms(1_000, '10000001') }, mint).status).toBe('fail')
  })

  it('should fail a 100% fee whose cap is a small share of the supply (every normal transfer is confiscated)', () => {
    // Cap of 0.5% of the supply: any transfer up to 5,000 TKN loses everything
    expect(checkTransferFee({ ...fee, inForce: terms(10_000, '5000000000') }, mint).status).toBe('fail')
  })

  it('should fail a high capped fee when the supply is unknown', () => {
    expect(checkTransferFee({ ...fee, inForce: terms(10_000, '1') }).status).toBe('fail')
  })

  it('should fail and report no cap when the maximum fee is effectively unlimited', () => {
    const result = checkTransferFee({ ...fee, inForce: terms(10_000) }, mint)
    expect(result.status).toBe('fail')
    expect(result.explanation).toContain('100%, with no per-transfer cap')
  })

  it('should fail when a scheduled high fee has a meaningful cap even though the fee in force is capped tiny', () => {
    const result = checkTransferFee({ ...fee, inForce: terms(10_000, '1'), scheduled: terms(5_000) }, mint)
    expect(result.status).toBe('fail')
    expect(result.explanation).toContain('A fee of 50%, with no per-transfer cap, is scheduled')
  })
})

describe('checkExtensions', () => {
  it('should report a single pass for classic SPL Token mints', () => {
    const checks = checkExtensions(null, null)
    expect(checks).toHaveLength(1)
    expect(checks[0]).toMatchObject({ id: 'token-extensions', status: 'pass' })
  })

  it('should list absent controls in one passing check for a Token-2022 mint without risky extensions', () => {
    const checks = checkExtensions(noExtensions, null)
    expect(checks.map((item) => item.id)).toEqual(['token-extensions'])
    expect(checks[0].explanation).toContain('transfer fee')
    expect(checks[0].explanation).toContain('permanent delegate')
  })

  it('should fail an active permanent delegate and pass a revoked one', () => {
    const active = checkExtensions({ ...noExtensions, present: ['PermanentDelegate'], permanentDelegate: AUTHORITY }, null)
    expect(byId(active, 'permanent-delegate')).toMatchObject({ status: 'fail', address: AUTHORITY })

    const revoked = checkExtensions({ ...noExtensions, present: ['PermanentDelegate'], permanentDelegate: null }, null)
    expect(byId(revoked, 'permanent-delegate')?.status).toBe('pass')
  })

  it('should warn on an active transfer hook and on a hook authority that can add one', () => {
    const active = checkExtensions(
      { ...noExtensions, present: ['TransferHook'], transferHook: { programId: OTHER, authority: null } },
      null
    )
    expect(byId(active, 'transfer-hook')).toMatchObject({ status: 'warn', address: OTHER })

    const dormant = checkExtensions(
      { ...noExtensions, present: ['TransferHook'], transferHook: { programId: null, authority: AUTHORITY } },
      null
    )
    expect(byId(dormant, 'transfer-hook')).toMatchObject({ status: 'warn', address: AUTHORITY })

    const disabled = checkExtensions(
      { ...noExtensions, present: ['TransferHook'], transferHook: { programId: null, authority: null } },
      null
    )
    expect(byId(disabled, 'transfer-hook')?.status).toBe('pass')
  })

  it('should fail default-frozen accounts, and warn when a freeze authority could switch them on', () => {
    const frozen = checkExtensions({ ...noExtensions, present: ['DefaultAccountState'], defaultAccountStateFrozen: true }, null)
    expect(byId(frozen, 'default-account-state')?.status).toBe('fail')

    const switchable = checkExtensions({ ...noExtensions, present: ['DefaultAccountState'] }, AUTHORITY)
    expect(byId(switchable, 'default-account-state')?.status).toBe('warn')

    const fixed = checkExtensions({ ...noExtensions, present: ['DefaultAccountState'] }, null)
    expect(byId(fixed, 'default-account-state')?.status).toBe('pass')
  })

  it('should fail a pausable token while paused or while a pause authority exists', () => {
    expect(byId(checkExtensions({ ...noExtensions, pausable: { authority: AUTHORITY, paused: false } }, null), 'pausable')?.status).toBe(
      'fail'
    )
    expect(byId(checkExtensions({ ...noExtensions, pausable: { authority: null, paused: true } }, null), 'pausable')?.status).toBe('fail')
    expect(byId(checkExtensions({ ...noExtensions, pausable: { authority: null, paused: false } }, null), 'pausable')?.status).toBe('pass')
  })

  it('should warn on non-transferable tokens, confidential transfers and an active mint close authority', () => {
    const checks = checkExtensions(
      {
        ...noExtensions,
        present: ['NonTransferable', 'ConfidentialTransferMint', 'MintCloseAuthority'],
        nonTransferable: true,
        confidentialTransfer: true,
        mintCloseAuthority: AUTHORITY,
      },
      null
    )
    expect(byId(checks, 'non-transferable')?.status).toBe('warn')
    expect(byId(checks, 'confidential-transfer')?.status).toBe('warn')
    expect(byId(checks, 'mint-close-authority')).toMatchObject({ status: 'warn', address: AUTHORITY })
  })

  it('should mark extensions the tool does not analyze as unknown, never as pass', () => {
    const checks = checkExtensions({ ...noExtensions, present: ['MetadataPointer', 'InterestBearingConfig', 'Unknown(99)'] }, null)
    const other = byId(checks, 'other-extensions')
    expect(other?.status).toBe('unknown')
    expect(other?.explanation).toContain('InterestBearingConfig')
    expect(other?.explanation).toContain('Unknown(99)')
    expect(other?.explanation).not.toContain('MetadataPointer')
  })
})

describe('checkMetadata', () => {
  it('should pass locked metadata without a pointer authority', () => {
    expect(checkMetadata(lockedMetadata, null, null).status).toBe('pass')
  })

  it('should warn on mutable metadata with the update authority address', () => {
    const result = checkMetadata({ ...lockedMetadata, updateAuthority: AUTHORITY, isMutable: true }, null, null)
    expect(result).toMatchObject({ status: 'warn', address: AUTHORITY })
  })

  it('should warn when the metadata is locked but the metadata pointer can still be redirected', () => {
    const result = checkMetadata(lockedMetadata, null, OTHER)
    expect(result).toMatchObject({ status: 'warn', address: OTHER })
    expect(result.explanation).toContain('pointer')
  })

  it('should report metadata that was not found or not read as unknown', () => {
    expect(checkMetadata(null, null, null).status).toBe('unknown')
    expect(checkMetadata(null, OTHER, null)).toMatchObject({ status: 'unknown', address: OTHER })
  })
})

describe('checkHolderConcentration', () => {
  it('should be unknown when holders were not analyzed', () => {
    expect(checkHolderConcentration(null).status).toBe('unknown')
  })

  it('should pass a spread-out supply', () => {
    expect(checkHolderConcentration(holders()).status).toBe('pass')
  })

  it.each([
    [{ largestWalletSharePercent: 10, walletSharePercent: 10 }, 'warn'],
    [{ largestWalletSharePercent: 5, walletSharePercent: 25 }, 'warn'],
    [{ largestWalletSharePercent: 20, walletSharePercent: 20 }, 'fail'],
    [{ largestWalletSharePercent: 15, walletSharePercent: 50 }, 'fail'],
  ] as const)('should grade %o as %s', (shares, expected) => {
    expect(checkHolderConcentration(holders(shares)).status).toBe(expected)
  })

  it('should be unknown, not pass, when much of the supply sits in unclassified accounts', () => {
    const result = checkHolderConcentration(holders({ unclassifiedSharePercent: 60, top10SharePercent: 65 }))
    expect(result.status).toBe('unknown')
    expect(result.explanation).toContain('not verified')
  })
})

describe('evaluateTokenAuditChecks', () => {
  const facts: TokenAuditFacts = {
    mint: OTHER,
    tokenProgram: 'token-2022',
    decimals: 6,
    supplyRaw: '1000000',
    supplyDisplay: '1',
    mintAuthority: null,
    freezeAuthority: null,
    metadata: lockedMetadata,
    externalMetadataAddress: null,
    extensions: {
      ...noExtensions,
      present: ['MetadataPointer', 'TokenMetadata'],
      metadataPointer: { authority: AUTHORITY, metadataAddress: OTHER },
    },
    holders: holders(),
  }

  it('should order checks as authorities, extensions, metadata, holders', () => {
    const ids = evaluateTokenAuditChecks(facts).map((item) => item.id)
    expect(ids).toEqual(['mint-authority', 'freeze-authority', 'token-extensions', 'metadata-mutability', 'holder-concentration'])
  })

  it('should take the metadata pointer authority into account', () => {
    expect(byId(evaluateTokenAuditChecks(facts), 'metadata-mutability')?.status).toBe('warn')
  })
})

describe('summarizeAuditChecks', () => {
  const make = (...statuses: AuditCheck['status'][]): AuditCheck[] =>
    statuses.map((status, index) => ({ id: 'mint-authority', title: `Check ${index}`, status, explanation: '' }))

  it('should count outcomes and derive the level from them only', () => {
    expect(summarizeAuditChecks(make('pass', 'pass'))).toEqual({ pass: 2, warn: 0, fail: 0, unknown: 0, riskLevel: 'low' })
    expect(summarizeAuditChecks(make('pass', 'warn')).riskLevel).toBe('medium')
    expect(summarizeAuditChecks(make('pass', 'unknown')).riskLevel).toBe('medium')
    expect(summarizeAuditChecks(make('warn', 'fail', 'unknown'))).toEqual({ pass: 0, warn: 1, fail: 1, unknown: 1, riskLevel: 'high' })
  })
})
