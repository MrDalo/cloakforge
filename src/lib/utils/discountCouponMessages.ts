/**
 * Public discount-coupon error messages, shared by the server (which returns them) and the
 * client (which recognises them to update the coupon UI). Client-safe: no server imports.
 */

/**
 * Single public message for every unusable coupon (unknown, unpublished, exhausted),
 * so responses do not reveal which codes exist.
 */
export const COUPON_UNAVAILABLE_MESSAGE = 'Discount coupon is invalid or no longer available'

/** Public message when coupon availability cannot be verified right now (the server fails closed). */
export const COUPON_SERVICE_UNAVAILABLE_MESSAGE =
  'Discount coupons are temporarily unavailable. Please try again or continue without a coupon.'

/**
 * Whether an error message returned by a tool API is about the applied coupon itself.
 *
 * @param message - Error message from the API.
 * @returns True for the coupon-unavailable and coupon-service-unavailable messages.
 */
export const isCouponErrorMessage = (message: string): boolean =>
  message === COUPON_UNAVAILABLE_MESSAGE || message === COUPON_SERVICE_UNAVAILABLE_MESSAGE
