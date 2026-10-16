import 'server-only'

import { createHmac } from 'crypto'
import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import { getDiscountCoupon } from '@/lib/contentful/client'
import { reserveDiscountCouponUsage } from '@/lib/contentful/managementClient'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import getServerConfig from '@/lib/config/getServerConfig'

// Solana Memo Program - official program for adding memos to transactions
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

const logger = getLogger({ context: 'discounted-service-fee' })

/**
 * Single public message for every unusable coupon (unknown, unpublished, exhausted),
 * so responses do not reveal which codes exist.
 */
export const COUPON_UNAVAILABLE_MESSAGE = 'Discount coupon is invalid or no longer available'

const COUPON_SERVICE_UNAVAILABLE_MESSAGE = 'Discount coupons are temporarily unavailable. Please try again or continue without a coupon.'

export interface DiscountedServiceFee {
  /** Service fee in SOL after the coupon discount (equals the base fee when no coupon) */
  feeSOL: number
  /** Memo instruction tagging the transaction with the coupon used (null when no coupon) */
  couponMemoInstruction: TransactionInstruction | null
}

/**
 * Builds the on-chain memo text that tags a transaction with the coupon used.
 * The memo carries an HMAC of the coupon code instead of the code itself,
 * so on-chain observers cannot read or brute-force the code.
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

/** Clamps a Contentful discount percentage to 0..100 (non-numeric → 0). */
const clampDiscountPercentage = (value: number): number => (Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0)

/**
 * Applies a discount coupon to a tool's service (base) fee and counts the use.
 *
 * Usage is enforced server-side when the transaction is built — the client cannot
 * skip it:
 * 1. Cheap Delivery API pre-check (rejects unknown/exhausted codes without touching the CMA).
 * 2. Authoritative, version-checked reservation of one use via the Management API.
 *    If the reservation fails for any reason the request fails (fail closed) — a
 *    discount is never applied without a recorded use.
 *
 * A 100% coupon yields `feeSOL = 0`: builders then omit the fee transfer but still add
 * the coupon memo, and the use is already counted, so no post-transaction redemption
 * is needed.
 *
 * @param baseFeeSOL - Service fee in SOL before discount.
 * @param couponCode - Optional coupon code from the request.
 * @returns Discounted fee and a coupon memo instruction to embed in the transaction.
 * @throws AppError 400 (generic message) for unusable coupons, 503 when usage cannot be recorded.
 */
export async function applyCouponToServiceFee(baseFeeSOL: number, couponCode?: string): Promise<DiscountedServiceFee> {
  if (!couponCode) {
    return { feeSOL: baseFeeSOL, couponMemoInstruction: null }
  }

  const coupon = await getDiscountCoupon(couponCode)

  if (!coupon || (!coupon.noUsageLimit && coupon.remainingUsage <= 0)) {
    throw new AppError('INVALID_INPUT', COUPON_UNAVAILABLE_MESSAGE, 400)
  }

  // Build the memo before reserving, so a misconfiguration cannot burn a use
  const memoText = buildCouponMemoText(coupon.code)

  let discountPercentage: number
  try {
    const reserved = await reserveDiscountCouponUsage(coupon.entryId, coupon.code)
    discountPercentage = clampDiscountPercentage(reserved.discountPercentage)
  } catch (error) {
    if (error instanceof AppError && error.status < 500) {
      throw new AppError('INVALID_INPUT', COUPON_UNAVAILABLE_MESSAGE, 400)
    }
    logger.error('Coupon usage reservation failed — rejecting the discounted request', error, { code: coupon.code })
    throw new AppError('SERVICE_UNAVAILABLE', COUPON_SERVICE_UNAVAILABLE_MESSAGE, 503)
  }

  const feeSOL = discountPercentage >= 100 ? 0 : baseFeeSOL * (1 - discountPercentage / 100)

  logger.info('Coupon discount applied to service fee', {
    code: coupon.code,
    discountPercentage,
    baseFeeSOL,
    feeSOL,
  })

  return {
    feeSOL,
    couponMemoInstruction: new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoText, 'utf8'),
    }),
  }
}
