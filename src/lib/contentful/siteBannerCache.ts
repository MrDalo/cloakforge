import { cache } from 'react'
import { SiteBanner, getSiteBanner } from './client'
import { getLogger } from '@/lib/logger/logger'
import 'server-only'

// Create error logger for site banner cache
const logger = getLogger({
  context: 'contentful',
  component: 'siteBannerCache',
})

// Server-side cache for site banner (shared across all requests)
const siteBannerCache = new Map<string, { data: SiteBanner | null; timestamp: number }>()

// Configuration - longer cache for banners since they change less frequently
const CACHE_DURATION = 2 * 60 * 1000 // 2 minutes in milliseconds

// Server-side cached site banner
async function getSiteBannerFromCache(): Promise<SiteBanner | null> {
  const cached = siteBannerCache.get('active-banner')
  const now = Date.now()

  // Return cached data if still valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  // Fetch fresh data from Contentful
  try {
    const banner = await getSiteBanner()

    // Cache the results
    siteBannerCache.set('active-banner', {
      data: banner,
      timestamp: now,
    })

    return banner
  } catch (error) {
    logger.error('Failed to fetch site banner from cache', error, {
      cacheSize: siteBannerCache.size,
      operation: 'getSiteBannerFromCache',
      hasStaleData: !!cached,
    })

    // Return cached data if available, even if expired (graceful degradation)
    if (cached) {
      logger.warn('Serving expired site banner data due to fetch failure', {
        cacheAge: now - cached.timestamp,
        staleBy: now - cached.timestamp - CACHE_DURATION,
      })
      return cached.data
    }

    return null
  }
}

// React cache wrapper for request-level deduplication
const getCachedSiteBanner = cache(getSiteBannerFromCache)

// Export the main function
export { getCachedSiteBanner }

// Utility function to clear cache (for development/testing)
export const clearSiteBannerCache = (): void => {
  const previousSize = siteBannerCache.size
  try {
    siteBannerCache.clear()
  } catch (error) {
    logger.error('Failed to clear site banner cache', error, {
      previousSize,
      operation: 'clearSiteBannerCache',
    })
  }
}

/**
 * Get information about the current site banner cache state
 */
export const getSiteBannerCacheInfo = (): {
  hasCache: boolean
  cacheAge: number
  hasData: boolean
  lastFetch: string
  cacheExpiry: string
  isStale: boolean
} => {
  const cached = siteBannerCache.get('active-banner')

  if (!cached) {
    return {
      hasCache: false,
      cacheAge: 0,
      hasData: false,
      lastFetch: 'Never',
      cacheExpiry: 'No cache',
      isStale: false,
    }
  }

  const now = Date.now()
  const cacheAge = now - cached.timestamp
  const remaining = Math.max(0, CACHE_DURATION - cacheAge)
  const isStale = cacheAge >= CACHE_DURATION

  return {
    hasCache: true,
    cacheAge,
    hasData: !!cached.data,
    lastFetch: new Date(cached.timestamp).toISOString(),
    cacheExpiry: new Date(now + remaining).toISOString(),
    isStale,
  }
}

/**
 * Force refresh the site banner cache (useful for admin operations)
 */
export const refreshSiteBannerCache = async (): Promise<SiteBanner | null> => {
  // Clear existing cache
  siteBannerCache.delete('active-banner')

  // Fetch fresh data
  return await getSiteBannerFromCache()
}
