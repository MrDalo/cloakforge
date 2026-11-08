/**
 * Exact token amount conversion (UI amount ⇄ raw u64 base units).
 *
 * Amounts are converted with decimal-string arithmetic and `bigint`, never with
 * floating-point scaling (`Math.round(x * 10 ** d)`), so a value such as "1.000001"
 * with 6 decimals becomes exactly 1000001 base units.
 */

import { AppError } from '@/lib/errors'

/** Largest value an SPL Token amount (u64) can hold. */
export const U64_MAX = BigInt('18446744073709551615')

/** Plain decimal notation: digits with an optional fractional part (no sign, no exponent). */
const DECIMAL_AMOUNT_REGEX = /^(\d+)(?:\.(\d+))?$/

/** Shape of `String(number)` when JavaScript switches to exponent notation. */
const EXPONENT_NOTATION_REGEX = /^(-?)(\d+)(?:\.(\d+))?e([+-]\d+)$/i

/**
 * Converts a JS number to plain decimal notation using its shortest round-trip
 * representation (the same digits `JSON.stringify` produced on the client).
 */
const numberToDecimalString = (value: number): string => {
  const text = String(value)
  const match = EXPONENT_NOTATION_REGEX.exec(text)
  if (!match) return text

  const [, sign, intDigits, fractionDigits = '', exponentText] = match
  const digits = intDigits + fractionDigits
  const pointIndex = intDigits.length + Number(exponentText)

  if (pointIndex <= 0) return `${sign}0.${'0'.repeat(-pointIndex)}${digits}`
  if (pointIndex >= digits.length) return `${sign}${digits}${'0'.repeat(pointIndex - digits.length)}`
  return `${sign}${digits.slice(0, pointIndex)}.${digits.slice(pointIndex)}`
}

/**
 * Normalizes an amount (number or decimal string) to plain decimal notation.
 *
 * @param amount - UI amount as a JS number or a decimal string.
 * @returns Trimmed decimal string.
 * @throws AppError INVALID_AMOUNT / AMOUNT_TOO_LARGE for non-finite or imprecise numbers.
 */
export const toDecimalAmountString = (amount: number | string): string => {
  if (typeof amount === 'string') return amount.trim()

  if (!Number.isFinite(amount)) {
    throw new AppError('INVALID_AMOUNT', 'Amount must be a finite number')
  }
  // Above 2^53 a JS number can no longer carry every integer exactly — require a decimal string instead
  if (Math.abs(amount) > Number.MAX_SAFE_INTEGER) {
    throw new AppError('AMOUNT_TOO_LARGE', 'Amount is too large to be sent as a number; send it as a decimal string')
  }
  return numberToDecimalString(amount)
}

/**
 * Converts a UI amount to raw base units (u64) using the mint's decimals.
 *
 * Rejects (with AppError) amounts that are not plain positive decimals, are zero,
 * carry more fractional digits than `decimals` (trailing zeros are allowed), or
 * overflow u64.
 *
 * @param amount - UI amount (number or decimal string, e.g. "1.000001").
 * @param decimals - Mint decimals read on-chain.
 * @returns Raw amount as bigint (1 ≤ raw ≤ U64_MAX).
 */
export const parseTokenAmount = (amount: number | string, decimals: number): bigint => {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new AppError('INVALID_INPUT', `Invalid token decimals: ${decimals}`)
  }

  const text = toDecimalAmountString(amount)
  const match = DECIMAL_AMOUNT_REGEX.exec(text)
  if (!match) {
    throw new AppError('INVALID_AMOUNT', `Invalid amount "${text}": use a positive decimal number such as 1.5`)
  }

  const [, wholeDigits, fractionDigits = ''] = match
  const significantFraction = fractionDigits.replace(/0+$/, '')
  if (significantFraction.length > decimals) {
    throw new AppError(
      'INVALID_AMOUNT',
      decimals === 0
        ? `Amount ${text} must be a whole number: this token has no decimal places`
        : `Amount ${text} has more than ${decimals} decimal places`
    )
  }

  const raw = BigInt(wholeDigits + significantFraction.padEnd(decimals, '0'))
  if (raw <= BigInt(0)) {
    throw new AppError('INVALID_AMOUNT', 'Amount must be greater than zero')
  }
  if (raw > U64_MAX) {
    throw new AppError('AMOUNT_TOO_LARGE', `Amount ${text} exceeds the maximum token amount (u64)`)
  }
  return raw
}

/**
 * Formats raw base units as an exact UI decimal string (no floating point).
 *
 * @param raw - Raw amount in base units.
 * @param decimals - Mint decimals.
 * @returns Decimal string without trailing fractional zeros (e.g. 1000001n, 6 → "1.000001").
 */
export const formatRawTokenAmount = (raw: bigint, decimals: number): string => {
  const digits = raw.toString().padStart(decimals + 1, '0')
  const whole = digits.slice(0, digits.length - decimals)
  const fraction = digits.slice(digits.length - decimals).replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole
}
