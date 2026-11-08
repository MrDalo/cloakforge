import { cacheLife, cacheTag } from 'next/cache'
import { type ToolConfiguration, getAllToolConfigurations } from './client'
import { getLogger } from '@/lib/logger/logger'
import 'server-only'

// Create error logger for tool config cache
const logger = getLogger({
  context: 'contentful',
  component: 'toolConfigCache',
})

/** Result of the cached Contentful fetch; `available: false` means Contentful could not be reached. */
export interface CachedToolConfigurations {
  available: boolean
  configs: ToolConfiguration[]
}

/**
 * Cached Contentful fetch of all tool configurations (webhook-revalidated).
 *
 * Success is cached for days. A failure is cached only briefly (`cacheLife('minutes')`,
 * revalidated after ~1 minute), so a Contentful outage is never stored as an empty "no config"
 * result for days (which previously made every tool free and disabled the kill switch).
 * Errors are handled inside the cache scope on purpose: logging uses the current time, which
 * Cache Components only allow inside `'use cache'` while prerendering.
 *
 * @returns Configurations plus whether Contentful was reachable.
 */
export async function fetchCachedToolConfigurations(): Promise<CachedToolConfigurations> {
  'use cache'
  cacheTag('tool-configs') // Tag for on-demand revalidation via webhook

  try {
    const configs = await getAllToolConfigurations()
    cacheLife('days') // Tool configs rarely change - optimize for production
    return { available: true, configs }
  } catch (error) {
    cacheLife('minutes') // Retry soon; must stay >= 5 min expire so the root layout can still prerender
    logger.warn('Failed to fetch tool configurations', error, {
      operation: 'fetchCachedToolConfigurations',
    })
    return { available: false, configs: [] }
  }
}

/**
 * Get all tool configurations, or an empty list when Contentful is unavailable.
 *
 * An empty list means "unknown": UI defaults apply, and server-side fees fall back to the
 * hard-coded minimums (see `defaultToolFees.ts`).
 *
 * @returns Array of tool configurations (empty when unavailable).
 */
export async function getCachedToolConfigurations(): Promise<ToolConfiguration[]> {
  const { configs } = await fetchCachedToolConfigurations()
  return configs
}

/**
 * Get specific cached tool configuration by ID
 *
 * @param toolId - The tool identifier (e.g., 'token-creator', 'burn-tokens')
 * @returns Cached tool configuration, or null if not found or Contentful is unavailable
 */
export async function getCachedToolConfig(toolId: string): Promise<ToolConfiguration | null> {
  const allConfigs = await getCachedToolConfigurations()
  return allConfigs.find((config: ToolConfiguration) => config.toolId === toolId) || null
}

/**
 * Check if a tool is enabled via cached configuration
 *
 * @param toolId - The tool identifier
 * @returns True if enabled; defaults to true if no config is found or Contentful is unavailable
 */
export async function isToolEnabled(toolId: string): Promise<boolean> {
  const config = await getCachedToolConfig(toolId)
  return config?.isEnabled ?? true // Default to enabled if no config found
}
