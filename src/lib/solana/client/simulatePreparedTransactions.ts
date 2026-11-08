/**
 * Simulates prepared transactions through the client's RPC before the wallet is asked to sign.
 *
 * Policy (fail closed on results, not on outages):
 * - the simulation returns an error → `failed`: the caller must not sign (the transaction would fail,
 *   or does something the static checks cannot see);
 * - the simulation request itself fails (RPC outage, rate limit, network) → `unavailable`: the caller
 *   may continue, because the static verifier already passed and `sendRawTransaction` runs the RPC's
 *   preflight simulation again (`skipPreflight: false`) before anything can land.
 */

import { type Connection, Transaction, VersionedTransaction } from '@solana/web3.js'
import type { PreparedTransaction } from './decodePreparedTransaction'

/** Concurrent simulation requests (bounded so a large multisend does not burst the public RPC). */
export const SIMULATION_CONCURRENCY = 4
/** Program log lines kept from a failed simulation (the tail, where the error is). */
export const MAX_SIMULATION_LOG_LINES = 6
/** Characters kept per log line and for the error description. */
export const MAX_SIMULATION_TEXT_LENGTH = 160

export type SimulationOutcome =
  | { status: 'passed' }
  | { status: 'failed'; error: string; logs: string[] }
  | { status: 'unavailable'; error: string }

const truncate = (text: string): string =>
  text.length > MAX_SIMULATION_TEXT_LENGTH ? `${text.slice(0, MAX_SIMULATION_TEXT_LENGTH)}…` : text

/**
 * Keeps the last {@link MAX_SIMULATION_LOG_LINES} log lines, each shortened.
 *
 * @param logs - Program logs from the simulation (may be null).
 * @returns Truncated tail of the logs.
 */
const truncateSimulationLogs = (logs: readonly string[] | null | undefined): string[] =>
  (logs ?? []).slice(-MAX_SIMULATION_LOG_LINES).map(truncate)

const describeError = (error: unknown): string => {
  if (error instanceof Error) return truncate(error.message)
  return truncate(typeof error === 'string' ? error : JSON.stringify(error))
}

/** Simulation takes a versioned transaction; a legacy one is wrapped around its compiled message. */
const toVersionedTransaction = (transaction: PreparedTransaction): VersionedTransaction =>
  transaction instanceof Transaction ? new VersionedTransaction(transaction.compileMessage()) : transaction

/**
 * Simulates one prepared transaction without signatures, against the latest blockhash.
 *
 * @param connection - Client RPC connection.
 * @param transaction - Prepared (unsigned) transaction.
 * @returns The simulation outcome; never throws.
 */
async function simulatePreparedTransaction(connection: Connection, transaction: PreparedTransaction): Promise<SimulationOutcome> {
  let result: Awaited<ReturnType<Connection['simulateTransaction']>>
  try {
    result = await connection.simulateTransaction(toVersionedTransaction(transaction), {
      sigVerify: false,
      replaceRecentBlockhash: true,
      commitment: 'confirmed',
    })
  } catch (error) {
    return { status: 'unavailable', error: describeError(error) }
  }

  const { err, logs } = result.value
  return err ? { status: 'failed', error: describeError(err), logs: truncateSimulationLogs(logs) } : { status: 'passed' }
}

/**
 * Simulates every prepared transaction, at most {@link SIMULATION_CONCURRENCY} at a time.
 *
 * @param connection - Client RPC connection.
 * @param transactions - Prepared (unsigned) transactions.
 * @returns One outcome per transaction, in order.
 */
export async function simulatePreparedTransactions(
  connection: Connection,
  transactions: readonly PreparedTransaction[]
): Promise<SimulationOutcome[]> {
  const outcomes: SimulationOutcome[] = []
  for (let start = 0; start < transactions.length; start += SIMULATION_CONCURRENCY) {
    const chunk = transactions.slice(start, start + SIMULATION_CONCURRENCY)
    outcomes.push(...(await Promise.all(chunk.map((transaction) => simulatePreparedTransaction(connection, transaction)))))
  }
  return outcomes
}
