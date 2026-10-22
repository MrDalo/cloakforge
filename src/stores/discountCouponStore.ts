import { create } from 'zustand'
import { apiClient } from '@/lib/utils/apiClient'
import { COUPON_UNAVAILABLE_MESSAGE } from '@/lib/utils/discountCouponMessages'

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
  /**
   * Shows a coupon error returned by a tool API. An unusable coupon (unknown or exhausted) is
   * removed; a temporary verification failure keeps it applied so the user can retry.
   */
  reportCouponError: (message: string) => void
}

/**
 * Returns the currently applied coupon code for inclusion in tool API requests.
 * Safe to call outside React (reads the store snapshot).
 *
 * @returns Applied coupon code or undefined when none is applied.
 */
export const getAppliedCouponCode = (): string | undefined => useDiscountCouponStore.getState().appliedCoupon?.code

/**
 * Returns the currently applied coupon (code and discount) as a snapshot. Read it ONCE per run so the
 * code sent to the API and the fee limit used for verification always come from the same coupon.
 *
 * @returns Applied coupon or undefined when none is applied.
 */
export const getAppliedCoupon = (): AppliedCoupon | undefined => useDiscountCouponStore.getState().appliedCoupon ?? undefined

/**
 * Zustand store for the active discount coupon.
 *
 * A coupon use is counted only when a tool transaction carrying the coupon memo confirms
 * on-chain, so a failed, rejected or abandoned run does not consume it: the coupon stays
 * applied after failures and is cleared after a successful run (see useToolBase).
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

  reportCouponError: (message: string): void => {
    if (message === COUPON_UNAVAILABLE_MESSAGE) {
      set({ appliedCoupon: null, error: message })
      return
    }
    set({ error: message })
  },
}))
