import 'server-only'

import { createHmac } from 'crypto'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import { getDiscountCoupon } from '@/lib/contentful/client'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import getServerConfig from '@/lib/config/getServerConfig'

// Solana Memo Program - official program for adding memos to transactions
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

const logger = getLogger({ context: 'discounted-service-fee' })

export interface DiscountedServiceFee {
  /** Service fee in SOL after the coupon discount (equals the base fee when no coupon) */
  feeSOL: number
  /** Memo instruction proving the coupon was used in this transaction (null when no coupon) */
  couponMemoInstruction: TransactionInstruction | null
}

/**
 * Builds the on-chain memo text that binds a coupon to a transaction.
 * The memo carries an HMAC of the coupon code instead of the code itself,
 * so on-chain observers cannot read or brute-force the code. The redeem
 * endpoint recomputes the same HMAC to verify the memo before decrementing usage.
 *
 * @param code - Coupon code.
 * @returns Memo text in the `coupon:<hmac>` format (opaque tag, no plaintext code).
 */
export const buildCouponMemoText = (code: string): string => {
  const { couponMemoSecret } = getServerConfig()

  if (!couponMemoSecret) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Coupon memo secret is not configured', 500)
  }

  const digest = createHmac('sha256', couponMemoSecret).update(code).digest('hex').slice(0, 16)
  return `coupon:${digest}`
}

/**
 * Applies a discount coupon to a tool's service (base) fee.
 * Re-validates the coupon against Contentful (exists + remainingUsage > 0)
 * so the client can never charge itself a discount with an invalid coupon.
 *
 * @param baseFeeSOL - Service fee in SOL before discount.
 * @param couponCode - Optional coupon code from the request.
 * @returns Discounted fee and a coupon memo instruction to embed in the transaction.
 */
export async function applyCouponToServiceFee(baseFeeSOL: number, couponCode?: string): Promise<DiscountedServiceFee> {
  if (!couponCode) {
    return { feeSOL: baseFeeSOL, couponMemoInstruction: null }
  }

  const coupon = await getDiscountCoupon(couponCode)

  if (!coupon || (!coupon.noUsageLimit && coupon.remainingUsage <= 0)) {
    throw new AppError('INVALID_INPUT', 'Discount coupon is invalid or has no remaining usage', 400)
  }

  const feeSOL = baseFeeSOL * (1 - coupon.discountPercentage / 100)

  logger.info('Coupon discount applied to service fee', {
    code: coupon.code,
    discountPercentage: coupon.discountPercentage,
    baseFeeSOL,
    feeSOL,
  })

  return {
    feeSOL,
    couponMemoInstruction: new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(buildCouponMemoText(coupon.code), 'utf8'),
    }),
  }
}
