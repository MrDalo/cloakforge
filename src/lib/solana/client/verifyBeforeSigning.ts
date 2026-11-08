/**
 * The checks every tool hook runs between deserializing the server's transactions and asking the
 * wallet to sign them. Each step throws an AppError instead of returning when signing is unsafe.
 */

import type { Connection } from '@solana/web3.js'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import { fetchAddressLookupTables, type PreparedTransaction } from './decodePreparedTransaction'
import { simulatePreparedTransactions } from './simulatePreparedTransactions'
import type { PreparedTransactionExpectation, PreparedTransactionSummary } from './transactionExpectation'
import { verifyPreparedTransactions } from './verifyPreparedTransactions'

/** Reasons shown to the user (all of them are logged). */
const MAX_REASONS_SHOWN = 3
/** Simulation log lines shown to the user. */
const MAX_LOG_LINES_SHOWN = 3

export interface PreparedTransactionCheck {
  /** Client RPC connection (never the server's) */
  connection: Connection
  /** Deserialized transactions with their final blockhash set */
  transactions: readonly PreparedTransaction[]
  /** Tool id, for logs */
  toolId: string
}

const formatRejection = (reasons: readonly string[]): string => {
  const shown = reasons.slice(0, MAX_REASONS_SHOWN).join('; ')
  const hidden = reasons.length - MAX_REASONS_SHOWN
  return `The prepared transaction does not match your request, so it was not sent to your wallet: ${shown}${hidden > 0 ? ` (and ${String(hidden)} more)` : ''}.`
}

/**
 * Verifies the prepared transactions against the user's request (verifyPreparedTransactions).
 *
 * @param check - Connection, transactions and tool id.
 * @param expectation - What the user asked for.
 * @returns What the transactions will spend.
 * @throws AppError TRANSACTION_VERIFICATION_FAILED when they do not match (never sign then).
 */
export async function assertPreparedTransactionsMatch(
  check: PreparedTransactionCheck,
  expectation: PreparedTransactionExpectation
): Promise<PreparedTransactionSummary> {
  const logger = getLogger({ context: 'transaction-verification', tool: check.toolId })

  const lookupTables = await fetchAddressLookupTables(check.connection, check.transactions)
  const verification = verifyPreparedTransactions(check.transactions, expectation, lookupTables)
  for (const warning of verification.warnings) {
    logger.warn(warning)
  }

  if (!verification.ok) {
    logger.warn('Prepared transaction rejected before signing', undefined, { reasons: verification.reasons })
    throw new AppError('TRANSACTION_VERIFICATION_FAILED', formatRejection(verification.reasons))
  }

  return verification.summary
}

/**
 * Simulates the prepared transactions (policy: simulatePreparedTransactions.ts).
 *
 * @param check - Connection, transactions and tool id.
 * @throws AppError SIMULATION_FAILED when a simulation returns an error; an unavailable simulation is
 * logged and tolerated.
 */
export async function assertPreparedTransactionsSimulate(check: PreparedTransactionCheck): Promise<void> {
  const logger = getLogger({ context: 'transaction-verification', tool: check.toolId })
  const outcomes = await simulatePreparedTransactions(check.connection, check.transactions)

  const failedIndex = outcomes.findIndex((outcome) => outcome.status === 'failed')
  const failed = outcomes[failedIndex]
  if (failed?.status === 'failed') {
    logger.warn('Prepared transaction failed simulation', undefined, {
      transactionIndex: failedIndex,
      simulationError: failed.error,
      logs: failed.logs,
    })
    const label = outcomes.length > 1 ? ` (transaction ${String(failedIndex + 1)} of ${String(outcomes.length)})` : ''
    const logTail = failed.logs.slice(-MAX_LOG_LINES_SHOWN).join(' | ')
    throw new AppError(
      'SIMULATION_FAILED',
      `Transaction simulation failed${label}: ${failed.error}${logTail ? `. Program log: ${logTail}` : ''}. Nothing was sent to your wallet.`
    )
  }

  const unavailable = outcomes.filter((outcome) => outcome.status === 'unavailable')
  if (unavailable.length > 0) {
    logger.warn('Transaction simulation unavailable; continuing because the checks passed and the RPC preflight runs on send', undefined, {
      unavailableCount: unavailable.length,
    })
  }
}

/**
 * Verifies, then simulates, the prepared transactions. Call it right before `signTransaction`.
 *
 * @param check - Connection, transactions and tool id.
 * @param expectation - What the user asked for.
 * @returns What the transactions will spend.
 * @throws AppError TRANSACTION_VERIFICATION_FAILED or SIMULATION_FAILED — the hook must not sign.
 */
export async function verifyBeforeSigning(
  check: PreparedTransactionCheck,
  expectation: PreparedTransactionExpectation
): Promise<PreparedTransactionSummary> {
  const summary = await assertPreparedTransactionsMatch(check, expectation)
  await assertPreparedTransactionsSimulate(check)
  return summary
}
