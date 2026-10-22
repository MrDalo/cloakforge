/**
 * Client-side verification of server-prepared transactions (WEB3-07).
 *
 * The server builds UNSIGNED transactions and the wallet signs them. A compromised or buggy API path
 * could hand the wallet something other than what the UI shows, so every hook checks the decoded
 * transactions against what the user asked for BEFORE calling signTransaction:
 *
 * - the connected wallet pays the network fee, and only expected keys must sign;
 * - every invoked program is allowlisted (System, Compute Budget, Memo, SPL Token, Token-2022, ATA);
 * - the priority fee is bounded, and every transaction carries out part of the request (no filler
 *   transactions that only burn network fees);
 * - SOL leaving the wallet goes only to the fee wallet (at most the displayed fee), to the payments
 *   the user entered (exact amounts, each exactly once), to accounts the transaction creates (rent,
 *   bounded), or is a 0-lamport transfer (coupon marker);
 * - token instructions only touch the expected mint and accounts, with the expected amounts and
 *   authorities (see operationRules.ts) — anything else (Approve, CloseAccount, a SetAuthority to a
 *   foreign key, unknown instructions) is rejected.
 *
 * Pure and synchronous: lookup tables are loaded beforehand (fetchAddressLookupTables).
 */

import {
  type AddressLookupTableAccount,
  ComputeBudgetInstruction,
  PublicKey,
  SystemInstruction,
  type TransactionInstruction,
} from '@solana/web3.js'
import { getAssociatedTokenAddressSync } from '@solana/spl-token'
import { formatLamportsAsSol } from './amounts'
import { type DecodedPreparedTransaction, decodePreparedTransaction, type PreparedTransaction } from './decodePreparedTransaction'
import { decodeAssociatedTokenInstruction, decodeTokenInstruction } from './decodeTokenInstruction'
import { type AssociatedTokenAddressResolver, buildOperationRules, type OperationRules } from './operationRules'
import {
  ALLOWED_PROGRAM_ADDRESSES,
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  COMPUTE_BUDGET_PROGRAM_ADDRESS,
  MEMO_PROGRAM_ADDRESSES,
  SYSTEM_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESSES,
} from './programAddresses'
import type { CreatedTokenAccount, PreparedTransactionExpectation, PreparedTransactionVerification } from './transactionExpectation'

const ZERO = BigInt(0)

/** Slack on the service fee and rent bounds, for SOL → lamport rounding differences (0.00001 SOL). */
export const SOL_TOLERANCE_LAMPORTS = BigInt(10_000)

/**
 * Highest priority fee one prepared transaction may carry (0.002 SOL). The server caps the price at
 * 1,000,000 micro-lamports per CU and uses at most 1.4M CU, i.e. 0.0014 SOL.
 */
export const MAX_PRIORITY_FEE_LAMPORTS_PER_TRANSACTION = BigInt(2_000_000)

const BASE_FEE_LAMPORTS_PER_SIGNATURE = BigInt(5_000)
const DEFAULT_COMPUTE_UNITS_PER_INSTRUCTION = 200_000
const MAX_COMPUTE_UNITS = 1_400_000
const MICRO_LAMPORTS_PER_LAMPORT = BigInt(1_000_000)

const UNPINNED_FEE_WALLET_WARNING =
  'The service-fee recipient is not pinned because NEXT_PUBLIC_FEE_WALLET_ADDRESS is not set (development only).'

/** Running totals across every transaction of one request. */
interface VerificationState {
  readonly expectation: PreparedTransactionExpectation
  readonly rules: OperationRules
  readonly resolveAta: AssociatedTokenAddressResolver
  readonly reasons: string[]
  readonly warnings: Set<string>
  readonly createdTokenAccounts: Map<string, CreatedTokenAccount>
  readonly paymentIndexesByTransaction: number[][]
  serviceFeeLamports: bigint
  paymentLamports: bigint
  rentLamports: bigint
  networkFeeLamports: bigint
}

/** Per-transaction context passed to the instruction checks. */
interface TransactionContext {
  readonly state: VerificationState
  readonly paymentIndexes: number[]
  readonly computeBudget: { unitLimit?: number; unitPriceMicroLamports?: bigint }
  /** Instructions that carry out the request (an expected payment, burn, freeze, revocation, ...) */
  operationCount: number
}

/** Derives associated token addresses, caching each (owner, mint, program) triple for one verification. */
const createAtaResolver = (): AssociatedTokenAddressResolver => {
  const cache = new Map<string, string>()
  return (owner, mint, tokenProgram) => {
    const key = `${owner}|${mint}|${tokenProgram}`
    let ata = cache.get(key)
    if (!ata) {
      ata = getAssociatedTokenAddressSync(new PublicKey(mint), new PublicKey(owner), true, new PublicKey(tokenProgram)).toBase58()
      cache.set(key, ata)
    }
    return ata
  }
}

/** Classifies SOL leaving the wallet: rent, an expected payment, the service fee, or unexpected. */
const checkSolTransfer = (recipient: string, lamports: bigint, context: TransactionContext): string | null => {
  const { state } = context
  // Moves nothing (e.g. the coupon marker transfer, which only tags the transaction)
  if (lamports === ZERO) return null

  if (state.rules.newAccountOwners.has(recipient)) {
    state.rentLamports += lamports
    return null
  }

  const paymentIndex = state.rules.settleSolPayment(recipient, lamports)
  if (paymentIndex >= 0) {
    state.paymentLamports += lamports
    context.paymentIndexes.push(paymentIndex)
    context.operationCount++
    return null
  }

  const { feeWallet } = state.expectation
  if (feeWallet === null || recipient === feeWallet) {
    if (feeWallet === null) state.warnings.add(UNPINNED_FEE_WALLET_WARNING)
    state.serviceFeeLamports += lamports
    return null
  }

  return `sends ${formatLamportsAsSol(lamports)} to ${recipient}, which is neither the fee wallet nor a recipient you entered`
}

const checkSystemInstruction = (instruction: TransactionInstruction, context: TransactionContext): string | null => {
  const { wallet } = context.state.expectation
  const type = SystemInstruction.decodeInstructionType(instruction)

  if (type === 'Transfer') {
    const { fromPubkey, toPubkey, lamports } = SystemInstruction.decodeTransfer(instruction)
    if (fromPubkey.toBase58() !== wallet) return `transfers SOL from ${fromPubkey.toBase58()} instead of your wallet`
    return checkSolTransfer(toPubkey.toBase58(), lamports, context)
  }

  if (type === 'CreateWithSeed') {
    const { fromPubkey, basePubkey, newAccountPubkey, lamports, space, programId } = SystemInstruction.decodeCreateWithSeed(instruction)
    const newAccount = newAccountPubkey.toBase58()
    if (fromPubkey.toBase58() !== wallet || basePubkey.toBase58() !== wallet) {
      return `funds a new account from ${fromPubkey.toBase58()} instead of your wallet`
    }
    const reason = context.state.rules.checkSeedAccountCreation?.({ address: newAccount, owner: programId.toBase58(), space })
    if (reason !== null) return reason ?? `creates an unexpected account ${newAccount}`
    context.state.rentLamports += BigInt(lamports)
    return null
  }

  if (type === 'Create') {
    const { fromPubkey, newAccountPubkey, lamports, programId } = SystemInstruction.decodeCreateAccount(instruction)
    const newAccount = newAccountPubkey.toBase58()
    if (fromPubkey.toBase58() !== wallet) return `funds a new account from ${fromPubkey.toBase58()} instead of your wallet`
    const allowedOwners = context.state.rules.newAccountOwners.get(newAccount)
    if (!allowedOwners) return `creates an unexpected account ${newAccount}`
    if (!allowedOwners.has(programId.toBase58())) return `creates account ${newAccount} for an unexpected program ${programId.toBase58()}`
    context.state.rentLamports += BigInt(lamports)
    return null
  }

  return `contains an unexpected System Program instruction (${type})`
}

const checkComputeBudgetInstruction = (instruction: TransactionInstruction, context: TransactionContext): string | null => {
  const { computeBudget } = context
  const type = ComputeBudgetInstruction.decodeInstructionType(instruction)

  if (type === 'SetComputeUnitLimit') {
    if (computeBudget.unitLimit !== undefined) return 'sets the compute unit limit more than once'
    computeBudget.unitLimit = ComputeBudgetInstruction.decodeSetComputeUnitLimit(instruction).units
    return null
  }

  if (type === 'SetComputeUnitPrice') {
    if (computeBudget.unitPriceMicroLamports !== undefined) return 'sets the priority fee more than once'
    computeBudget.unitPriceMicroLamports = BigInt(ComputeBudgetInstruction.decodeSetComputeUnitPrice(instruction).microLamports)
    return null
  }

  return `contains an unexpected compute budget instruction (${type})`
}

const checkAssociatedTokenInstruction = (instruction: TransactionInstruction, context: TransactionContext): string | null => {
  const { state } = context
  const decoded = decodeAssociatedTokenInstruction(instruction)
  if (decoded.type === 'unsupported') return `contains an unexpected ${decoded.label}`

  if (decoded.payer !== state.expectation.wallet) return `token account rent is paid by ${decoded.payer} instead of your wallet`
  if (decoded.systemProgram !== SYSTEM_PROGRAM_ADDRESS) return 'creates a token account with an unexpected system program'
  if (!TOKEN_PROGRAM_ADDRESSES.has(decoded.tokenProgram)) return `creates a token account for an unexpected program ${decoded.tokenProgram}`
  if (decoded.ata !== state.resolveAta(decoded.owner, decoded.mint, decoded.tokenProgram)) {
    return `creates token account ${decoded.ata}, which is not the associated token account of ${decoded.owner}`
  }

  const account: CreatedTokenAccount = {
    address: decoded.ata,
    owner: decoded.owner,
    mint: decoded.mint,
    tokenProgram: decoded.tokenProgram,
  }
  const reason = state.rules.checkCreatedTokenAccount(account)
  if (reason) return reason

  state.createdTokenAccounts.set(account.address, account)
  return null
}

/** Token instructions the rules accept are, by construction, part of the requested operation. */
const checkTokenProgramInstruction = (instruction: TransactionInstruction, context: TransactionContext): string | null => {
  const reason = context.state.rules.checkTokenInstruction(decodeTokenInstruction(instruction), (paymentIndex) =>
    context.paymentIndexes.push(paymentIndex)
  )
  if (reason === null) context.operationCount++
  return reason
}

/** Checks one top-level instruction; decoding errors count as malformed instructions (fail closed). */
const checkInstruction = (instruction: TransactionInstruction, context: TransactionContext): string | null => {
  const programAddress = instruction.programId.toBase58()
  const { rules } = context.state
  const isOpaqueProgram = rules.opaquePrograms?.has(programAddress) === true
  if (!ALLOWED_PROGRAM_ADDRESSES.has(programAddress) && !isOpaqueProgram) return `invokes an unexpected program ${programAddress}`
  if (MEMO_PROGRAM_ADDRESSES.has(programAddress)) return null

  try {
    if (isOpaqueProgram) {
      const reason = rules.checkOpaqueInstruction
        ? rules.checkOpaqueInstruction(instruction)
        : `invokes an unexpected program ${programAddress}`
      if (reason === null) context.operationCount++
      return reason
    }
    if (programAddress === SYSTEM_PROGRAM_ADDRESS) return checkSystemInstruction(instruction, context)
    if (programAddress === COMPUTE_BUDGET_PROGRAM_ADDRESS) return checkComputeBudgetInstruction(instruction, context)
    if (programAddress === ASSOCIATED_TOKEN_PROGRAM_ADDRESS) return checkAssociatedTokenInstruction(instruction, context)
    return checkTokenProgramInstruction(instruction, context)
  } catch {
    return `contains a malformed instruction for program ${programAddress}`
  }
}

/** Base fee (per signature) plus the priority fee implied by the compute budget. */
const getNetworkFeeLamports = (
  decoded: DecodedPreparedTransaction,
  computeBudget: TransactionContext['computeBudget']
): { networkFee: bigint; priorityFee: bigint } => {
  const programInstructionCount = decoded.instructions.filter(
    (instruction) => instruction.programId.toBase58() !== COMPUTE_BUDGET_PROGRAM_ADDRESS
  ).length
  const unitLimit = Math.min(computeBudget.unitLimit ?? programInstructionCount * DEFAULT_COMPUTE_UNITS_PER_INSTRUCTION, MAX_COMPUTE_UNITS)
  const unitPrice = computeBudget.unitPriceMicroLamports ?? ZERO
  const priorityFee = (unitPrice * BigInt(unitLimit) + MICRO_LAMPORTS_PER_LAMPORT - BigInt(1)) / MICRO_LAMPORTS_PER_LAMPORT

  return { priorityFee, networkFee: BASE_FEE_LAMPORTS_PER_SIGNATURE * BigInt(decoded.requiredSigners.length) + priorityFee }
}

const verifyTransaction = (
  transaction: PreparedTransaction,
  index: number,
  transactionCount: number,
  lookupTables: readonly AddressLookupTableAccount[],
  state: VerificationState
): void => {
  const prefix = transactionCount > 1 ? `Transaction ${String(index + 1)} ` : 'The transaction '
  const report = (reason: string): void => {
    state.reasons.push(prefix + reason)
  }
  const context: TransactionContext = { state, paymentIndexes: [], computeBudget: {}, operationCount: 0 }
  const reasonCountBefore = state.reasons.length
  state.paymentIndexesByTransaction.push(context.paymentIndexes)

  let decoded: DecodedPreparedTransaction
  try {
    decoded = decodePreparedTransaction(transaction, lookupTables)
  } catch {
    report('cannot be decoded')
    return
  }

  const { wallet } = state.expectation
  if (decoded.feePayer !== wallet) report(`makes ${decoded.feePayer} pay the network fee instead of your wallet`)
  for (const signer of decoded.requiredSigners) {
    if (signer !== wallet && !state.rules.additionalSigners.has(signer)) report(`requires an unexpected signer ${signer}`)
  }

  for (const instruction of decoded.instructions) {
    const reason = checkInstruction(instruction, context)
    if (reason) report(reason)
  }

  const { networkFee, priorityFee } = getNetworkFeeLamports(decoded, context.computeBudget)
  if (priorityFee > MAX_PRIORITY_FEE_LAMPORTS_PER_TRANSACTION) {
    report(
      `sets a priority fee of ${formatLamportsAsSol(priorityFee)} (limit ${formatLamportsAsSol(MAX_PRIORITY_FEE_LAMPORTS_PER_TRANSACTION)})`
    )
  }
  // An otherwise valid transaction that does nothing the user asked for (e.g. only a memo, or only a fee)
  // just burns network fees; this also bounds the count by the number of requested operations
  if (context.operationCount === 0 && state.reasons.length === reasonCountBefore) report('performs none of the operations you asked for')
  state.networkFeeLamports += networkFee
}

/** Checks the SOL totals against the displayed fee and the expected rent. */
const checkTotals = (state: VerificationState): void => {
  const { maxServiceFeeLamports } = state.expectation
  if (state.serviceFeeLamports > maxServiceFeeLamports + SOL_TOLERANCE_LAMPORTS) {
    state.reasons.push(
      `The service fee is ${formatLamportsAsSol(state.serviceFeeLamports)}, more than the ${formatLamportsAsSol(maxServiceFeeLamports)} you were shown`
    )
  }
  if (state.rentLamports > state.rules.maxRentLamports + SOL_TOLERANCE_LAMPORTS) {
    state.reasons.push(
      `New accounts are funded with ${formatLamportsAsSol(state.rentLamports)}, more than the expected ${formatLamportsAsSol(state.rules.maxRentLamports)}`
    )
  }
}

/**
 * Verifies server-prepared transactions against what the user asked for (see the module comment).
 * All transactions of one request are verified together: fees and payments are totalled across them.
 *
 * @param transactions - Deserialized prepared transactions, with their final blockhash already set.
 * @param expectation - What the user asked for (form values and displayed fee only).
 * @param lookupTables - Address lookup tables loaded by the client (fetchAddressLookupTables).
 * @returns `ok` with a spending summary, or the human-readable reasons the transactions are unsafe.
 */
export function verifyPreparedTransactions(
  transactions: readonly PreparedTransaction[],
  expectation: PreparedTransactionExpectation,
  lookupTables: readonly AddressLookupTableAccount[] = []
): PreparedTransactionVerification {
  const resolveAta = createAtaResolver()
  const state: VerificationState = {
    expectation,
    rules: buildOperationRules(expectation, resolveAta),
    resolveAta,
    reasons: [],
    warnings: new Set(),
    createdTokenAccounts: new Map(),
    paymentIndexesByTransaction: [],
    serviceFeeLamports: ZERO,
    paymentLamports: ZERO,
    rentLamports: ZERO,
    networkFeeLamports: ZERO,
  }

  if (transactions.length === 0) {
    return { ok: false, reasons: ['The server returned no transactions'], warnings: [] }
  }

  transactions.forEach((transaction, index) => verifyTransaction(transaction, index, transactions.length, lookupTables, state))
  checkTotals(state)
  state.reasons.push(...state.rules.finalize())

  const warnings = [...state.warnings]
  if (state.reasons.length > 0) {
    return { ok: false, reasons: state.reasons, warnings }
  }

  return {
    ok: true,
    warnings,
    summary: {
      transactionCount: transactions.length,
      serviceFeeLamports: state.serviceFeeLamports,
      paymentLamports: state.paymentLamports,
      rentLamports: state.rentLamports,
      networkFeeLamports: state.networkFeeLamports,
      createdTokenAccounts: [...state.createdTokenAccounts.values()],
      paymentIndexesByTransaction: state.paymentIndexesByTransaction,
    },
  }
}
