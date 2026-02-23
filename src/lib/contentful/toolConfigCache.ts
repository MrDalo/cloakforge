import { cacheLife, cacheTag } from 'next/cache'
import { type ToolConfiguration, getAllToolConfigurations } from './client'
import { getLogger } from '@/lib/logger/logger'
import 'server-only'

// Create error logger for tool config cache
const logger = getLogger({
  context: 'contentful',
  component: 'toolConfigCache',
})

/**
 * Get all cached tool configurations with 1-day cache duration
 *
 * Uses Next.js 16 Cache Components for optimal performance:
 * - Cached for 1 day (tool configs rarely change)
 * - Instantly revalidated via Contentful webhook
 * - Stale-while-revalidate: users get cached data instantly
 *
 * @returns Array of cached tool configurations
 */
export async function getCachedToolConfigurations(): Promise<ToolConfiguration[]> {
  'use cache'
  cacheLife('days') // Tool configs rarely change - optimize for production
  cacheTag('tool-configs') // Tag for on-demand revalidation via webhook

  // Fetch fresh data from Contentful
  try {
    const toolConfigs = await getAllToolConfigurations()
    return toolConfigs
  } catch (error) {
    logger.error('Failed to fetch tool configurations', error, {
      operation: 'getCachedToolConfigurations',
    })

    return []
  }
}

/**
 * Get specific cached tool configuration by ID
 *
 * @param toolId - The tool identifier (e.g., 'token-creator', 'burn-tokens')
 * @returns Cached tool configuration or null if not found
 */
export async function getCachedToolConfig(toolId: string): Promise<ToolConfiguration | null> {
  const allConfigs = await getCachedToolConfigurations()
  return allConfigs.find((config: ToolConfiguration) => config.toolId === toolId) || null
}

/**
 * Check if a tool is enabled via cached configuration
 *
 * @param toolId - The tool identifier
 * @returns True if enabled, defaults to true if no config found
 */
export async function isToolEnabled(toolId: string): Promise<boolean> {
  const config = await getCachedToolConfig(toolId)
  return config?.isEnabled ?? true // Default to enabled if no config found
}
