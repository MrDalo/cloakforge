import 'server-only'

import { type DiscountCoupon, fetchDiscountCoupon } from './client'
import { TOOL_CONFIG_CACHE_POLICY } from './toolConfigCache'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'contentful', component: 'discountCouponCache' })

/**
 * Discount coupon lookup policy (mirrors the tool price cache):
 *
 * 1. Contentful reachable                       -> fresh coupon, remembered as last-known-good
 * 2. Contentful unreachable, coupon cached and
 *    younger than maxAgeMs                       -> cached coupon (so coupons keep working on the
 *                                                   cached or fallback prices during an outage)
 * 3. Contentful unreachable, no valid cache      -> SERVICE_UNAVAILABLE: the coupon cannot be
 *                                                   verified, the user can continue without it
 */
export const DISCOUNT_COUPON_CACHE_POLICY = Object.freeze({
  maxAgeMs: TOOL_CONFIG_CACHE_POLICY.maxAgeMs,
})

export const COUPON_UNAVAILABLE_MESSAGE =
  'Discount coupons cannot be verified right now. Remove the coupon to continue at the regular price.'

interface CachedCoupon {
  coupon: DiscountCoupon
  fetchedAt: number
}

/** Last successfully fetched coupons by code (per server instance) */
const coupons = new Map<string, CachedCoupon>()

/**
 * Looks up a discount coupon, falling back to the last-known-good copy while Contentful is down.
 *
 * @param code - Coupon code.
 * @param now - Current time in ms (injectable for tests).
 * @returns The coupon, or null when it does not exist.
 * @throws AppError SERVICE_UNAVAILABLE (503) when Contentful is down and the coupon is not cached.
 */
export async function getDiscountCouponWithFallback(code: string, now: number = Date.now()): Promise<DiscountCoupon | null> {
  try {
    const coupon = await fetchDiscountCoupon(code)
    if (coupon) {
      coupons.set(code, { coupon, fetchedAt: now })
    } else {
      // Deleted or unpublished in Contentful — never serve it from the cache again
      coupons.delete(code)
    }
    return coupon
  } catch (error) {
    const cached = coupons.get(code)
    if (cached && now - cached.fetchedAt < DISCOUNT_COUPON_CACHE_POLICY.maxAgeMs) {
      logger.warn('Contentful unavailable, using cached discount coupon', error, { code, cacheAgeMs: now - cached.fetchedAt })
      return cached.coupon
    }

    logger.error('Contentful unavailable and discount coupon not cached', error, { code })
    throw new AppError('SERVICE_UNAVAILABLE', COUPON_UNAVAILABLE_MESSAGE, 503)
  }
}

/**
 * Clears the coupon cache (used by tests and for manual recovery).
 */
export function clearDiscountCouponCache(): void {
  coupons.clear()
}
