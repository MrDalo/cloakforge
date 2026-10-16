import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyCouponToServiceFee, buildCouponMemoText, COUPON_UNAVAILABLE_MESSAGE } from '../discountedServiceFee'
import { getDiscountCoupon, type DiscountCoupon } from '@/lib/contentful/client'
import { reserveDiscountCouponUsage } from '@/lib/contentful/managementClient'
import { AppError } from '@/lib/errors'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/contentful/client', () => ({
  getDiscountCoupon: vi.fn(),
}))
vi.mock('@/lib/contentful/managementClient', () => ({
  reserveDiscountCouponUsage: vi.fn(),
}))

const mockServerConfig = { couponMemoSecret: 'test-coupon-memo-secret' }
vi.mock('@/lib/config/getServerConfig', () => ({
  default: () => mockServerConfig,
}))

const makeCoupon = (overrides: Partial<DiscountCoupon> = {}): DiscountCoupon => ({
  entryId: 'entry-1',
  code: 'SAVE10',
  discountPercentage: 10,
  remainingUsage: 5,
  alreadyUsed: 0,
  noUsageLimit: false,
  ...overrides,
})

/** Mocks a coupon that exists in the Delivery API and reserves successfully via the CMA */
const mockReservableCoupon = (overrides: Partial<DiscountCoupon> = {}): DiscountCoupon => {
  const coupon = makeCoupon(overrides)
  vi.mocked(getDiscountCoupon).mockResolvedValue(coupon)
  vi.mocked(reserveDiscountCouponUsage).mockResolvedValue({
    code: coupon.code,
    discountPercentage: coupon.discountPercentage,
    remainingUsage: coupon.noUsageLimit ? coupon.remainingUsage : coupon.remainingUsage - 1,
    noUsageLimit: coupon.noUsageLimit,
  })
  return coupon
}

const catchError = async (promise: Promise<unknown>): Promise<AppError> => {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught
  )
  expect(error).toBeInstanceOf(AppError)
  return error as AppError
}

describe('applyCouponToServiceFee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockServerConfig.couponMemoSecret = 'test-coupon-memo-secret'
  })

  it('should return the base fee unchanged when no coupon code is provided', async () => {
    const result = await applyCouponToServiceFee(0.1)

    expect(result.feeSOL).toBe(0.1)
    expect(result.couponMemoInstruction).toBeNull()
    expect(getDiscountCoupon).not.toHaveBeenCalled()
    expect(reserveDiscountCouponUsage).not.toHaveBeenCalled()
  })

  it('should reserve one use server-side and apply the discount for a valid coupon', async () => {
    mockReservableCoupon()

    const result = await applyCouponToServiceFee(0.1, 'SAVE10')

    expect(reserveDiscountCouponUsage).toHaveBeenCalledTimes(1)
    expect(reserveDiscountCouponUsage).toHaveBeenCalledWith('entry-1', 'SAVE10')
    expect(result.feeSOL).toBeCloseTo(0.09, 10)
    expect(result.couponMemoInstruction?.data.toString('utf8')).toBe(buildCouponMemoText('SAVE10'))
  })

  it('should use the discount percentage read during the reservation', async () => {
    mockReservableCoupon({ discountPercentage: 10 })
    vi.mocked(reserveDiscountCouponUsage).mockResolvedValue({
      code: 'SAVE10',
      discountPercentage: 50,
      remainingUsage: 4,
      noUsageLimit: false,
    })

    const result = await applyCouponToServiceFee(0.1, 'SAVE10')

    expect(result.feeSOL).toBeCloseTo(0.05, 10)
  })

  it('should not expose the plaintext coupon code in the memo', async () => {
    mockReservableCoupon()

    const result = await applyCouponToServiceFee(0.1, 'SAVE10')
    const memoText = result.couponMemoInstruction?.data.toString('utf8') ?? ''

    expect(memoText).not.toContain('SAVE10')
    expect(memoText).toMatch(/^coupon:[0-9a-f]{16}$/)
  })

  it('should reject an unknown coupon with the generic message and reserve nothing', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(null)

    const error = await catchError(applyCouponToServiceFee(0.1, 'NOPE99'))

    expect(error.status).toBe(400)
    expect(error.message).toBe(COUPON_UNAVAILABLE_MESSAGE)
    expect(reserveDiscountCouponUsage).not.toHaveBeenCalled()
  })

  it('should reject an exhausted coupon with the same generic message', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ code: 'DEAD00', remainingUsage: 0, alreadyUsed: 10 }))

    const error = await catchError(applyCouponToServiceFee(0.1, 'DEAD00'))

    expect(error.status).toBe(400)
    expect(error.message).toBe(COUPON_UNAVAILABLE_MESSAGE)
    expect(reserveDiscountCouponUsage).not.toHaveBeenCalled()
  })

  it('should reject with the generic message when the coupon is exhausted at reservation time (race lost)', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon({ remainingUsage: 1 }))
    vi.mocked(reserveDiscountCouponUsage).mockRejectedValue(new AppError('INVALID_INPUT', 'Discount coupon has no remaining usage', 400))

    const error = await catchError(applyCouponToServiceFee(0.1, 'SAVE10'))

    expect(error.status).toBe(400)
    expect(error.message).toBe(COUPON_UNAVAILABLE_MESSAGE)
  })

  it('should fail closed (no discount) when the reservation cannot be recorded', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon())
    vi.mocked(reserveDiscountCouponUsage).mockRejectedValue(new AppError('SERVICE_UNAVAILABLE', 'conflict', 503))

    const error = await catchError(applyCouponToServiceFee(0.1, 'SAVE10'))

    expect(error.status).toBe(503)
  })

  it('should fail closed on unexpected reservation errors', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon())
    vi.mocked(reserveDiscountCouponUsage).mockRejectedValue(new Error('socket hang up'))

    const error = await catchError(applyCouponToServiceFee(0.1, 'SAVE10'))

    expect(error.status).toBe(503)
  })

  it('should not burn a use when the memo secret is missing', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(makeCoupon())
    mockServerConfig.couponMemoSecret = ''

    await catchError(applyCouponToServiceFee(0.1, 'SAVE10'))
    expect(reserveDiscountCouponUsage).not.toHaveBeenCalled()
  })

  it('should apply the discount for a noUsageLimit coupon even when remainingUsage is 0', async () => {
    mockReservableCoupon({ code: 'ULTD25', discountPercentage: 25, remainingUsage: 0, alreadyUsed: 42, noUsageLimit: true })

    const result = await applyCouponToServiceFee(0.1, 'ULTD25')

    expect(result.feeSOL).toBeCloseTo(0.075, 10)
    expect(result.couponMemoInstruction).not.toBeNull()
    expect(reserveDiscountCouponUsage).toHaveBeenCalledTimes(1)
  })

  it('should make a 100 percent coupon free while still counting the use and tagging the transaction', async () => {
    mockReservableCoupon({ code: 'FREE00', discountPercentage: 100, remainingUsage: 1 })

    const result = await applyCouponToServiceFee(0.1, 'FREE00')

    expect(result.feeSOL).toBe(0)
    expect(result.couponMemoInstruction?.data.toString('utf8')).toBe(buildCouponMemoText('FREE00'))
    expect(reserveDiscountCouponUsage).toHaveBeenCalledWith('entry-1', 'FREE00')
  })

  it('should clamp out-of-range discount percentages', async () => {
    mockReservableCoupon({ discountPercentage: 150 })
    expect((await applyCouponToServiceFee(0.1, 'SAVE10')).feeSOL).toBe(0)

    mockReservableCoupon({ discountPercentage: -20 })
    expect((await applyCouponToServiceFee(0.1, 'SAVE10')).feeSOL).toBeCloseTo(0.1, 10)
  })
})
