import { createApiRoute } from '@/lib/api'
import { discountCouponRequestSchema } from '@/lib/schemas/apiSchemas'
import { AppError } from '@/lib/errors'
import { COUPON_UNAVAILABLE_MESSAGE, getAvailableDiscountCoupon } from '@/lib/solana/server-side/discountedServiceFee'
import { COUPON_VALIDATE_MIN_DURATION_MS, withMinimumDuration } from '../_lib/withMinimumDuration'
import { IS_SHOWCASE_MODE } from '@/lib/config/network'

/**
 * POST /api/discount-coupon/validate
 *
 * Read-only preview of a discount coupon for the fee breakdown UI. Runs the same availability
 * check the tool builders use (getAvailableDiscountCoupon: published Delivery entry + confirmed
 * uses in the coupon marker's on-chain history since the entry's latest publish, cached), so the
 * UI reflects real availability, and returns the published discount percentage.
 *
 * Unknown and exhausted coupons get the same 404 body, and every response is padded to
 * COUPON_VALIDATE_MIN_DURATION_MS (above a Contentful lookup + one on-chain page), so timing
 * does not normally reveal which codes exist. Residual leaks: a slow RPC can push an existing
 * code past the floor, and an existing code answers 503 (fail closed) instead of 404 when its
 * usage cannot be verified. Rate-limit this route (Vercel WAF). Nothing is counted
 * here: a use is counted only once a tool transaction carrying the coupon instructions (memo +
 * 0-lamport marker transfer) confirms.
 */
export const POST = createApiRoute({
  name: 'discount-coupon/validate',
  schema: discountCouponRequestSchema,
  handler: async ({ couponCode }) => {
    // The devnet showcase processes no coupons: refuse before any lookup
    if (IS_SHOWCASE_MODE) {
      throw new AppError('TOOL_DISABLED', 'Discount coupons are not available in the devnet showcase', 503)
    }
    return withMinimumDuration(async () => {
      const coupon = await getAvailableDiscountCoupon(couponCode)

      if (!coupon) {
        throw new AppError('NOT_FOUND', COUPON_UNAVAILABLE_MESSAGE, 404)
      }

      return {
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
      }
    }, COUPON_VALIDATE_MIN_DURATION_MS)
  },
})
