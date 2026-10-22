import { create } from 'zustand'
import { apiClient } from '@/lib/utils/apiClient'

export interface AppliedCoupon {
  code: string
  discountPercentage: number
}

interface ValidateCouponResponse {
  code: string
  discountPercentage: number
}

interface DiscountCouponState {
  appliedCoupon: AppliedCoupon | null
  isValidating: boolean
  error: string | null

  // Actions
  applyCoupon: (code: string) => Promise<AppliedCoupon | null>
  clearCoupon: () => void
  clearError: () => void
}

/**
 * Returns the currently applied coupon code for inclusion in tool API requests.
 * Safe to call outside React (reads the store snapshot).
 *
 * @returns Applied coupon code or undefined when none is applied.
 */
export const getAppliedCouponCode = (): string | undefined => useDiscountCouponStore.getState().appliedCoupon?.code

/**
 * Zustand store for the active discount coupon.
 *
 * @returns Store hook with the applied coupon, validation state, and actions.
 */
export const useDiscountCouponStore = create<DiscountCouponState>((set) => ({
  appliedCoupon: null,
  isValidating: false,
  error: null,

  applyCoupon: async (code: string): Promise<AppliedCoupon | null> => {
    set({ isValidating: true, error: null })

    try {
      const result = await apiClient<{ couponCode: string }, ValidateCouponResponse>('/api/discount-coupon/validate', {
        couponCode: code.trim().toUpperCase(),
      })

      const coupon: AppliedCoupon = {
        code: result.code,
        discountPercentage: result.discountPercentage,
      }

      set({ appliedCoupon: coupon, isValidating: false, error: null })
      return coupon
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to validate discount coupon'
      set({ appliedCoupon: null, isValidating: false, error: message })
      return null
    }
  },

  clearCoupon: (): void => {
    set({ appliedCoupon: null, error: null })
  },

  clearError: (): void => {
    set({ error: null })
  },
}))
