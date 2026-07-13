import { createApiRoute } from '@/lib/api'
import { redeemDiscountCouponEntry } from '@/lib/contentful/managementClient'
import { verifyCouponTransaction } from '@/lib/solana/server-side/verifyCouponTransaction'
import { redeemDiscountCouponRequestSchema } from '@/lib/schemas/apiSchemas'

/**
 * POST /api/discount-coupon/redeem
 *
 * Redeems a discount coupon after a tool form submission.
 * Requires a confirmed transaction signature as proof: the transaction must have
 * succeeded, contain the opaque `coupon:<hmac>` memo, pay the platform fee wallet,
 * and be recent. Only then is remainingUsage decremented and alreadyUsed incremented.
 */
export const POST = createApiRoute({
  name: 'discount-coupon/redeem',
  schema: redeemDiscountCouponRequestSchema,
  handler: async ({ couponCode, txSignature }) => {
    await verifyCouponTransaction(txSignature, couponCode)

    const remainingUsage = await redeemDiscountCouponEntry(couponCode)
    return { code: couponCode, remainingUsage }
  },
})
