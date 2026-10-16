import { createApiRoute } from '@/lib/api'
import { redeemDiscountCouponRequestSchema } from '@/lib/schemas/apiSchemas'
import { withMinimumDuration } from '../_lib/withMinimumDuration'

/**
 * POST /api/discount-coupon/redeem
 *
 * Deprecated no-op kept for backward compatibility with clients from older deployments.
 * Coupon usage is counted from confirmed on-chain transactions that carry the coupon memo and
 * marker transfer (see getAvailableDiscountCoupon), so there is nothing to redeem — and nothing is written.
 *
 * The response is identical for every request (no coupon lookup), so it reveals nothing.
 */
export const POST = createApiRoute({
  name: 'discount-coupon/redeem',
  schema: redeemDiscountCouponRequestSchema,
  handler: async () => withMinimumDuration(async () => ({ acknowledged: true })),
})
