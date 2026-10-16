import { createApiRoute } from '@/lib/api'
import { getDiscountCoupon } from '@/lib/contentful/client'
import { discountCouponRequestSchema } from '@/lib/schemas/apiSchemas'
import { AppError } from '@/lib/errors'
import { COUPON_UNAVAILABLE_MESSAGE } from '@/lib/solana/server-side/discountedServiceFee'
import { withMinimumDuration } from '../_lib/withMinimumDuration'

/**
 * POST /api/discount-coupon/validate
 *
 * Read-only preview of a discount coupon for the fee breakdown UI. Returns the discount
 * percentage when the coupon exists and has remaining usage (or no usage limit).
 *
 * Unknown and exhausted coupons get the same 404 body, and every response is padded to
 * the same minimum duration, so the endpoint does not reveal which codes exist.
 * Usage is only counted when a tool transaction is built (see applyCouponToServiceFee).
 */
export const POST = createApiRoute({
  name: 'discount-coupon/validate',
  schema: discountCouponRequestSchema,
  handler: async ({ couponCode }) =>
    withMinimumDuration(async () => {
      const coupon = await getDiscountCoupon(couponCode)

      if (!coupon || (!coupon.noUsageLimit && coupon.remainingUsage <= 0)) {
        throw new AppError('NOT_FOUND', COUPON_UNAVAILABLE_MESSAGE, 404)
      }

      return {
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
      }
    }),
})
