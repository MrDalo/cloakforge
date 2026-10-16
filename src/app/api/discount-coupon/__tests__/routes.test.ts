import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { getDiscountCoupon } from '@/lib/contentful/client'

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/contentful/client', () => ({
  getDiscountCoupon: vi.fn(),
}))

// The routes only need the shared public error message from the fee module
vi.mock('@/lib/solana/server-side/discountedServiceFee', () => ({
  COUPON_UNAVAILABLE_MESSAGE: 'Discount coupon is invalid or no longer available',
}))

// Skip the anti-enumeration delay in route tests (covered separately below)
vi.mock('../_lib/withMinimumDuration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../_lib/withMinimumDuration')>()
  return {
    ...actual,
    withMinimumDuration: <T>(operation: () => Promise<T>) => actual.withMinimumDuration(operation, 0),
  }
})

const VALID_SIGNATURE = '5'.repeat(88)

function makeRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(`http://localhost:3001/api/discount-coupon/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const coupon = (overrides: Record<string, unknown> = {}) => ({
  entryId: 'entry-1',
  code: 'SAVE10',
  discountPercentage: 10,
  remainingUsage: 3,
  alreadyUsed: 0,
  noUsageLimit: false,
  ...overrides,
})

describe('POST /api/discount-coupon/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the discount for a usable coupon', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(coupon())
    const { POST } = await import('../validate/route')

    const response = await POST(makeRequest('validate', { couponCode: 'SAVE10' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual({ code: 'SAVE10', discountPercentage: 10 })
  })

  it('should answer unknown and exhausted coupons with an identical response', async () => {
    const { POST } = await import('../validate/route')

    vi.mocked(getDiscountCoupon).mockResolvedValue(null)
    const unknown = await POST(makeRequest('validate', { couponCode: 'NOPE99' }))

    vi.mocked(getDiscountCoupon).mockResolvedValue(coupon({ remainingUsage: 0 }))
    const exhausted = await POST(makeRequest('validate', { couponCode: 'SAVE10' }))

    expect(unknown.status).toBe(404)
    expect(exhausted.status).toBe(404)
    expect(await exhausted.json()).toEqual(await unknown.json())
  })

  it('should accept noUsageLimit coupons with remainingUsage 0', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(coupon({ remainingUsage: 0, noUsageLimit: true }))
    const { POST } = await import('../validate/route')

    const response = await POST(makeRequest('validate', { couponCode: 'SAVE10' }))

    expect(response.status).toBe(200)
  })
})

describe('POST /api/discount-coupon/redeem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be a no-op that never looks up or counts the coupon', async () => {
    const { POST } = await import('../redeem/route')

    const response = await POST(makeRequest('redeem', { couponCode: 'SAVE10', txSignature: VALID_SIGNATURE }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data).toEqual({ acknowledged: true })
    expect(getDiscountCoupon).not.toHaveBeenCalled()
  })

  it('should answer existing and unknown codes identically', async () => {
    const { POST } = await import('../redeem/route')

    const first = await (await POST(makeRequest('redeem', { couponCode: 'SAVE10', txSignature: VALID_SIGNATURE }))).json()
    const second = await (await POST(makeRequest('redeem', { couponCode: 'NOPE99', txSignature: VALID_SIGNATURE }))).json()

    expect(second).toEqual(first)
  })
})

describe('withMinimumDuration', () => {
  // The module is mocked above for the route tests — exercise the real implementation here
  let withMinimumDuration: typeof import('../_lib/withMinimumDuration').withMinimumDuration

  beforeEach(async () => {
    ;({ withMinimumDuration } = await vi.importActual<typeof import('../_lib/withMinimumDuration')>('../_lib/withMinimumDuration'))
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should delay fast successes until the minimum duration has passed', async () => {
    let settled = false
    const promise = withMinimumDuration(async () => 'ok', 300).then((value) => {
      settled = true
      return value
    })

    await vi.advanceTimersByTimeAsync(299)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await expect(promise).resolves.toBe('ok')
  })

  it('should delay fast failures by the same minimum duration', async () => {
    let settled = false
    const promise = withMinimumDuration(async () => {
      throw new Error('not found')
    }, 300).catch((error: Error) => {
      settled = true
      return error.message
    })

    await vi.advanceTimersByTimeAsync(299)
    expect(settled).toBe(false)

    await vi.advanceTimersByTimeAsync(1)
    await expect(promise).resolves.toBe('not found')
  })
})
