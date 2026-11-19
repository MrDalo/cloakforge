import { createApiRoute } from '@/lib/api'
import { getDiscountCouponWithFallback } from '@/lib/contentful/discountCouponCache'
import { discountCouponRequestSchema } from '@/lib/schemas/apiSchemas'
import { AppError } from '@/lib/errors'

/**
 * POST /api/discount-coupon/validate
 *
 * Fetches the specific discount coupon from Contentful and validates it:
 * 1. Does the coupon exist?
 * 2. Is the remainingUsage counter > 0? (skipped for noUsageLimit coupons)
 * Returns the discount percentage when both checks pass.
 */
export const POST = createApiRoute({
  name: 'discount-coupon/validate',
  schema: discountCouponRequestSchema,
  handler: async ({ couponCode }) => {
    // Throws SERVICE_UNAVAILABLE (503) when Contentful is down and the coupon is not cached
    const coupon = await getDiscountCouponWithFallback(couponCode)

    if (!coupon) {
      throw new AppError('NOT_FOUND', 'Discount coupon not found', 404)
    }

    if (!coupon.noUsageLimit && coupon.remainingUsage <= 0) {
      throw new AppError('INVALID_INPUT', 'Discount coupon has no remaining usage', 409)
    }

    return {
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    }
  },
})
