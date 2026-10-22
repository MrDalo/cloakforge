import 'server-only'
import { createClient } from 'contentful-management'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '../config/getServerConfig'

const logger = getLogger({ context: 'contentful', function: 'managementClient' })

const DEFAULT_LOCALE = 'en-US'
const DISCOUNT_COUPON_CONTENT_TYPE = 'discountCouponType'

/** Optimistic-concurrency retries before a contended coupon reservation fails closed */
const MAX_RESERVATION_ATTEMPTS = 3

export interface ReservedDiscountCoupon {
  code: string
  /** Discount percentage read from the same entry version the usage was reserved on */
  discountPercentage: number
  /** Remaining usage after this reservation (unchanged for noUsageLimit coupons) */
  remainingUsage: number
  noUsageLimit: boolean
}

/** Contentful answers a stale `X-Contentful-Version` with 409 / `VersionMismatch`. */
const isVersionConflict = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false
  return error.name === 'VersionMismatch' || error.name.startsWith('409')
}

/**
 * Atomically reserves one use of a discount coupon via the Contentful Management API.
 *
 * Contentful is the only store, so the entry's `sys.version` is the lock: the counters
 * are re-read from the latest version, checked, and written back with that version
 * (`X-Contentful-Version`). A concurrent writer makes the update fail with 409, and the
 * reservation re-reads and retries — so two requests can never both take the last use.
 * Any other failure (missing token, network, repeated conflicts) throws: callers must
 * fail closed and never apply a discount without a successful reservation.
 *
 * Usage is reserved when the transaction is built, not when it lands on-chain, so an
 * abandoned or failed transaction still consumes a use. That is the price of enforcing
 * limits without a database; it never lets a coupon be used more often than allowed.
 *
 * @param entryId - Contentful entry id of the coupon (from the Delivery API lookup).
 * @param code - Coupon code the client sent; must match the entry's `name` field.
 * @returns Reserved coupon details.
 * @throws AppError 400 when the coupon is unpublished, mismatched or exhausted; 503 when
 *   the reservation could not be recorded.
 */
export async function reserveDiscountCouponUsage(entryId: string, code: string): Promise<ReservedDiscountCoupon> {
  const { contentfulSpaceId, contentfulEnvironment, contentfulManagementToken } = getServerConfig()

  if (!contentfulManagementToken) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Coupon usage tracking is not configured', 503)
  }

  const client = createClient({ accessToken: contentfulManagementToken }, { type: 'plain' })
  const params = {
    spaceId: contentfulSpaceId,
    environmentId: contentfulEnvironment || 'master',
    entryId,
  }

  for (let attempt = 1; attempt <= MAX_RESERVATION_ATTEMPTS; attempt++) {
    // Single-entry GET is strongly consistent (collection queries go through the search index)
    const entry = await client.entry.get(params)

    const isCouponEntry = entry.sys.contentType?.sys.id === DISCOUNT_COUPON_CONTENT_TYPE
    const isLive = Boolean(entry.sys.publishedVersion) && !entry.sys.archivedVersion
    if (!isCouponEntry || !isLive || String(entry.fields.name?.[DEFAULT_LOCALE] ?? '') !== code) {
      throw new AppError('INVALID_INPUT', 'Discount coupon is not available', 400)
    }

    const discountPercentage = Number(entry.fields.discountPercentage?.[DEFAULT_LOCALE] || 0)
    const remainingUsage = Number(entry.fields.remainingUsage?.[DEFAULT_LOCALE] || 0)
    const alreadyUsed = Number(entry.fields.alreadyUsed?.[DEFAULT_LOCALE] || 0)
    const noUsageLimit = Boolean(entry.fields.noUsageLimit?.[DEFAULT_LOCALE])

    if (!noUsageLimit && remainingUsage <= 0) {
      throw new AppError('INVALID_INPUT', 'Discount coupon has no remaining usage', 400)
    }

    // Unlimited coupons keep their counter untouched — only the usage count grows
    const updatedRemainingUsage = noUsageLimit ? remainingUsage : remainingUsage - 1
    if (!noUsageLimit) {
      entry.fields.remainingUsage = { [DEFAULT_LOCALE]: updatedRemainingUsage }
    }
    entry.fields.alreadyUsed = { [DEFAULT_LOCALE]: alreadyUsed + 1 }

    let updated: typeof entry
    try {
      // Sends X-Contentful-Version: entry.sys.version — rejected with 409 if anyone wrote in between
      updated = await client.entry.update(params, entry)
    } catch (error) {
      if (isVersionConflict(error) && attempt < MAX_RESERVATION_ATTEMPTS) {
        logger.warn('Coupon reservation version conflict, retrying', undefined, { code, attempt })
        continue
      }
      logger.error('Failed to reserve discount coupon usage', error, { code, attempt })
      throw new AppError('SERVICE_UNAVAILABLE', 'Discount coupon usage could not be recorded', 503)
    }

    // The CMA draft now holds the authoritative counter (all reservations read it), so
    // publishing is only needed for the Delivery API (validate endpoint) to catch up.
    try {
      await client.entry.publish(params, updated)
    } catch (error) {
      logger.warn('Coupon usage reserved but publishing the entry failed', error, { code })
    }

    logger.info('Discount coupon usage reserved', {
      code,
      noUsageLimit,
      remainingUsage: updatedRemainingUsage,
      alreadyUsed: alreadyUsed + 1,
    })

    return { code, discountPercentage, remainingUsage: updatedRemainingUsage, noUsageLimit }
  }

  // Unreachable: the last attempt either returns or throws
  throw new AppError('SERVICE_UNAVAILABLE', 'Discount coupon usage could not be recorded', 503)
}
