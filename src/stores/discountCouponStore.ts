import { create } from 'zustand'
import { apiClient } from '@/lib/utils/apiClient'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'discount-coupon-store' })

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
  redeemAppliedCoupon: (txSignature: string | undefined) => Promise<void>
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
export const useDiscountCouponStore = create<DiscountCouponState>((set, get) => ({
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

  redeemAppliedCoupon: async (txSignature: string | undefined): Promise<void> => {
    const { appliedCoupon } = get()
    if (!appliedCoupon) return

    // Clear immediately so a coupon is only redeemed once per submission
    set({ appliedCoupon: null, error: null })

    if (!txSignature) {
      logger.warn('Cannot redeem discount coupon without a transaction signature', undefined, { code: appliedCoupon.code })
      return
    }

    try {
      await apiClient<{ couponCode: string; txSignature: string }, { code: string; remainingUsage: number }>(
        '/api/discount-coupon/redeem',
        { couponCode: appliedCoupon.code, txSignature }
      )
    } catch (error) {
      // Redemption failure must not break the tool flow — log and move on
      logger.warn('Failed to redeem discount coupon', error, { code: appliedCoupon.code, txSignature })
    }
  },

  clearCoupon: (): void => {
    set({ appliedCoupon: null, error: null })
  },

  clearError: (): void => {
    set({ error: null })
  },
}))
