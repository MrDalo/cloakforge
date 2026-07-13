import 'server-only'
import { createClient } from 'contentful-management'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '../config/getServerConfig'

const logger = getLogger({ context: 'contentful', function: 'managementClient' })

const DEFAULT_LOCALE = 'en-US'

/**
 * Redeems a discount coupon entry: increments `alreadyUsed` and, unless the coupon
 * has `noUsageLimit` set, decrements `remainingUsage`. Publishes the updated entry
 * so the Delivery API reflects the new counters.
 *
 * @param code - Coupon code (the entry `name` field).
 * @returns Updated remaining usage counter (unchanged for noUsageLimit coupons).
 */
export async function redeemDiscountCouponEntry(code: string): Promise<number> {
  const { contentfulSpaceId, contentfulEnvironment, contentfulManagementToken } = getServerConfig()

  if (!contentfulManagementToken) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Coupon redemption is not configured', 500)
  }

  const client = createClient({ accessToken: contentfulManagementToken }, { type: 'plain' })
  const defaults = {
    spaceId: contentfulSpaceId,
    environmentId: contentfulEnvironment || 'master',
  }

  const entries = await client.entry.getMany({
    ...defaults,
    query: {
      content_type: 'discountCouponType',
      'fields.name': code,
      limit: 1,
    },
  })

  if (entries.items.length === 0) {
    throw new AppError('NOT_FOUND', 'Discount coupon not found', 404)
  }

  const entry = entries.items[0]
  const remainingUsage = Number(entry.fields.remainingUsage?.[DEFAULT_LOCALE] || 0)
  const alreadyUsed = Number(entry.fields.alreadyUsed?.[DEFAULT_LOCALE] || 0)
  const noUsageLimit = Boolean(entry.fields.noUsageLimit?.[DEFAULT_LOCALE])

  if (!noUsageLimit && remainingUsage <= 0) {
    throw new AppError('INVALID_INPUT', 'Discount coupon has no remaining usage', 409)
  }

  // Unlimited coupons keep their counter untouched — only the usage count grows
  const updatedRemainingUsage = noUsageLimit ? remainingUsage : remainingUsage - 1

  if (!noUsageLimit) {
    entry.fields.remainingUsage = { [DEFAULT_LOCALE]: updatedRemainingUsage }
  }
  entry.fields.alreadyUsed = { [DEFAULT_LOCALE]: alreadyUsed + 1 }

  const updated = await client.entry.update({ ...defaults, entryId: entry.sys.id }, entry)
  await client.entry.publish({ ...defaults, entryId: entry.sys.id }, updated)

  logger.info('Discount coupon redeemed', {
    code,
    noUsageLimit,
    remainingUsage: updatedRemainingUsage,
    alreadyUsed: alreadyUsed + 1,
  })

  return updatedRemainingUsage
}
