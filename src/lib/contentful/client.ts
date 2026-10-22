import { createClient } from 'contentful'
import { type Document } from '@contentful/rich-text-types'
import { getLogger } from '@/lib/logger/logger'
import 'server-only'
import getServerConfig from '../config/getServerConfig'

const serverConfig = getServerConfig()
// Contentful client configuration
const client = createClient({
  space: serverConfig.contentfulSpaceId,
  environment: serverConfig.contentfulEnvironment || 'master',
  accessToken: serverConfig.contentfulAccessToken,
  // Fail fast during a Contentful outage (defaults: 30 s timeout x 5 retries). Callers fall back
  // to cached data / fail closed, so long hangs only delay tool requests and coupon checks.
  timeout: 8_000,
  retryLimit: 2,
})

// ✅ Module-level loggers for better performance and organization
const blogLogger = getLogger({ context: 'contentful', function: 'blog' })
const toolConfigLogger = getLogger({ context: 'contentful', function: 'toolConfig' })
const bannerLogger = getLogger({ context: 'contentful', function: 'banner' })
const discountCouponLogger = getLogger({ context: 'contentful', function: 'discountCoupon' })

// Type definitions for Contentful entries
export interface BlogPost {
  title: string
  slug: string
  content: Document // Rich text content properly typed
  excerpt: string
  author: string
  publishedAt: string
  tags: string[]
  coverImage?: {
    fields: {
      file: {
        url: string
        details: {
          image: {
            width: number
            height: number
          }
        }
      }
    }
  }
}

export interface ToolConfiguration {
  toolId: string
  isEnabled: boolean
  disabledMessage?: string
  baseFee: number
  networkFee: number
  priorityFee?: number
}

/**
 * A published discount coupon (Delivery API — drafts are never visible).
 *
 * Usage limit: `remainingUsage` is the number of uses still available WHEN THE ENTRY WAS LAST
 * PUBLISHED. The app never writes these fields; uses are counted from confirmed on-chain
 * transactions that reference the coupon's marker address and carry its memo, made since
 * `updatedAt` (see `getAvailableDiscountCoupon` in discountedServiceFee.ts).
 *
 * Editors: re-publishing the entry (for any change) restarts the count from the new publish time,
 * so set `remainingUsage` to the uses that should remain from then on.
 */
export interface DiscountCoupon {
  /** Contentful entry id (diagnostics only) */
  entryId: string
  code: string
  /** Published discount percentage (callers clamp it to 0..100) */
  discountPercentage: number
  /** Editor-set: uses still available as of the latest publish (`updatedAt`) */
  remainingUsage: number
  /** Informational only (legacy counter of the previous reservation flow); not part of the limit */
  alreadyUsed: number
  /** When true the coupon has no usage limit and uses are not counted */
  noUsageLimit: boolean
  /**
   * Latest publish time (`sys.updatedAt`, ISO 8601 — in the Delivery API this is the CMA
   * `publishedAt`): on-chain uses before it are not counted against `remainingUsage`
   */
  updatedAt: string
}

export interface SiteBanner {
  isActive: boolean
  type: 'warning' | 'info' | 'maintenance'
  title: string
  message: string
  showOnPages: string[]
}

// Blog functions
/**
 * Fetches recent blog posts from Contentful.
 *
 * @returns List of normalized blog post objects.
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const entries = await client.getEntries({
      content_type: 'blogPost',
      order: ['-sys.createdAt'],
      limit: 20,
    })

    return entries.items.map((item) => ({
      title: String(item.fields.title || ''),
      slug: String(item.fields.slug || ''),
      content: item.fields.content as Document,
      excerpt: String(item.fields.excerpt || ''),
      author: String(item.fields.author || ''),
      publishedAt: String(item.fields.publishedAt || ''),
      tags: Array.isArray(item.fields.tags) ? item.fields.tags.map(String) : [],
      coverImage: item.fields.coverImage as BlogPost['coverImage'],
    }))
  } catch (error) {
    blogLogger.warn('Error fetching blog posts:', error)
    return []
  }
}

/**
 * Fetches a single blog post by slug.
 *
 * @param slug - Blog post slug.
 * @returns Matching post or null when not found.
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const entries = await client.getEntries({
      content_type: 'blogPost',
      'fields.slug': slug,
      limit: 1,
    })

    if (entries.items.length === 0) {
      return null
    }

    const item = entries.items[0]
    return {
      title: String(item.fields.title || ''),
      slug: String(item.fields.slug || ''),
      content: item.fields.content as Document,
      excerpt: String(item.fields.excerpt || ''),
      author: String(item.fields.author || ''),
      publishedAt: String(item.fields.publishedAt || ''),
      tags: Array.isArray(item.fields.tags) ? item.fields.tags.map(String) : [],
      coverImage: item.fields.coverImage as BlogPost['coverImage'],
    }
  } catch (error) {
    blogLogger.warn('Error fetching blog post:', error)
    return null
  }
}

/**
 * Retrieves all tool configuration entries from Contentful.
 *
 * Errors are logged and re-thrown — never turned into an empty list — so the `'use cache'`
 * caller does not cache an outage as "no config" (see `toolConfigCache.ts`).
 *
 * @returns List of tool configuration records.
 * @throws When the Contentful request fails.
 */
export async function getAllToolConfigurations(): Promise<ToolConfiguration[]> {
  try {
    const entries = await client.getEntries({
      content_type: 'toolConfiguration',
    })

    return entries.items.map((item) => ({
      toolId: String(item.fields.toolId || ''),
      isEnabled: Boolean(item.fields.isEnabled),
      disabledMessage: item.fields.disabledMessage ? String(item.fields.disabledMessage) : undefined,
      // `??` (not `||`) so an intentional fee of 0 is honored
      baseFee: Number(item.fields.baseFee ?? 0.1),
      networkFee: Number(item.fields.networkFee ?? 0.01),
      priorityFee: item.fields.priorityFee ? Number(item.fields.priorityFee) : undefined,
    }))
  } catch (error) {
    toolConfigLogger.warn('Error fetching tool configurations:', error)
    throw error
  }
}

/**
 * Fetches a single published discount coupon entry by its code (Delivery API).
 * Queries Contentful for the specific coupon only — never the whole bundle.
 *
 * Errors are logged and re-thrown — never turned into "not found" — so callers can fail
 * closed with a "temporarily unavailable" error instead of calling a valid code invalid.
 *
 * @param code - Coupon code (the entry `name` field).
 * @returns Matching coupon or null when not found.
 * @throws When the Contentful request fails.
 */
export async function getDiscountCoupon(code: string): Promise<DiscountCoupon | null> {
  try {
    const entries = await client.getEntries({
      content_type: 'discountCouponType',
      'fields.name': code,
      limit: 1,
    })

    if (entries.items.length === 0) {
      return null
    }

    const item = entries.items[0]
    return {
      entryId: item.sys.id,
      code: String(item.fields.name || ''),
      discountPercentage: Number(item.fields.discountPercentage || 0),
      remainingUsage: Number(item.fields.remainingUsage || 0),
      alreadyUsed: Number(item.fields.alreadyUsed || 0),
      noUsageLimit: Boolean(item.fields.noUsageLimit),
      updatedAt: String(item.sys.updatedAt || ''),
    }
  } catch (error) {
    discountCouponLogger.warn('Error fetching discount coupon:', error)
    throw error
  }
}

// Site banner functions
/**
 * Retrieves the most recent active site banner.
 *
 * @returns Active banner configuration or null.
 */
export async function getSiteBanner(): Promise<SiteBanner | null> {
  try {
    const entries = await client.getEntries({
      content_type: 'siteBanner',
      'fields.isActive': true,
      limit: 1,
      order: ['-sys.createdAt'],
    })

    if (entries.items.length === 0) {
      return null
    }

    const item = entries.items[0]
    return {
      isActive: Boolean(item.fields.isActive),
      type: String(item.fields.type) as SiteBanner['type'],
      title: String(item.fields.title || ''),
      message: String(item.fields.message || ''),
      showOnPages: Array.isArray(item.fields.showOnPages) ? item.fields.showOnPages.map(String) : ['all'],
    }
  } catch (error) {
    bannerLogger.warn('Error fetching site banner:', error)
    return null
  }
}

// Export the client for direct usage if needed
export { client }
