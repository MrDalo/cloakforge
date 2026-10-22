/**
 * Upper bound for the SOL sent to the fee wallet, derived from the coupon the user applied.
 * Browser-safe. Mirrors the server (`applyCouponToServiceFee`): the discount applies to the service
 * (base) fee only, never to option add-ons, and 100% means a zero fee.
 */

import { solToLamportsCeil } from './amounts'

/**
 * Service fee in SOL after a coupon discount, using the same arithmetic as the server.
 *
 * @param baseFeeSol - Undiscounted service fee in SOL.
 * @param discountPercentage - Applied coupon discount (clamped to 0..100; missing or non-finite means no discount).
 * @returns Discounted fee in SOL.
 */
export const discountServiceFeeSol = (baseFeeSol: number, discountPercentage?: number): number => {
  const percentage =
    discountPercentage !== undefined && Number.isFinite(discountPercentage) ? Math.min(Math.max(discountPercentage, 0), 100) : 0

  return percentage >= 100 ? 0 : baseFeeSol * (1 - percentage / 100)
}

export interface ServiceFeeLimitInput {
  /** Undiscounted service fee per unit, in SOL */
  baseFeeSol: number
  /** Discount of the coupon applied when the request was sent (undefined without a coupon) */
  discountPercentage?: number
  /** Number of units the per-unit fee is charged for (e.g. wallets in a batch); defaults to 1 */
  units?: number
  /** Option fees charged on top of the service fee; never discounted */
  addOnFeesSol?: number
}

/**
 * Maximum lamports the fee wallet may legitimately receive for one request, rounded UP to whole
 * lamports so it is never below what the server charges (the server floors).
 *
 * @param input - Base fee, applied coupon discount, unit count and add-on fees.
 * @returns Limit for `maxServiceFeeLamports`.
 */
export const getMaxServiceFeeLamports = ({ baseFeeSol, discountPercentage, units = 1, addOnFeesSol = 0 }: ServiceFeeLimitInput): bigint =>
  solToLamportsCeil(discountServiceFeeSol(baseFeeSol, discountPercentage) * units + addOnFeesSol)
