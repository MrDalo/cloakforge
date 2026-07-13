import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyCouponToServiceFee, buildCouponMemoText } from '../discountedServiceFee'
import { getDiscountCoupon } from '@/lib/contentful/client'
import { AppError } from '@/lib/errors'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/contentful/client', () => ({
  getDiscountCoupon: vi.fn(),
}))
vi.mock('@/lib/config/getServerConfig', () => ({
  default: () => ({ couponMemoSecret: 'test-coupon-memo-secret' }),
}))

describe('applyCouponToServiceFee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the base fee unchanged when no coupon code is provided', async () => {
    const result = await applyCouponToServiceFee(0.1)

    expect(result.feeSOL).toBe(0.1)
    expect(result.couponMemoInstruction).toBeNull()
    expect(getDiscountCoupon).not.toHaveBeenCalled()
  })

  it('should apply the discount percentage to the base fee for a valid coupon', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue({
      code: 'SAVE10',
      discountPercentage: 10,
      remainingUsage: 5,
      alreadyUsed: 0,
      noUsageLimit: false,
    })

    const result = await applyCouponToServiceFee(0.1, 'SAVE10')

    expect(result.feeSOL).toBeCloseTo(0.09, 10)
    expect(result.couponMemoInstruction).not.toBeNull()
    expect(result.couponMemoInstruction?.data.toString('utf8')).toBe(buildCouponMemoText('SAVE10'))
  })

  it('should not expose the plaintext coupon code in the memo', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue({
      code: 'SAVE10',
      discountPercentage: 10,
      remainingUsage: 5,
      alreadyUsed: 0,
      noUsageLimit: false,
    })

    const result = await applyCouponToServiceFee(0.1, 'SAVE10')
    const memoText = result.couponMemoInstruction?.data.toString('utf8') ?? ''

    expect(memoText).not.toContain('SAVE10')
    expect(memoText).toMatch(/^coupon:[0-9a-f]{16}$/)
  })

  it('should throw when the coupon does not exist', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue(null)

    await expect(applyCouponToServiceFee(0.1, 'NOPE99')).rejects.toThrow(AppError)
  })

  it('should throw when the coupon has no remaining usage', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue({
      code: 'DEAD00',
      discountPercentage: 20,
      remainingUsage: 0,
      alreadyUsed: 10,
      noUsageLimit: false,
    })

    await expect(applyCouponToServiceFee(0.1, 'DEAD00')).rejects.toThrow('Discount coupon is invalid or has no remaining usage')
  })

  it('should apply the discount for a noUsageLimit coupon even when remainingUsage is 0', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue({
      code: 'ULTD25',
      discountPercentage: 25,
      remainingUsage: 0,
      alreadyUsed: 42,
      noUsageLimit: true,
    })

    const result = await applyCouponToServiceFee(0.1, 'ULTD25')

    expect(result.feeSOL).toBeCloseTo(0.075, 10)
    expect(result.couponMemoInstruction).not.toBeNull()
  })

  it('should reduce the fee to zero for a 100 percent coupon', async () => {
    vi.mocked(getDiscountCoupon).mockResolvedValue({
      code: 'FREE00',
      discountPercentage: 100,
      remainingUsage: 1,
      alreadyUsed: 0,
      noUsageLimit: false,
    })

    const result = await applyCouponToServiceFee(0.1, 'FREE00')

    expect(result.feeSOL).toBe(0)
  })
})
