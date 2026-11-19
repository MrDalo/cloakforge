import { cacheLife, cacheTag } from 'next/cache'
import { type ToolConfiguration, fetchToolConfigurations } from './client'
import { getLogger } from '@/lib/logger/logger'
import { withFeeFallbacks } from '@/lib/config/toolFeeFallbacks'
import 'server-only'

// Create error logger for tool config cache
const logger = getLogger({
  context: 'contentful',
  component: 'toolConfigCache',
})

/**
 * Tool configuration (prices) caching policy:
 *
 * 1. Contentful reachable      -> use the fresh values and remember them (last-known-good cache)
 * 2. Contentful unreachable,
 *    cached values still valid -> keep serving the cached values
 * 3. Contentful unreachable,
 *    cached values expired     -> serve nothing, so every tool uses its fallback fees
 *                                 (see TOOL_FEE_FALLBACKS)
 */
export const TOOL_CONFIG_CACHE_POLICY = Object.freeze({
  /** How long values fetched from Contentful stay usable while Contentful is unreachable */
  maxAgeMs: 24 * 60 * 60 * 1000,
  /**
   * How often (seconds) Next.js re-runs the policy, i.e. re-checks Contentful. Kept short so an
   * outage is retried quickly and cached values are never served much past maxAgeMs.
   * Contentful webhooks additionally expire the cache immediately (tag 'tool-configs').
   */
  revalidateSeconds: 5 * 60,
  /** Next.js drops an unused cache entry after this long (seconds) */
  expireSeconds: 60 * 60,
})

/** Where a set of tool configurations came from */
export type ToolConfigSource = 'contentful' | 'cache' | 'fallback'

export interface ResolvedToolConfigurations {
  configs: ToolConfiguration[]
  source: ToolConfigSource
  /** When the returned values were fetched from Contentful (null for fallback) */
  fetchedAt: number | null
}

interface LastKnownGood {
  configs: ToolConfiguration[]
  fetchedAt: number
}

/** Last configuration successfully fetched from Contentful (per server instance) */
let lastKnownGood: LastKnownGood | null = null

/**
 * Applies the caching policy: fetches from Contentful and falls back to the last known good
 * values (while not expired) or to nothing (fallback fees) when Contentful is unreachable.
 *
 * @param now - Current time in ms (injectable for tests).
 * @returns Tool configurations and where they came from.
 */
export async function resolveToolConfigurations(now: number = Date.now()): Promise<ResolvedToolConfigurations> {
  try {
    const configs = await fetchToolConfigurations()
    lastKnownGood = { configs, fetchedAt: now }
    return { configs, source: 'contentful', fetchedAt: now }
  } catch (error) {
    if (lastKnownGood && now - lastKnownGood.fetchedAt < TOOL_CONFIG_CACHE_POLICY.maxAgeMs) {
      logger.warn('Contentful unavailable, serving cached tool configurations', error, {
        operation: 'resolveToolConfigurations',
        cacheAgeMs: now - lastKnownGood.fetchedAt,
      })
      return { configs: lastKnownGood.configs, source: 'cache', fetchedAt: lastKnownGood.fetchedAt }
    }

    logger.error('Contentful unavailable and no valid cached tool configurations, using fallback fees', error, {
      operation: 'resolveToolConfigurations',
      cacheAgeMs: lastKnownGood ? now - lastKnownGood.fetchedAt : null,
    })
    return { configs: [], source: 'fallback', fetchedAt: null }
  }
}

/**
 * Clears the last-known-good cache (used by tests and for manual recovery).
 */
export function clearToolConfigCache(): void {
  lastKnownGood = null
}

/**
 * Get all cached tool configurations.
 *
 * Next.js Cache Components keep the result for TOOL_CONFIG_CACHE_POLICY.revalidateSeconds (and
 * Contentful webhooks expire it instantly via the 'tool-configs' tag). Every re-run applies the
 * caching policy above, so an outage never replaces valid cached prices with an empty result.
 *
 * @returns Tool configurations from Contentful, from the last-known-good cache, or [] when both
 *          are unavailable (callers then use the fallback fees).
 */
export async function getCachedToolConfigurations(): Promise<ToolConfiguration[]> {
  'use cache'
  cacheLife({
    stale: TOOL_CONFIG_CACHE_POLICY.revalidateSeconds,
    revalidate: TOOL_CONFIG_CACHE_POLICY.revalidateSeconds,
    expire: TOOL_CONFIG_CACHE_POLICY.expireSeconds,
  })
  cacheTag('tool-configs') // Tag for on-demand revalidation via webhook

  const { configs } = await resolveToolConfigurations()
  return configs
}

/**
 * Tool configurations for the app, completed with the fallback fees: every known tool is present
 * (even when Contentful is down) and unusable fee values are replaced by the tool's fallback fee.
 *
 * @returns Tool configurations covering every known tool.
 */
export async function getToolConfigurationsWithFallback(): Promise<ToolConfiguration[]> {
  return withFeeFallbacks(await getCachedToolConfigurations())
}

/**
 * Get specific cached tool configuration by ID (raw Contentful data — see getToolServiceFee for
 * the fee with fallback)
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
