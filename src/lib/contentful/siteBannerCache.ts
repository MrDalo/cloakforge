import { cacheLife, cacheTag } from 'next/cache'
import { type SiteBanner, getSiteBanner as fetchSiteBanner } from './client'
import { getLogger } from '@/lib/logger/logger'
import 'server-only'

// Create error logger for site banner cache
const logger = getLogger({
  context: 'contentful',
  component: 'siteBannerCache',
})

/**
 * Get cached site banner with 1-day cache duration
 *
 * Uses Next.js 16 Cache Components for optimal performance:
 * - Cached for 1 day (banner rarely changes)
 * - Instantly revalidated via Contentful webhook
 * - Stale-while-revalidate: users get cached data instantly
 *
 * @returns Cached site banner or null if not found
 */
export async function getCachedSiteBanner(): Promise<SiteBanner | null> {
  'use cache'
  cacheLife('days') // 1 day cache - site banner rarely changes, webhook revalidation on updates
  cacheTag('site-banner') // For on-demand revalidation via Contentful webhook

  // Fetch fresh data from Contentful
  try {
    const banner = await fetchSiteBanner()
    return banner
  } catch (error) {
    logger.error('Failed to fetch site banner', error, {
      operation: 'getCachedSiteBanner',
    })

    // Next.js serves stale data automatically on error
    return null
  }
}
