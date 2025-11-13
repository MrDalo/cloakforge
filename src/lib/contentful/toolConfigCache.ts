import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { ToolConfiguration, getAllToolConfigurations } from './client'
import { getLogger } from '@/lib/logger/logger'
import 'server-only'

// Create error logger for tool config cache
const logger = getLogger({
  context: 'contentful',
  component: 'toolConfigCache',
})

// Server-side cache for tool configurations (shared across all requests)
const toolConfigCache = new Map<string, { data: ToolConfiguration[]; timestamp: number }>()

// Configuration
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 1 day in milliseconds (matches cacheLife profile)

// Server-side cached tool configurations
async function getToolConfigurationsFromCache(): Promise<ToolConfiguration[]> {
  'use cache'
  cacheLife('days') // Tool configs rarely change - optimize for production
  cacheTag('tool-configs') // Tag for on-demand revalidation via webhook

  const cached = toolConfigCache.get('all-configs')
  const now = Date.now()

  // Return cached data if still valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  // Fetch fresh data from Contentful
  try {
    const toolConfigs = await getAllToolConfigurations()

    // Cache the results
    toolConfigCache.set('all-configs', {
      data: toolConfigs,
      timestamp: now,
    })

    return toolConfigs
  } catch (error) {
    logger.error('Failed to fetch tool configurations from cache', error, {
      cacheSize: toolConfigCache.size,
      operation: 'getToolConfigurationsFromCache',
    })

    // Return cached data if available, even if expired
    if (cached) {
      return cached.data
    }

    return []
  }
}

// React cache wrapper for request-level deduplication
const getCachedToolConfigurations = cache(getToolConfigurationsFromCache)
// Export the main function
export { getCachedToolConfigurations }

// Helper function to get specific tool configuration
export async function getToolConfigFromCache(toolId: string): Promise<ToolConfiguration | null> {
  const allConfigs = await getCachedToolConfigurations()
  return allConfigs.find((config) => config.toolId === toolId) || null
}

// Helper function to check if a tool is enabled
export async function isToolEnabled(toolId: string): Promise<boolean> {
  const config = await getToolConfigFromCache(toolId)
  return config?.isEnabled ?? true // Default to enabled if no config found
}

// Utility function to clear cache (for development/testing)
export const clearToolConfigCache = (): void => {
  const previousSize = toolConfigCache.size
  try {
    toolConfigCache.clear()
  } catch (error) {
    logger.error('Failed to clear tool config cache', error, {
      previousSize,
      operation: 'clearToolConfigCache',
    })
  }
}

/**
 * Get information about the current tool config cache state
 */
export const getToolConfigCacheInfo = async (): Promise<{
  hasCache: boolean
  cacheAge: number
  configCount: number
  lastFetch: string
  cacheExpiry: string
}> => {
  const cached = toolConfigCache.get('all-configs')

  if (!cached) {
    return {
      hasCache: false,
      cacheAge: 0,
      configCount: 0,
      lastFetch: 'Never',
      cacheExpiry: 'No cache',
    }
  }

  const now = Date.now()
  const cacheAge = now - cached.timestamp
  const remaining = Math.max(0, CACHE_DURATION - cacheAge)

  return {
    hasCache: true,
    cacheAge,
    configCount: cached.data.length,
    lastFetch: new Date(cached.timestamp).toISOString(),
    cacheExpiry: new Date(now + remaining).toISOString(),
  }
}
