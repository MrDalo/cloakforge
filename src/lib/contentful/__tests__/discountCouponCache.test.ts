/**
 * Discount coupon lookup during Contentful outages:
 * 1. Contentful reachable                     -> fresh coupon, cached
 * 2. Contentful down, coupon cached and valid  -> cached coupon (keeps working on fallback prices)
 * 3. Contentful down, coupon not cached/expired -> SERVICE_UNAVAILABLE (503), never a silent "invalid"
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const logger = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }))
vi.mock('@/lib/logger/logger', () => ({ getLogger: () => logger }))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

const mockFetchDiscountCoupon = vi.hoisted(() => vi.fn())
vi.mock('@/lib/contentful/client', () => ({
  fetchDiscountCoupon: (...args: unknown[]) => mockFetchDiscountCoupon(...args),
  fetchToolConfigurations: vi.fn(),
}))

import { AppError } from '@/lib/errors'
import type { DiscountCoupon } from '../client'
import {
  COUPON_UNAVAILABLE_MESSAGE,
  DISCOUNT_COUPON_CACHE_POLICY,
  clearDiscountCouponCache,
  getDiscountCouponWithFallback,
} from '../discountCouponCache'
import { TOOL_CONFIG_CACHE_POLICY } from '../toolConfigCache'

const HOUR = 60 * 60 * 1000
const T0 = new Date('2026-01-01T00:00:00.000Z').getTime()
const MAX_AGE = DISCOUNT_COUPON_CACHE_POLICY.maxAgeMs

const coupon = (overrides: Partial<DiscountCoupon> = {}): DiscountCoupon => ({
  code: 'SAVE20',
  discountPercentage: 20,
  remainingUsage: 5,
  alreadyUsed: 0,
  noUsageLimit: false,
  ...overrides,
})

const contentfulUp = (value: DiscountCoupon | null) => mockFetchDiscountCoupon.mockResolvedValue(value)
const contentfulDown = () => mockFetchDiscountCoupon.mockRejectedValue(new Error('Contentful unavailable'))

const expectUnavailable = async (promise: Promise<unknown>) => {
  const error = await promise.catch((e: unknown) => e)
  expect(error).toBeInstanceOf(AppError)
  expect(error).toMatchObject({ code: 'SERVICE_UNAVAILABLE', status: 503, message: COUPON_UNAVAILABLE_MESSAGE })
}

beforeEach(() => {
  vi.clearAllMocks()
  clearDiscountCouponCache()
})

describe('DISCOUNT_COUPON_CACHE_POLICY', () => {
  it('should keep coupons usable as long as the tool prices (24 hours)', () => {
    expect(MAX_AGE).toBe(TOOL_CONFIG_CACHE_POLICY.maxAgeMs)
    expect(MAX_AGE).toBe(24 * HOUR)
  })
})

describe('getDiscountCouponWithFallback — Contentful reachable', () => {
  it('should return the fresh coupon', async () => {
    contentfulUp(coupon())

    await expect(getDiscountCouponWithFallback('SAVE20', T0)).resolves.toEqual(coupon())
    expect(mockFetchDiscountCoupon).toHaveBeenCalledWith('SAVE20')
  })

  it('should return null for an unknown coupon', async () => {
    contentfulUp(null)

    await expect(getDiscountCouponWithFallback('NOPE', T0)).resolves.toBeNull()
  })

  it('should always use the live coupon data while Contentful is reachable', async () => {
    contentfulUp(coupon({ remainingUsage: 5 }))
    await getDiscountCouponWithFallback('SAVE20', T0)
    contentfulUp(coupon({ remainingUsage: 0 }))

    await expect(getDiscountCouponWithFallback('SAVE20', T0 + HOUR)).resolves.toMatchObject({ remainingUsage: 0 })
  })
})

describe('getDiscountCouponWithFallback — Contentful down', () => {
  it('should serve a coupon fetched while Contentful was up', async () => {
    contentfulUp(coupon())
    await getDiscountCouponWithFallback('SAVE20', T0)
    contentfulDown()

    await expect(getDiscountCouponWithFallback('SAVE20', T0 + HOUR)).resolves.toEqual(coupon())
  })

  it('should serve the cached coupon right up to the max age', async () => {
    contentfulUp(coupon())
    await getDiscountCouponWithFallback('SAVE20', T0)
    contentfulDown()

    await expect(getDiscountCouponWithFallback('SAVE20', T0 + MAX_AGE - 1)).resolves.toEqual(coupon())
  })

  it('should refuse an expired cached coupon as unverifiable', async () => {
    contentfulUp(coupon())
    await getDiscountCouponWithFallback('SAVE20', T0)
    contentfulDown()

    await expectUnavailable(getDiscountCouponWithFallback('SAVE20', T0 + MAX_AGE))
  })

  it('should report a coupon that was never cached as unverifiable instead of invalid', async () => {
    contentfulDown()

    await expectUnavailable(getDiscountCouponWithFallback('SAVE20', T0))
  })

  it('should cache coupons per code', async () => {
    contentfulUp(coupon({ code: 'SAVE20' }))
    await getDiscountCouponWithFallback('SAVE20', T0)
    contentfulDown()

    await expect(getDiscountCouponWithFallback('SAVE20', T0 + HOUR)).resolves.toMatchObject({ code: 'SAVE20' })
    await expectUnavailable(getDiscountCouponWithFallback('OTHER', T0 + HOUR))
  })

  it('should never serve a coupon that was deleted in Contentful', async () => {
    contentfulUp(coupon())
    await getDiscountCouponWithFallback('SAVE20', T0)
    contentfulUp(null) // deleted / unpublished
    await getDiscountCouponWithFallback('SAVE20', T0 + HOUR)
    contentfulDown()

    await expectUnavailable(getDiscountCouponWithFallback('SAVE20', T0 + 2 * HOUR))
  })

  it('should serve the most recent coupon data', async () => {
    contentfulUp(coupon({ remainingUsage: 5 }))
    await getDiscountCouponWithFallback('SAVE20', T0)
    contentfulUp(coupon({ remainingUsage: 1 }))
    await getDiscountCouponWithFallback('SAVE20', T0 + HOUR)
    contentfulDown()

    await expect(getDiscountCouponWithFallback('SAVE20', T0 + 2 * HOUR)).resolves.toMatchObject({ remainingUsage: 1 })
  })

  it('should log a warning when serving a cached coupon and an error when it cannot verify', async () => {
    contentfulUp(coupon())
    await getDiscountCouponWithFallback('SAVE20', T0)
    contentfulDown()

    await getDiscountCouponWithFallback('SAVE20', T0 + HOUR)
    expect(logger.warn).toHaveBeenCalledWith('Contentful unavailable, using cached discount coupon', expect.any(Error), {
      code: 'SAVE20',
      cacheAgeMs: HOUR,
    })

    await getDiscountCouponWithFallback('OTHER', T0 + HOUR).catch(() => undefined)
    expect(logger.error).toHaveBeenCalledWith('Contentful unavailable and discount coupon not cached', expect.any(Error), { code: 'OTHER' })
  })

  it('should start empty again after the cache is cleared', async () => {
    contentfulUp(coupon())
    await getDiscountCouponWithFallback('SAVE20', T0)
    clearDiscountCouponCache()
    contentfulDown()

    await expectUnavailable(getDiscountCouponWithFallback('SAVE20', T0 + HOUR))
  })
})
