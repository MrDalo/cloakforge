/**
 * Tracks which expected payments the prepared transactions make, so every payment is made exactly
 * once (no double pay, no missing recipient) and with the amount the user entered.
 */

import { acceptedRawAmounts } from './amounts'
import type { ExpectedPayment } from './transactionExpectation'

export interface PaymentLedger {
  /**
   * Marks the first unpaid candidate payment whose amount matches `rawAmount` as paid.
   *
   * @param candidateIndexes - Payments that may receive this transfer (same destination).
   * @param rawAmount - Transferred amount in base units.
   * @param decimals - Decimals the amount is expressed in.
   * @returns The settled payment index, or -1 when nothing matches.
   */
  settle(candidateIndexes: readonly number[], rawAmount: bigint, decimals: number): number
  /** Indexes of the payments no transfer settled. */
  unpaidIndexes(): number[]
}

/**
 * Creates a ledger over the payments the user asked for.
 *
 * @param payments - Expected payments, in form order.
 * @returns A ledger with every payment unpaid.
 */
export function createPaymentLedger(payments: readonly ExpectedPayment[]): PaymentLedger {
  const paid = payments.map(() => false)
  const acceptedAmountsCache = new Map<string, ReadonlySet<bigint>>()

  const accepts = (index: number, rawAmount: bigint, decimals: number): boolean => {
    const cacheKey = `${index}:${decimals}`
    let accepted = acceptedAmountsCache.get(cacheKey)
    if (!accepted) {
      accepted = acceptedRawAmounts(payments[index].amount, decimals)
      acceptedAmountsCache.set(cacheKey, accepted)
    }
    return accepted.has(rawAmount)
  }

  return {
    settle(candidateIndexes, rawAmount, decimals) {
      const index = candidateIndexes.find((candidate) => !paid[candidate] && accepts(candidate, rawAmount, decimals))
      if (index === undefined) return -1
      paid[index] = true
      return index
    },
    unpaidIndexes: () => paid.flatMap((isPaid, index) => (isPaid ? [] : [index])),
  }
}

/**
 * Groups payment indexes by a destination key (recipient wallet, or its ATA).
 *
 * @param payments - Expected payments.
 * @param toKey - Maps a payment to the account that receives it.
 * @returns Destination → payment indexes.
 */
export const indexPaymentsByDestination = (
  payments: readonly ExpectedPayment[],
  toKey: (payment: ExpectedPayment) => string
): ReadonlyMap<string, number[]> => {
  const byDestination = new Map<string, number[]>()
  payments.forEach((payment, index) => {
    const key = toKey(payment)
    const indexes = byDestination.get(key)
    if (indexes) {
      indexes.push(index)
    } else {
      byDestination.set(key, [index])
    }
  })
  return byDestination
}
