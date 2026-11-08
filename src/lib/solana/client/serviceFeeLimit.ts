/**
 * Upper bound for the SOL sent to the fee wallet, derived from the coupon the user applied.
 * Browser-safe. Mirrors the server (`applyCouponToServiceFee`): the discount applies to the service
 * (base) fee only, never to option add-ons, and 100% means a zero fee.
 */

import { AppError } from '@/lib/errors'
import { formatLamportsAsSol, solToLamportsCeil } from './amounts'

/**
 * Absolute ceiling for each tool's undiscounted service fee (SOL), compiled into the bundle so a
 * compromised server cannot raise it through the Contentful config it serves. Units follow the fee
 * model of `DEFAULT_TOOL_BASE_FEES_SOL` (multisender per recipient, freeze / unfreeze per wallet, the
 * rest per transaction). About 3x today's fees; raising a fee above its ceiling needs a client release.
 * Token-creator add-ons (0.05 SOL each) are client constants (`toolFeeConfigs`), not served.
 */
export const MAX_TOOL_BASE_FEE_SOL = {
  'token-creator': 0.6,
  'burn-tokens': 0.03,
  'transaction-multisender': 0.003,
  'freeze-wallets': 0.03,
  'unfreeze-wallets': 0.03,
  'revoke-mint-authority': 0.3,
  'revoke-freeze-authority': 0.3,
  'revoke-metadata-authority': 0.15,
  'update-metadata': 0.15,
  'liquidity-provider': 0.3,
} as const satisfies Record<string, number>

/** Tools that charge a service fee and therefore have a ceiling. */
export type FeeCeilingToolId = keyof typeof MAX_TOOL_BASE_FEE_SOL

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
  /** Tool being run; selects the absolute fee ceiling */
  toolId: FeeCeilingToolId
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
 * The served `baseFeeSol` is never clamped: above the tool's ceiling ({@link MAX_TOOL_BASE_FEE_SOL}) the
 * request fails closed, so neither the displayed fee nor the verifier limit can be raised by the server.
 *
 * @param input - Tool, base fee, applied coupon discount, unit count and add-on fees.
 * @returns Limit for `maxServiceFeeLamports`.
 * @throws AppError TRANSACTION_VERIFICATION_FAILED when the base fee is invalid or above the tool's ceiling.
 */
export const getMaxServiceFeeLamports = ({
  toolId,
  baseFeeSol,
  discountPercentage,
  units = 1,
  addOnFeesSol = 0,
}: ServiceFeeLimitInput): bigint => {
  const ceilingSol = MAX_TOOL_BASE_FEE_SOL[toolId]
  // Negated comparison so NaN is rejected too
  if (!(baseFeeSol >= 0 && baseFeeSol <= ceilingSol)) {
    const served = Number.isFinite(baseFeeSol)
      ? formatLamportsAsSol(solToLamportsCeil(Math.max(baseFeeSol, 0)))
      : `${String(baseFeeSol)} SOL`
    throw new AppError(
      'TRANSACTION_VERIFICATION_FAILED',
      `The ${toolId} service fee (${served}) is higher than this app allows (${formatLamportsAsSol(solToLamportsCeil(ceilingSol))}), so nothing was sent to your wallet.`
    )
  }

  return solToLamportsCeil(discountServiceFeeSol(baseFeeSol, discountPercentage) * units + addOnFeesSol)
}
