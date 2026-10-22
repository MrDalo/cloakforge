import { createApiRoute } from '@/lib/api'
import { redeemDiscountCouponRequestSchema } from '@/lib/schemas/apiSchemas'
import { withMinimumDuration } from '../_lib/withMinimumDuration'

/**
 * POST /api/discount-coupon/redeem
 *
 * Deprecated no-op kept for backward compatibility with clients from older deployments.
 * Coupon usage is now reserved server-side, atomically, when the tool transaction is
 * built (see applyCouponToServiceFee), so there is nothing left to redeem afterwards —
 * counting here as well would charge a use twice.
 *
 * The response is identical for every request (no coupon lookup), so it reveals nothing.
 */
export const POST = createApiRoute({
  name: 'discount-coupon/redeem',
  schema: redeemDiscountCouponRequestSchema,
  handler: async () => withMinimumDuration(async () => ({ acknowledged: true })),
})
