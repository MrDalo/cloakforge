// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDiscountCouponStore, getAppliedCouponCode } from '../discountCouponStore'

const COUPON_UNAVAILABLE_MESSAGE = 'Discount coupons cannot be verified right now. Remove the coupon to continue at the regular price.'

const jsonResponse = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as unknown as Response
const success = (data: unknown) => jsonResponse({ status: 'success', status_code: 200, error_message: '', data })
const failure = (status: number, message: string) =>
  jsonResponse({ status: 'error', status_code: status, error_message: message, data: null }, status)

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  useDiscountCouponStore.setState({ appliedCoupon: null, isValidating: false, error: null })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useDiscountCouponStore.applyCoupon', () => {
  it('should apply a valid coupon (normalised to upper case)', async () => {
    fetchMock.mockResolvedValue(success({ code: 'SAVE20', discountPercentage: 20 }))

    const coupon = await useDiscountCouponStore.getState().applyCoupon(' save20 ')

    expect(coupon).toEqual({ code: 'SAVE20', discountPercentage: 20 })
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ couponCode: 'SAVE20' })
    expect(getAppliedCouponCode()).toBe('SAVE20')
  })

  it('should show the "cannot be verified" message when Contentful is down and the coupon is not cached', async () => {
    fetchMock.mockResolvedValue(failure(503, COUPON_UNAVAILABLE_MESSAGE))

    const coupon = await useDiscountCouponStore.getState().applyCoupon('SAVE20')

    expect(coupon).toBeNull()
    expect(useDiscountCouponStore.getState()).toMatchObject({ appliedCoupon: null, isValidating: false, error: COUPON_UNAVAILABLE_MESSAGE })
  })

  it('should show the server message for an unknown coupon', async () => {
    fetchMock.mockResolvedValue(failure(404, 'Discount coupon not found'))

    await useDiscountCouponStore.getState().applyCoupon('NOPE1')

    expect(useDiscountCouponStore.getState().error).toBe('Discount coupon not found')
  })
})

describe('useDiscountCouponStore.redeemAppliedCoupon', () => {
  it('should do nothing when no coupon is applied', async () => {
    await useDiscountCouponStore.getState().redeemAppliedCoupon('sig')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should clear the coupon and not break the flow when redemption fails (e.g. Contentful down)', async () => {
    useDiscountCouponStore.setState({ appliedCoupon: { code: 'SAVE20', discountPercentage: 20 } })
    fetchMock.mockResolvedValue(failure(503, 'Service temporarily unavailable'))

    await expect(useDiscountCouponStore.getState().redeemAppliedCoupon('sig-1')).resolves.toBeUndefined()

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ couponCode: 'SAVE20', txSignature: 'sig-1' })
    expect(useDiscountCouponStore.getState().appliedCoupon).toBeNull()
  })
})
