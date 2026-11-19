import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))
vi.mock('next/headers', () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

const mockFetchDiscountCoupon = vi.hoisted(() => vi.fn())
vi.mock('@/lib/contentful/client', () => ({
  fetchDiscountCoupon: (...args: unknown[]) => mockFetchDiscountCoupon(...args),
  fetchToolConfigurations: vi.fn(),
}))

import { POST } from '../validate/route'
import { clearDiscountCouponCache, COUPON_UNAVAILABLE_MESSAGE } from '@/lib/contentful/discountCouponCache'

const makeRequest = (couponCode: string) =>
  new NextRequest('http://localhost:3000/api/discount-coupon/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ couponCode }),
  })

const coupon = { code: 'SAVE20', discountPercentage: 20, remainingUsage: 3, alreadyUsed: 0, noUsageLimit: false }

describe('POST /api/discount-coupon/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearDiscountCouponCache()
  })

  it('should return the discount of a valid coupon', async () => {
    mockFetchDiscountCoupon.mockResolvedValue(coupon)

    const response = await POST(makeRequest('SAVE20'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toEqual({ code: 'SAVE20', discountPercentage: 20 })
  })

  it('should return 404 for an unknown coupon', async () => {
    mockFetchDiscountCoupon.mockResolvedValue(null)

    const response = await POST(makeRequest('NOPE1'))
    expect(response.status).toBe(404)
  })

  it('should return 409 for a coupon without remaining usage', async () => {
    mockFetchDiscountCoupon.mockResolvedValue({ ...coupon, remainingUsage: 0 })

    const response = await POST(makeRequest('SAVE20'))
    expect(response.status).toBe(409)
  })

  it('should keep validating a coupon from the cache while Contentful is down', async () => {
    mockFetchDiscountCoupon.mockResolvedValueOnce(coupon)
    await POST(makeRequest('SAVE20'))
    mockFetchDiscountCoupon.mockRejectedValue(new Error('Contentful unavailable'))

    const response = await POST(makeRequest('SAVE20'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toEqual({ code: 'SAVE20', discountPercentage: 20 })
  })

  it('should answer 503 "cannot be verified" (not "not found") for an uncached coupon while Contentful is down', async () => {
    mockFetchDiscountCoupon.mockRejectedValue(new Error('Contentful unavailable'))

    const response = await POST(makeRequest('SAVE20'))
    const json = await response.json()

    expect(response.status).toBe(503)
    expect(json.error_message).toBe(COUPON_UNAVAILABLE_MESSAGE)
  })
})
