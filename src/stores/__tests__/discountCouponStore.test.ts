import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDiscountCouponStore, getAppliedCouponCode } from '../discountCouponStore'
import { apiClient } from '@/lib/utils/apiClient'
import { COUPON_SERVICE_UNAVAILABLE_MESSAGE, COUPON_UNAVAILABLE_MESSAGE } from '@/lib/utils/discountCouponMessages'

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: vi.fn(),
}))

const SAVE10 = { code: 'SAVE10', discountPercentage: 10 }

describe('discountCouponStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDiscountCouponStore.setState({ appliedCoupon: null, isValidating: false, error: null })
  })

  describe('applyCoupon', () => {
    it('should validate the normalized code and apply the returned coupon', async () => {
      vi.mocked(apiClient).mockResolvedValue(SAVE10)

      const coupon = await useDiscountCouponStore.getState().applyCoupon('  save10 ')

      expect(apiClient).toHaveBeenCalledWith('/api/discount-coupon/validate', { couponCode: 'SAVE10' })
      expect(coupon).toEqual(SAVE10)
      expect(useDiscountCouponStore.getState().appliedCoupon).toEqual(SAVE10)
      expect(getAppliedCouponCode()).toBe('SAVE10')
    })

    it('should show the server message when the coupon is unavailable', async () => {
      vi.mocked(apiClient).mockRejectedValue(new Error(COUPON_UNAVAILABLE_MESSAGE))

      await expect(useDiscountCouponStore.getState().applyCoupon('NOPE99')).resolves.toBeNull()

      expect(useDiscountCouponStore.getState().appliedCoupon).toBeNull()
      expect(useDiscountCouponStore.getState().error).toBe(COUPON_UNAVAILABLE_MESSAGE)
    })
  })

  describe('reportCouponError', () => {
    it('should remove a coupon the server reports as unavailable and show the message', () => {
      useDiscountCouponStore.setState({ appliedCoupon: SAVE10 })

      useDiscountCouponStore.getState().reportCouponError(COUPON_UNAVAILABLE_MESSAGE)

      expect(useDiscountCouponStore.getState().appliedCoupon).toBeNull()
      expect(useDiscountCouponStore.getState().error).toBe(COUPON_UNAVAILABLE_MESSAGE)
    })

    it('should keep the coupon applied on a temporary failure and show the message', () => {
      useDiscountCouponStore.setState({ appliedCoupon: SAVE10 })

      useDiscountCouponStore.getState().reportCouponError(COUPON_SERVICE_UNAVAILABLE_MESSAGE)

      expect(useDiscountCouponStore.getState().appliedCoupon).toEqual(SAVE10)
      expect(useDiscountCouponStore.getState().error).toBe(COUPON_SERVICE_UNAVAILABLE_MESSAGE)
    })
  })

  it('clearCoupon should remove the coupon and any error', () => {
    useDiscountCouponStore.setState({ appliedCoupon: SAVE10, error: 'something' })

    useDiscountCouponStore.getState().clearCoupon()

    expect(useDiscountCouponStore.getState().appliedCoupon).toBeNull()
    expect(useDiscountCouponStore.getState().error).toBeNull()
    expect(getAppliedCouponCode()).toBeUndefined()
  })
})
