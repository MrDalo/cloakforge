/**
 * Token Auditor — transparent, rule-based risk checks.
 *
 * Every check is a fixed rule over on-chain facts and returns pass / warn / fail / unknown with a
 * short explanation. There is deliberately no numeric score: the overall level is derived from the
 * check outcomes only (see `summarizeAuditChecks`).
 */

import 'server-only'

import type {
  AuditCheck,
  AuditCheckId,
  AuditCheckStatus,
  HolderConcentration,
  Token2022ExtensionInfo,
  TokenAuditFacts,
  TokenAuditMetadata,
  TokenAuditSummary,
  TransferFeeInfo,
  TransferFeeTerms,
} from '@/types/tokenAudit'

/** A transfer fee at or above this many basis points (10%) fails the transfer-fee check. */
export const HIGH_TRANSFER_FEE_BASIS_POINTS = 1_000

/** Holder-concentration thresholds in percent of total supply. */
export const HOLDER_CONCENTRATION_THRESHOLDS = {
  /** Fail when one wallet holds at least this share… */
  failLargestWallet: 20,
  /** …or the top-10 wallets together hold at least this share. */
  failTopWallets: 50,
  warnLargestWallet: 10,
  warnTopWallets: 25,
  /** Report as unknown when at least this share sits in program-controlled or unreadable accounts. */
  unclassified: 25,
} as const

/** Extensions covered by a dedicated check or purely informational (token groups). */
const HANDLED_EXTENSIONS = new Set([
  'TransferFeeConfig',
  'PermanentDelegate',
  'TransferHook',
  'DefaultAccountState',
  'PausableConfig',
  'NonTransferable',
  'MintCloseAuthority',
  'ConfidentialTransferMint',
  'ConfidentialTransferFeeConfig',
  'ConfidentialMintBurn',
  'MetadataPointer',
  'TokenMetadata',
  'GroupPointer',
  'TokenGroup',
  'GroupMemberPointer',
  'TokenGroupMember',
])

const check = (id: AuditCheckId, title: string, status: AuditCheckStatus, explanation: string, address?: string | null): AuditCheck =>
  address ? { id, title, status, explanation, address } : { id, title, status, explanation }

/** Formats a percentage without trailing zeros, e.g. 12.5 → "12.5%". */
const formatPercent = (value: number): string => `${Number(value.toFixed(2))}%`

/**
 * Mint authority: an active authority can inflate the supply.
 *
 * @param authority - Current mint authority, or null when revoked.
 * @returns Check result.
 */
export function checkMintAuthority(authority: string | null): AuditCheck {
  return authority
    ? check(
        'mint-authority',
        'Mint authority',
        'fail',
        'Active: this account can create new tokens at any time and dilute holders. Normal for some managed tokens such as stablecoins; a major risk otherwise.',
        authority
      )
    : check('mint-authority', 'Mint authority', 'pass', 'Revoked: no new tokens can be minted, so the supply is fixed.')
}

/**
 * Freeze authority: an active authority can block any holder's tokens.
 *
 * @param authority - Current freeze authority, or null when revoked.
 * @returns Check result.
 */
export function checkFreezeAuthority(authority: string | null): AuditCheck {
  return authority
    ? check(
        'freeze-authority',
        'Freeze authority',
        'fail',
        "Active: this account can freeze any holder's token account so the tokens cannot be moved or sold. Normal for some regulated tokens; a major risk otherwise.",
        authority
      )
    : check('freeze-authority', 'Freeze authority', 'pass', 'Revoked: holder accounts cannot be frozen.')
}

/**
 * A high transfer fee only fails the check when its per-transfer cap can reach this share (percent) of the
 * total supply; a smaller cap bounds the loss per transfer, so the check warns instead. A cap at or above
 * the u64 maximum means "no cap" and always fails.
 */
export const MEANINGFUL_FEE_CAP_SUPPLY_PERCENT = 1

/** Token-2022 treats a maximum fee of u64::MAX as "no cap". */
const UNCAPPED_FEE_RAW = BigInt('18446744073709551615')

/** Mint details needed to read a transfer fee's per-transfer cap. */
export interface TransferFeeMintContext {
  decimals: number
  /** Total supply in raw base units. */
  supplyRaw: string
  /** Token symbol (self-reported), or null when unknown. */
  symbol: string | null
}

/**
 * Fallback for callers without mint details: a zero supply makes every cap count as meaningful, so a
 * high fee fails (conservative) rather than being downgraded on missing data.
 */
const UNKNOWN_FEE_MINT: TransferFeeMintContext = { decimals: 0, supplyRaw: '0', symbol: null }

/** Formats a raw base-unit amount with the mint's decimals, e.g. (1500000, 6) → "1.5". */
function formatRawAmount(raw: bigint, decimals: number): string {
  const base = BigInt(10) ** BigInt(decimals)
  const whole = (raw / base).toLocaleString('en-US')
  const fraction = (raw % base).toString().padStart(decimals, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole
}

/**
 * Transfer fee: judged on the worst of the fee in force and any fee scheduled for a later epoch.
 * Fails at ≥ 10% when the per-transfer cap is meaningful (see `MEANINGFUL_FEE_CAP_SUPPLY_PERCENT`),
 * warns on any other fee or a fee authority that can still change it.
 *
 * @param fee - Transfer-fee summary.
 * @param mint - Mint details used to format and weigh the per-transfer cap.
 * @returns Check result.
 */
export function checkTransferFee(fee: TransferFeeInfo, mint: TransferFeeMintContext = UNKNOWN_FEE_MINT): AuditCheck {
  const unit = mint.symbol || 'tokens'
  const supply = BigInt(mint.supplyRaw)
  const capClause = (terms: TransferFeeTerms): string => {
    const cap = BigInt(terms.maximumFeeRaw)
    return cap >= UNCAPPED_FEE_RAW ? 'with no per-transfer cap' : `at most ${formatRawAmount(cap, mint.decimals)} ${unit} per transfer`
  }
  // 0 = no fee, 1 = fee that is small or capped, 2 = fee ≥ 10% whose cap can reach a meaningful share of the supply
  const severity = (terms: TransferFeeTerms): number => {
    if (terms.basisPoints === 0) return 0
    const capMeaningful =
      BigInt(terms.maximumFeeRaw) >= UNCAPPED_FEE_RAW ||
      BigInt(terms.maximumFeeRaw) * BigInt(100) >= supply * BigInt(MEANINGFUL_FEE_CAP_SUPPLY_PERCENT)
    return terms.basisPoints >= HIGH_TRANSFER_FEE_BASIS_POINTS && capMeaningful ? 2 : 1
  }

  const { inForce, scheduled } = fee
  const charged =
    inForce.basisPoints > 0
      ? `Every transfer is charged ${formatPercent(inForce.basisPoints / 100)}, ${capClause(inForce)}.`
      : 'No fee is charged right now.'
  const epochNote = fee.epochKnown ? '' : ' (The current epoch could not be determined, so the highest configured fee is shown.)'
  const scheduledNote = scheduled
    ? ` A fee of ${formatPercent(scheduled.basisPoints / 100)}, ${capClause(scheduled)}, is scheduled to take effect.`
    : ''
  const authority = fee.configAuthority
    ? ' The fee authority can change the fee at any time (changes take effect after about two epochs).'
    : ' The fee can no longer be changed.'
  const explanation = `${charged}${epochNote}${scheduledNote}${authority}`

  const worst = Math.max(severity(inForce), scheduled ? severity(scheduled) : 0)
  if (worst === 2) {
    return check('transfer-fee', 'Transfer fee', 'fail', explanation, fee.configAuthority)
  }
  if (worst === 1 || fee.configAuthority) {
    return check('transfer-fee', 'Transfer fee', 'warn', explanation, fee.configAuthority)
  }
  return check('transfer-fee', 'Transfer fee', 'pass', explanation)
}

/** Permanent delegate: can move or burn anyone's tokens. */
function checkPermanentDelegate(delegate: string | null): AuditCheck {
  return delegate
    ? check(
        'permanent-delegate',
        'Permanent delegate',
        'fail',
        "A permanent delegate can transfer or burn tokens from any holder's account at any time, without approval.",
        delegate
      )
    : check(
        'permanent-delegate',
        'Permanent delegate',
        'pass',
        'The permanent delegate extension is present, but its delegate has been revoked.'
      )
}

/** Transfer hook: a program that runs on every transfer can reject transfers. */
function checkTransferHook(hook: NonNullable<Token2022ExtensionInfo['transferHook']>): AuditCheck {
  if (hook.programId) {
    const authority = hook.authority ? ' The hook authority can also swap in a different program.' : ''
    return check(
      'transfer-hook',
      'Transfer hook',
      'warn',
      `Every transfer runs a custom program that can reject transfers (for example, to stop holders from selling). This tool does not analyze that program.${authority}`,
      hook.programId
    )
  }
  if (hook.authority) {
    return check(
      'transfer-hook',
      'Transfer hook',
      'warn',
      'No hook program is active, but the hook authority can add one at any time.',
      hook.authority
    )
  }
  return check(
    'transfer-hook',
    'Transfer hook',
    'pass',
    'The transfer hook extension is present but disabled and can no longer be changed.'
  )
}

/** Default account state: new accounts starting frozen block holders until thawed. */
function checkDefaultAccountState(frozen: boolean, freezeAuthority: string | null): AuditCheck {
  if (frozen) {
    return check(
      'default-account-state',
      'Default account state',
      'fail',
      'New token accounts start frozen: holders cannot move their tokens until the freeze authority thaws their account.'
    )
  }
  return freezeAuthority
    ? check(
        'default-account-state',
        'Default account state',
        'warn',
        'New accounts start unfrozen, but the freeze authority can switch new accounts to start frozen.',
        freezeAuthority
      )
    : check('default-account-state', 'Default account state', 'pass', 'New accounts start unfrozen and this can no longer be changed.')
}

/** Pausable: an authority can stop all transfers. */
function checkPausable(pausable: NonNullable<Token2022ExtensionInfo['pausable']>): AuditCheck {
  if (pausable.paused) {
    return check('pausable', 'Pause', 'fail', 'Transfers, minting and burning are paused right now.', pausable.authority)
  }
  return pausable.authority
    ? check('pausable', 'Pause', 'fail', 'The pause authority can stop all transfers at any time.', pausable.authority)
    : check('pausable', 'Pause', 'pass', 'The pause extension is present, but its authority has been revoked.')
}

/** Mint close authority: a closed mint can be re-created at the same address with different settings. */
function checkMintCloseAuthority(closeAuthority: string | null): AuditCheck {
  return closeAuthority
    ? check(
        'mint-close-authority',
        'Mint close authority',
        'warn',
        'This account can close the mint once the supply is zero; a new mint with different settings could then be created at the same address.',
        closeAuthority
      )
    : check(
        'mint-close-authority',
        'Mint close authority',
        'pass',
        'The mint close extension is present, but its authority has been revoked.'
      )
}

/**
 * Checks for each Token-2022 extension present, plus one summary check for the controls that are
 * absent (extensions cannot be added after a mint is created) and one for unanalyzed extensions.
 *
 * @param extensions - Decoded extensions, or null for classic SPL Token mints.
 * @param freezeAuthority - Current freeze authority (governs the default account state).
 * @param mint - Mint details for reading the transfer-fee cap; omit only when no transfer fee is present.
 * @returns Extension-related checks.
 */
export function checkExtensions(
  extensions: Token2022ExtensionInfo | null,
  freezeAuthority: string | null,
  mint?: TransferFeeMintContext
): AuditCheck[] {
  if (!extensions) {
    return [
      check(
        'token-extensions',
        'Token-2022 controls',
        'pass',
        'Classic SPL Token program: transfer fees, transfer hooks, permanent delegates, pausing and default-frozen accounts cannot exist on this token.'
      ),
    ]
  }

  const has = (name: string): boolean => extensions.present.includes(name)
  // [label used when the control is absent, check when the extension is present]
  const candidates: Array<[string, AuditCheck | null]> = [
    ['transfer fee', extensions.transferFee ? checkTransferFee(extensions.transferFee, mint) : null],
    ['permanent delegate', has('PermanentDelegate') ? checkPermanentDelegate(extensions.permanentDelegate) : null],
    ['transfer hook', extensions.transferHook ? checkTransferHook(extensions.transferHook) : null],
    [
      'default-frozen accounts',
      has('DefaultAccountState') ? checkDefaultAccountState(extensions.defaultAccountStateFrozen, freezeAuthority) : null,
    ],
    ['pause', extensions.pausable ? checkPausable(extensions.pausable) : null],
    [
      'non-transferable',
      extensions.nonTransferable
        ? check(
            'non-transferable',
            'Non-transferable',
            'warn',
            'Tokens are non-transferable (soulbound): holders cannot send or sell them.'
          )
        : null,
    ],
    ['mint close authority', has('MintCloseAuthority') ? checkMintCloseAuthority(extensions.mintCloseAuthority) : null],
    [
      'confidential transfers',
      extensions.confidentialTransfer
        ? check(
            'confidential-transfer',
            'Confidential transfers',
            'warn',
            'Balances and transfer amounts can be encrypted, so the holder distribution shown here may be incomplete.'
          )
        : null,
    ],
  ]
  const checks = candidates.flatMap(([, result]) => (result ? [result] : []))
  const absent = candidates.filter(([, result]) => result === null).map(([label]) => label)

  if (absent.length > 0) {
    checks.push(
      check(
        'token-extensions',
        'Other Token-2022 controls',
        'pass',
        `Not enabled: ${absent.join(', ')}. Extensions cannot be added after a mint is created.`
      )
    )
  }

  const unanalyzed = extensions.present.filter((name) => !HANDLED_EXTENSIONS.has(name))
  if (unanalyzed.length > 0) {
    checks.push(
      check(
        'other-extensions',
        'Other extensions',
        'unknown',
        `Present but not analyzed by this tool: ${unanalyzed.join(', ')}. Review them in a block explorer.`
      )
    )
  }

  return checks
}

/**
 * Metadata mutability, including the Token-2022 MetadataPointer: a pointer authority can make
 * wallets show different metadata even when the metadata itself is locked.
 *
 * @param metadata - Resolved metadata, or null.
 * @param externalMetadataAddress - Pointer target that was not read, or null.
 * @param pointerAuthority - MetadataPointer authority, or null.
 * @returns Check result.
 */
export function checkMetadata(
  metadata: TokenAuditMetadata | null,
  externalMetadataAddress: string | null,
  pointerAuthority: string | null
): AuditCheck {
  const title = 'Metadata (name, symbol, URI)'
  const pointerNote = pointerAuthority ? ' The metadata pointer authority can also point the token at different metadata.' : ''

  if (externalMetadataAddress) {
    return check(
      'metadata-mutability',
      title,
      pointerAuthority ? 'warn' : 'unknown',
      `Metadata is stored in a separate account that this tool does not read.${pointerNote}`,
      pointerAuthority ?? externalMetadataAddress
    )
  }
  if (!metadata) {
    return check(
      'metadata-mutability',
      title,
      pointerAuthority ? 'warn' : 'unknown',
      `No on-chain metadata was found, so the name and symbol cannot be checked.${pointerNote}`,
      pointerAuthority
    )
  }
  if (metadata.isMutable) {
    return check(
      'metadata-mutability',
      title,
      'warn',
      `The update authority can change the name, symbol and metadata URI at any time (for example, to imitate another token).${pointerNote}`,
      metadata.updateAuthority
    )
  }
  if (pointerAuthority) {
    return check(
      'metadata-mutability',
      title,
      'warn',
      'The metadata itself is locked, but the metadata pointer authority can point the token at different metadata, so wallets could show a different name.',
      pointerAuthority
    )
  }
  return check('metadata-mutability', title, 'pass', 'The name, symbol and metadata URI can no longer be changed.')
}

/**
 * Holder concentration of the 10 largest accounts. Only accounts owned by regular wallets count
 * toward the thresholds; program-controlled and unreadable accounts are reported, not guessed.
 *
 * @param holders - Concentration figures, or null when not analyzed.
 * @returns Check result.
 */
export function checkHolderConcentration(holders: HolderConcentration | null): AuditCheck {
  const title = 'Holder concentration (top 10 accounts)'
  if (!holders) {
    return check(
      'holder-concentration',
      title,
      'unknown',
      'Holder data could not be read (the request failed or timed out, or the supply is zero), so concentration was not analyzed.'
    )
  }

  const { largestWalletSharePercent: largest, walletSharePercent: wallets, unclassifiedSharePercent: unclassified } = holders
  const limits = HOLDER_CONCENTRATION_THRESHOLDS
  const base = `The largest wallet holds ${formatPercent(largest)} and the top wallets together hold ${formatPercent(wallets)} of the supply.`
  const unclassifiedNote =
    unclassified > 0
      ? ` Another ${formatPercent(unclassified)} sits in program-controlled or unreadable accounts (for example liquidity pools, locks or vaults); who controls them was not verified.`
      : ''

  if (largest >= limits.failLargestWallet || wallets >= limits.failTopWallets) {
    return check(
      'holder-concentration',
      title,
      'fail',
      `${base} High concentration: a few wallets could move the price sharply.${unclassifiedNote}`
    )
  }
  if (largest >= limits.warnLargestWallet || wallets >= limits.warnTopWallets) {
    return check('holder-concentration', title, 'warn', `${base} Moderate concentration.${unclassifiedNote}`)
  }
  if (unclassified >= limits.unclassified) {
    return check('holder-concentration', title, 'unknown', `${base}${unclassifiedNote}`)
  }
  return check('holder-concentration', title, 'pass', `${base}${unclassifiedNote}`)
}

/**
 * Runs every rule over the collected facts.
 *
 * @param facts - On-chain facts for one mint.
 * @returns Checks in display order: authorities, extensions, metadata, holders.
 */
export function evaluateTokenAuditChecks(facts: TokenAuditFacts): AuditCheck[] {
  return [
    checkMintAuthority(facts.mintAuthority),
    checkFreezeAuthority(facts.freezeAuthority),
    ...checkExtensions(facts.extensions, facts.freezeAuthority, {
      decimals: facts.decimals,
      supplyRaw: facts.supplyRaw,
      symbol: facts.metadata?.symbol || null,
    }),
    checkMetadata(facts.metadata, facts.externalMetadataAddress, facts.extensions?.metadataPointer?.authority ?? null),
    checkHolderConcentration(facts.holders),
  ]
}

/**
 * Counts outcomes and derives the overall level: `high` if any check failed, `medium` if any
 * warned or could not be determined, otherwise `low`. `low` means no red flags were found by
 * these checks — not that the token is safe.
 *
 * @param checks - Check results.
 * @returns Outcome counts and risk level.
 */
export function summarizeAuditChecks(checks: AuditCheck[]): TokenAuditSummary {
  const count = (status: AuditCheckStatus): number => checks.filter((item) => item.status === status).length
  const fail = count('fail')
  const warn = count('warn')
  const unknown = count('unknown')
  const riskLevel = fail > 0 ? 'high' : warn + unknown > 0 ? 'medium' : 'low'
  return { pass: count('pass'), warn, fail, unknown, riskLevel }
}
