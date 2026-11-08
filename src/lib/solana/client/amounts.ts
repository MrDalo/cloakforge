/**
 * Amount helpers for client-side transaction verification (raw base units as bigint, never floats).
 */

import { formatRawTokenAmount, LAMPORTS_PER_SOL, parseTokenAmount } from '@/lib/solana'

/** SOL amounts use 9 decimals (lamports). */
export const SOL_DECIMALS = 9

/**
 * Raw amounts (base units) that faithfully represent a UI amount at `decimals`:
 * - the exact decimal conversion, when the amount has no more fractional digits than `decimals`;
 * - the floor and the round of float scaling (`amount * 10 ** decimals`), which some server builders
 *   still use (WEB3-17). Both are within one base unit of the user's intent.
 *
 * @param amount - UI amount the user entered.
 * @param decimals - Decimals of the asset (from the instruction or the mint, never guessed).
 * @returns Set of acceptable raw amounts (empty when the amount is not a positive number).
 */
export const acceptedRawAmounts = (amount: number | string, decimals: number): ReadonlySet<bigint> => {
  const accepted = new Set<bigint>()

  try {
    accepted.add(parseTokenAmount(amount, decimals))
  } catch {
    // Not exactly representable at these decimals: only the float-scaled forms below can match
  }

  const scaled = Number(amount) * 10 ** decimals
  if (Number.isFinite(scaled) && scaled > 0) {
    accepted.add(BigInt(Math.floor(scaled)))
    accepted.add(BigInt(Math.round(scaled)))
  }

  return accepted
}

/**
 * Converts a SOL amount (e.g. a displayed fee) to lamports, rounding up so the result is an upper bound.
 *
 * @param sol - Amount in SOL (non-negative).
 * @returns Lamports, rounded up; 0 for non-finite or negative input.
 */
export const solToLamportsCeil = (sol: number): bigint => {
  const lamports = Math.ceil(sol * LAMPORTS_PER_SOL)
  return Number.isFinite(lamports) && lamports > 0 ? BigInt(lamports) : BigInt(0)
}

/**
 * Formats lamports as an exact SOL string for user-facing messages.
 *
 * @param lamports - Amount in lamports.
 * @returns e.g. "0.0015 SOL".
 */
export const formatLamportsAsSol = (lamports: bigint): string => `${formatRawTokenAmount(lamports, SOL_DECIMALS)} SOL`
