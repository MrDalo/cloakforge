/**
 * Per-tool rules for the token / account instructions a prepared transaction may contain, built only
 * from what the user asked for. Generic checks (fee payer, program allowlist, compute budget, service
 * fee) live in verifyPreparedTransactions.ts; everything a rule does not explicitly allow is rejected.
 */

import { AuthorityType } from '@solana-program/token'
import { formatRawTokenAmount } from '@/lib/solana'
import { acceptedRawAmounts, SOL_DECIMALS } from './amounts'
import type { DecodedTokenInstruction, TokenMetadataFieldName } from './decodeTokenInstruction'
import { createPaymentLedger, indexPaymentsByDestination } from './paymentLedger'
import { TOKEN_PROGRAM_ADDRESSES } from './programAddresses'
import type { CreatedTokenAccount, ExpectedOperation, PreparedTransactionExpectation } from './transactionExpectation'

/** Derives the associated token account of `owner` for `mint` under `tokenProgram`. */
export type AssociatedTokenAddressResolver = (owner: string, mint: string, tokenProgram: string) => string

export interface OperationRules {
  /** Accounts the transactions may create (SystemProgram.createAccount) → allowed owner programs */
  readonly newAccountOwners: ReadonlyMap<string, ReadonlySet<string>>
  /** Upper bound for the lamports funding those new accounts */
  readonly maxRentLamports: bigint
  /** Required signers besides the wallet (client-generated keypairs) */
  readonly additionalSigners: ReadonlySet<string>
  /**
   * Settles a SOL transfer against an expected payment.
   *
   * @returns The settled payment index, or -1 when the transfer is not an expected payment.
   */
  settleSolPayment(recipient: string, lamports: bigint): number
  /**
   * Checks one SPL Token / Token-2022 instruction.
   *
   * @param recordPayment - Called with the index of each expected payment the instruction settles.
   * @returns Why the instruction is not allowed, or null.
   */
  checkTokenInstruction(instruction: DecodedTokenInstruction, recordPayment: (paymentIndex: number) => void): string | null
  /** Checks an associated token account creation (address derivation already verified). */
  checkCreatedTokenAccount(account: CreatedTokenAccount): string | null
  /** Problems only visible once every instruction was checked (missing or repeated operations). */
  finalize(): string[]
}

type OperationOf<TKind extends ExpectedOperation['kind']> = Extract<ExpectedOperation, { kind: TKind }>
type TokenInstructionOf<TType extends DecodedTokenInstruction['type']> = Extract<DecodedTokenInstruction, { type: TType }>

const describeTokenInstruction = (instruction: DecodedTokenInstruction): string =>
  instruction.type === 'unsupported' ? instruction.label : instruction.type

const unexpectedTokenInstruction = (instruction: DecodedTokenInstruction): string =>
  `contains an unexpected token instruction (${describeTokenInstruction(instruction)})`

const authorityLabel = (authorityType: number): string => AuthorityType[authorityType] ?? `#${String(authorityType)}`

/** Quotes a user-visible string, shortened so a hostile value cannot flood the error message. */
const quote = (value: string): string => JSON.stringify(value.length > 64 ? `${value.slice(0, 64)}…` : value)

const expectCount = (actual: number, expected: number, label: string): string[] =>
  actual === expected ? [] : [`Expected ${String(expected)} ${label} instruction(s), found ${String(actual)}`]

/** Allows nothing beyond the generic instructions. Tool rules override what they need. */
const DENY_ALL_RULES: OperationRules = {
  newAccountOwners: new Map(),
  maxRentLamports: BigInt(0),
  additionalSigners: new Set(),
  settleSolPayment: () => -1,
  checkTokenInstruction: (instruction) => unexpectedTokenInstruction(instruction),
  checkCreatedTokenAccount: (account) => `creates an unexpected token account for ${account.owner}`,
  finalize: () => [],
}

/** A SetAuthority that revokes (sets to none) `expectedType` of `mint`, signed by the wallet. */
const checkAuthorityRevocation = (
  instruction: TokenInstructionOf<'setAuthority'>,
  mint: string,
  wallet: string,
  expectedType: AuthorityType
): string | null => {
  if (instruction.owned !== mint) return `changes an authority of ${instruction.owned} instead of the selected token`
  if (instruction.authority !== wallet) return `current authority ${instruction.authority} is not your wallet`
  if (instruction.authorityType !== expectedType) {
    return `changes the ${authorityLabel(instruction.authorityType)} authority instead of the ${authorityLabel(expectedType)} authority`
  }
  if (instruction.newAuthority !== null) {
    return `assigns the ${authorityLabel(expectedType)} authority to ${instruction.newAuthority} instead of revoking it`
  }
  return null
}

/** An UpdateTokenMetadataUpdateAuthority that makes the metadata of `mint` immutable. */
const checkMetadataAuthorityRevocation = (
  instruction: TokenInstructionOf<'updateTokenMetadataUpdateAuthority'>,
  mint: string,
  wallet: string
): string | null => {
  if (instruction.metadata !== mint) return `changes the metadata of ${instruction.metadata} instead of the selected token`
  if (instruction.updateAuthority !== wallet) return `metadata update authority ${instruction.updateAuthority} is not your wallet`
  if (instruction.newUpdateAuthority !== null) {
    return `assigns the metadata update authority to ${instruction.newUpdateAuthority} instead of revoking it`
  }
  return null
}

const createBurnRules = (operation: OperationOf<'burn'>, wallet: string): OperationRules => {
  let burnCount = 0

  return {
    ...DENY_ALL_RULES,
    checkTokenInstruction: (instruction) => {
      if (instruction.type !== 'burnChecked') return unexpectedTokenInstruction(instruction)
      burnCount++
      if (instruction.account !== operation.tokenAccount) return `burns from ${instruction.account} instead of the selected token account`
      if (instruction.mint !== operation.mint) return `burns token ${instruction.mint} instead of the selected token`
      if (instruction.authority !== wallet) return `burn authority ${instruction.authority} is not your wallet`
      if (!acceptedRawAmounts(operation.amount, instruction.decimals).has(instruction.amount)) {
        return `burns ${formatRawTokenAmount(instruction.amount, instruction.decimals)} tokens instead of ${String(operation.amount)}`
      }
      return null
    },
    finalize: () => expectCount(burnCount, 1, 'burn'),
  }
}

const createFreezeRules = (
  operation: OperationOf<'freeze' | 'thaw'>,
  wallet: string,
  resolveAta: AssociatedTokenAddressResolver
): OperationRules => {
  const expectedType = operation.kind === 'freeze' ? 'freezeAccount' : 'thawAccount'
  const verb = operation.kind === 'freeze' ? 'freezes' : 'unfreezes'
  const targetAccountsByProgram = new Map<string, ReadonlySet<string>>()
  const handledAccounts = new Set<string>()

  /** The selected wallets' token accounts under `tokenProgram` (derived once per program). */
  const targetAccounts = (tokenProgram: string): ReadonlySet<string> => {
    let accounts = targetAccountsByProgram.get(tokenProgram)
    if (!accounts) {
      accounts = new Set(operation.targetWallets.map((targetWallet) => resolveAta(targetWallet, operation.mint, tokenProgram)))
      targetAccountsByProgram.set(tokenProgram, accounts)
    }
    return accounts
  }

  return {
    ...DENY_ALL_RULES,
    checkTokenInstruction: (instruction) => {
      if ((instruction.type !== 'freezeAccount' && instruction.type !== 'thawAccount') || instruction.type !== expectedType) {
        return unexpectedTokenInstruction(instruction)
      }
      if (instruction.mint !== operation.mint) return `${verb} an account of token ${instruction.mint} instead of the selected token`
      if (instruction.authority !== wallet) return `freeze authority ${instruction.authority} is not your wallet`
      if (!targetAccounts(instruction.programAddress).has(instruction.account)) {
        return `${verb} token account ${instruction.account}, which does not belong to a wallet you entered`
      }
      if (handledAccounts.has(instruction.account)) return `${verb} token account ${instruction.account} more than once`
      handledAccounts.add(instruction.account)
      return null
    },
    finalize: () => (handledAccounts.size > 0 ? [] : [`Expected at least one ${expectedType} instruction, found none`]),
  }
}

const REVOKED_AUTHORITY_TYPES = { mint: AuthorityType.MintTokens, freeze: AuthorityType.FreezeAccount } as const

const createRevokeAuthorityRules = (operation: OperationOf<'revoke-authority'>, wallet: string): OperationRules => {
  let revocationCount = 0

  return {
    ...DENY_ALL_RULES,
    checkTokenInstruction: (instruction) => {
      if (instruction.type !== 'setAuthority') return unexpectedTokenInstruction(instruction)
      revocationCount++
      return checkAuthorityRevocation(instruction, operation.mint, wallet, REVOKED_AUTHORITY_TYPES[operation.authority])
    },
    finalize: () => expectCount(revocationCount, 1, 'authority revocation'),
  }
}

const createRevokeMetadataAuthorityRules = (operation: OperationOf<'revoke-metadata-authority'>, wallet: string): OperationRules => {
  let revocationCount = 0

  return {
    ...DENY_ALL_RULES,
    checkTokenInstruction: (instruction) => {
      if (instruction.type !== 'updateTokenMetadataUpdateAuthority') return unexpectedTokenInstruction(instruction)
      revocationCount++
      return checkMetadataAuthorityRevocation(instruction, operation.mint, wallet)
    },
    finalize: () => expectCount(revocationCount, 1, 'metadata authority revocation'),
  }
}

const createUpdateMetadataRules = (operation: OperationOf<'update-metadata'>, wallet: string): OperationRules => {
  const expectedValues: Partial<Record<TokenMetadataFieldName, string>> = {
    name: operation.name,
    symbol: operation.symbol,
    ...(operation.uri !== undefined && { uri: operation.uri }),
  }
  const updatedFields = new Set<TokenMetadataFieldName>()

  return {
    ...DENY_ALL_RULES,
    checkTokenInstruction: (instruction) => {
      if (instruction.type !== 'updateTokenMetadataField') return unexpectedTokenInstruction(instruction)
      if (instruction.metadata !== operation.mint) return `updates the metadata of ${instruction.metadata} instead of the selected token`
      if (instruction.updateAuthority !== wallet) return `metadata update authority ${instruction.updateAuthority} is not your wallet`

      const expectedValue = expectedValues[instruction.field]
      if (expectedValue === undefined) return `updates the metadata field "${instruction.field}", which you did not change`
      if (instruction.value !== expectedValue) {
        return `sets the token ${instruction.field} to ${quote(instruction.value)} instead of ${quote(expectedValue)}`
      }
      if (updatedFields.has(instruction.field)) return `updates the token ${instruction.field} more than once`
      updatedFields.add(instruction.field)
      return null
    },
    finalize: () => (updatedFields.size > 0 ? [] : ['Expected at least one metadata field update, found none']),
  }
}

const createTokenCreationRules = (
  operation: OperationOf<'create-token'>,
  wallet: string,
  resolveAta: AssociatedTokenAddressResolver
): OperationRules => {
  const { mint } = operation
  const acceptedSupplies = acceptedRawAmounts(operation.totalSupply, operation.decimals)
  const counts = {
    metadataPointer: 0,
    initializeMint: 0,
    tokenMetadata: 0,
    mintTo: 0,
    revokeMint: 0,
    revokeFreeze: 0,
    immutableMetadata: 0,
  }

  const checkSetAuthority = (instruction: TokenInstructionOf<'setAuthority'>): string | null => {
    if (instruction.authorityType === AuthorityType.MintTokens && operation.revokeMintAuthority) {
      counts.revokeMint++
      return checkAuthorityRevocation(instruction, mint, wallet, AuthorityType.MintTokens)
    }
    if (instruction.authorityType === AuthorityType.FreezeAccount && operation.revokeFreezeAuthority) {
      counts.revokeFreeze++
      return checkAuthorityRevocation(instruction, mint, wallet, AuthorityType.FreezeAccount)
    }
    return `changes the ${authorityLabel(instruction.authorityType)} authority, which you did not ask for`
  }

  const checkTokenInstruction = (instruction: DecodedTokenInstruction): string | null => {
    switch (instruction.type) {
      case 'initializeMetadataPointer':
        counts.metadataPointer++
        if (instruction.mint !== mint) return `initializes a metadata pointer on ${instruction.mint} instead of the new token`
        if (instruction.authority !== null && instruction.authority !== wallet) {
          return `metadata pointer authority ${instruction.authority} is not your wallet`
        }
        if (instruction.metadataAddress !== mint) return 'the metadata pointer does not point at the new token'
        return null
      case 'initializeMint':
        counts.initializeMint++
        if (instruction.mint !== mint) return `initializes mint ${instruction.mint} instead of the new token`
        if (instruction.decimals !== operation.decimals) {
          return `initializes the token with ${String(instruction.decimals)} decimals instead of ${String(operation.decimals)}`
        }
        if (instruction.mintAuthority !== wallet) return `mint authority ${instruction.mintAuthority} is not your wallet`
        if (instruction.freezeAuthority !== null && instruction.freezeAuthority !== wallet) {
          return `freeze authority ${instruction.freezeAuthority} is not your wallet`
        }
        return null
      case 'initializeTokenMetadata':
        counts.tokenMetadata++
        if (instruction.metadata !== mint || instruction.mint !== mint) return 'initializes metadata for another token'
        if (instruction.updateAuthority !== wallet) return `metadata update authority ${instruction.updateAuthority} is not your wallet`
        if (instruction.mintAuthority !== wallet) return `mint authority ${instruction.mintAuthority} is not your wallet`
        if (instruction.name !== operation.name || instruction.symbol !== operation.symbol || instruction.uri !== operation.uri) {
          return 'the token name, symbol or metadata URI differ from what you entered'
        }
        return null
      case 'mintTo':
        counts.mintTo++
        if (instruction.mint !== mint) return `mints token ${instruction.mint} instead of the new token`
        if (instruction.authority !== wallet) return `mint authority ${instruction.authority} is not your wallet`
        if (instruction.token !== resolveAta(wallet, mint, instruction.programAddress)) {
          return `mints the supply to ${instruction.token} instead of your token account`
        }
        if (!acceptedSupplies.has(instruction.amount)) {
          return `mints ${formatRawTokenAmount(instruction.amount, operation.decimals)} tokens instead of ${String(operation.totalSupply)}`
        }
        return null
      case 'setAuthority':
        return checkSetAuthority(instruction)
      case 'updateTokenMetadataUpdateAuthority':
        if (!operation.immutableMetadata) return 'changes the metadata update authority, which you did not ask for'
        counts.immutableMetadata++
        return checkMetadataAuthorityRevocation(instruction, mint, wallet)
      default:
        return unexpectedTokenInstruction(instruction)
    }
  }

  return {
    newAccountOwners: new Map([[mint, TOKEN_PROGRAM_ADDRESSES]]),
    maxRentLamports: operation.maxRentLamports,
    additionalSigners: new Set([mint]),
    settleSolPayment: () => -1,
    checkTokenInstruction,
    checkCreatedTokenAccount: (account) =>
      account.owner === wallet && account.mint === mint ? null : `creates an unexpected token account for ${account.owner}`,
    finalize: () => [
      ...expectCount(counts.metadataPointer, 1, 'metadata pointer'),
      ...expectCount(counts.initializeMint, 1, 'mint initialization'),
      ...expectCount(counts.tokenMetadata, 1, 'token metadata'),
      ...expectCount(counts.mintTo, 1, 'initial supply'),
      ...expectCount(counts.revokeMint, operation.revokeMintAuthority ? 1 : 0, 'mint authority revocation'),
      ...expectCount(counts.revokeFreeze, operation.revokeFreezeAuthority ? 1 : 0, 'freeze authority revocation'),
      ...expectCount(counts.immutableMetadata, operation.immutableMetadata ? 1 : 0, 'metadata authority revocation'),
    ],
  }
}

const createSolTransferRules = (operation: OperationOf<'sol-transfers'>): OperationRules => {
  const ledger = createPaymentLedger(operation.payments)
  const paymentsByRecipient = indexPaymentsByDestination(operation.payments, (payment) => payment.recipient)

  return {
    ...DENY_ALL_RULES,
    settleSolPayment: (recipient, lamports) => ledger.settle(paymentsByRecipient.get(recipient) ?? [], lamports, SOL_DECIMALS),
    finalize: () =>
      ledger
        .unpaidIndexes()
        .map((index) => `Missing payment of ${String(operation.payments[index].amount)} SOL to ${operation.payments[index].recipient}`),
  }
}

const createTokenTransferRules = (
  operation: OperationOf<'token-transfers'>,
  wallet: string,
  resolveAta: AssociatedTokenAddressResolver
): OperationRules => {
  const { mint, payments } = operation
  const ledger = createPaymentLedger(payments)
  const recipients = new Set(payments.map((payment) => payment.recipient))
  const paymentsByAtaByProgram = new Map<string, ReadonlyMap<string, number[]>>()

  /** Payment indexes keyed by the recipient's ATA under `tokenProgram` (derived once per program). */
  const paymentsByAta = (tokenProgram: string): ReadonlyMap<string, number[]> => {
    let byAta = paymentsByAtaByProgram.get(tokenProgram)
    if (!byAta) {
      byAta = indexPaymentsByDestination(payments, (payment) => resolveAta(payment.recipient, mint, tokenProgram))
      paymentsByAtaByProgram.set(tokenProgram, byAta)
    }
    return byAta
  }

  const settleTransfer = (
    tokenProgram: string,
    destination: string,
    amount: bigint,
    decimals: number,
    recordPayment: (paymentIndex: number) => void
  ): string | null => {
    const paymentIndex = ledger.settle(paymentsByAta(tokenProgram).get(destination) ?? [], amount, decimals)
    if (paymentIndex < 0) {
      return `transfers ${formatRawTokenAmount(amount, decimals)} tokens to ${destination}, which matches none of your unpaid recipients`
    }
    recordPayment(paymentIndex)
    return null
  }

  const checkSourceAndAuthority = (instruction: TokenInstructionOf<'transfer' | 'transferChecked'>): string | null => {
    if (instruction.authority !== wallet) return `transfer authority ${instruction.authority} is not your wallet`
    if (instruction.source !== resolveAta(wallet, mint, instruction.programAddress)) {
      return `transfers from ${instruction.source} instead of your token account`
    }
    return null
  }

  return {
    ...DENY_ALL_RULES,
    checkTokenInstruction: (instruction, recordPayment) => {
      if (instruction.type === 'transferChecked') {
        if (instruction.mint !== mint) return `transfers token ${instruction.mint} instead of the selected token`
        return (
          checkSourceAndAuthority(instruction) ??
          settleTransfer(instruction.programAddress, instruction.destination, instruction.amount, instruction.decimals, recordPayment)
        )
      }
      if (instruction.type === 'transfer') {
        // The source and destination ATAs bind the mint; the amount needs the mint's decimals
        if (operation.decimals === undefined) return 'uses an unchecked token transfer whose amount cannot be verified'
        return (
          checkSourceAndAuthority(instruction) ??
          settleTransfer(instruction.programAddress, instruction.destination, instruction.amount, operation.decimals, recordPayment)
        )
      }
      return unexpectedTokenInstruction(instruction)
    },
    checkCreatedTokenAccount: (account) =>
      account.mint === mint && recipients.has(account.owner) ? null : `creates an unexpected token account for ${account.owner}`,
    finalize: () =>
      ledger.unpaidIndexes().map((index) => `Missing transfer of ${String(payments[index].amount)} tokens to ${payments[index].recipient}`),
  }
}

/**
 * Builds the instruction rules for a tool's expected operation.
 *
 * @param expectation - What the user asked for.
 * @param resolveAta - Associated token address derivation (cached per verification).
 * @returns Rules for the operation; anything they do not allow is rejected.
 */
export function buildOperationRules(
  expectation: PreparedTransactionExpectation,
  resolveAta: AssociatedTokenAddressResolver
): OperationRules {
  const { operation, wallet } = expectation

  switch (operation.kind) {
    case 'burn':
      return createBurnRules(operation, wallet)
    case 'freeze':
    case 'thaw':
      return createFreezeRules(operation, wallet, resolveAta)
    case 'revoke-authority':
      return createRevokeAuthorityRules(operation, wallet)
    case 'revoke-metadata-authority':
      return createRevokeMetadataAuthorityRules(operation, wallet)
    case 'update-metadata':
      return createUpdateMetadataRules(operation, wallet)
    case 'create-token':
      return createTokenCreationRules(operation, wallet, resolveAta)
    case 'sol-transfers':
      return createSolTransferRules(operation)
    case 'token-transfers':
      return createTokenTransferRules(operation, wallet, resolveAta)
  }
}
