/**
 * Price math for verifying Raydium CLMM instructions in the browser, without the Raydium SDK.
 *
 * Mirrors what the server's SDK calls do with the user's prices (@raydium-io/raydium-sdk-v2 0.2.39-alpha,
 * `src/raydium/clmm/utils/math.ts`): `SqrtPriceMath.priceToSqrtPriceX64` and
 * `TickMath.getTickWithPriceAndTickspacing`, including inverting the price when Raydium's mint order is the
 * reverse of the user's.
 */

import Decimal from 'decimal.js'

/** Largest relative difference (parts per billion) between the instruction's sqrt price and the expected one. */
const SQRT_PRICE_TOLERANCE_PPB = BigInt(1)
const PPB = BigInt(1_000_000_000)

/** Price of one tick step: price(tick) = 1.0001 ^ tick. */
const LN_TICK_BASE = new Decimal('1.0001').ln()

const Q64 = Decimal.pow(2, 64)

/** Parses a positive finite price, or null. */
export function parsePrice(price: string): Decimal | null {
  try {
    const value = new Decimal(price)
    return value.isFinite() && value.gt(0) ? value : null
  } catch {
    return null
  }
}

/** The user's price (token B per token A) in Raydium's order (mint1 per mint0). */
const toRaydiumOrder = (price: Decimal, swapped: boolean): Decimal => (swapped ? new Decimal(1).div(price) : price)

/** price × 10^(decimals1 − decimals0): the raw-unit price whose square root is the sqrt price. */
const toRawPrice = (price: Decimal, decimals0: number, decimals1: number): Decimal => price.mul(Decimal.pow(10, decimals1 - decimals0))

/**
 * The sqrt price (Q64.64) the server's `clmm.createPool` computes for the user's initial price.
 *
 * @param initialPrice - Price in token B per token A.
 * @param swapped - Whether Raydium's mint order is the reverse of the user's.
 * @param decimals0 - Decimals of Raydium's mint0.
 * @param decimals1 - Decimals of Raydium's mint1.
 * @returns The sqrt price, or null when the price is not a positive number.
 */
export function expectedSqrtPriceX64(initialPrice: string, swapped: boolean, decimals0: number, decimals1: number): bigint | null {
  const price = parsePrice(initialPrice)
  if (!price) return null
  const sqrtPrice = toRawPrice(toRaydiumOrder(price, swapped), decimals0, decimals1).sqrt()
  return BigInt(sqrtPrice.mul(Q64).floor().toFixed())
}

/** Whether `actual` is the expected sqrt price (the instruction's integer against the independently recomputed one). */
export function isExpectedSqrtPrice(actual: bigint, expected: bigint): boolean {
  const difference = actual > expected ? actual - expected : expected - actual
  return difference * PPB <= expected * SQRT_PRICE_TOLERANCE_PPB
}

/** Rounds a tick to the pool's tick spacing away from zero (SDK getTickWithPriceAndTickspacing). */
const roundToTickSpacing = (tick: number, tickSpacing: number): number => {
  const rounded = tick < 0 ? Math.floor(tick / tickSpacing) * tickSpacing : Math.ceil(tick / tickSpacing) * tickSpacing
  return rounded === 0 ? 0 : rounded
}

/**
 * The tick indexes the server may compute for a price bound: the price's exact tick (and its neighbours,
 * to absorb the SDK's fixed-point approximation at tick boundaries) rounded to the tick spacing.
 *
 * @param price - Price bound in the user's quote (token B per token A). When Raydium's order is swapped the
 *   server inverts the range, so the lower tick comes from the user's max price and the upper from the min.
 * @param swapped - Whether Raydium's mint order is the reverse of the user's.
 * @param tickSpacing - The fee tier's tick spacing.
 * @param decimals0 - Decimals of Raydium's mint0.
 * @param decimals1 - Decimals of Raydium's mint1.
 * @returns The acceptable ticks (empty when the price is not a positive number).
 */
export function expectedTicks(
  price: string,
  swapped: boolean,
  tickSpacing: number,
  decimals0: number,
  decimals1: number
): ReadonlySet<number> {
  const parsed = parsePrice(price)
  if (!parsed) return new Set()

  const rawPrice = toRawPrice(toRaydiumOrder(parsed, swapped), decimals0, decimals1)
  const exactTick = Math.floor(rawPrice.ln().div(LN_TICK_BASE).toNumber())
  return new Set([exactTick - 1, exactTick, exactTick + 1].map((tick) => roundToTickSpacing(tick, tickSpacing)))
}
