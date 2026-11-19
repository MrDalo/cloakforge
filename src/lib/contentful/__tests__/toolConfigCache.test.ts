/**
 * Unit tests for src/lib/contentful/toolConfigCache.ts
 *
 * Caching policy under test:
 * 1. Contentful reachable                      -> fresh values, remembered as last-known-good
 * 2. Contentful unreachable + cache still valid -> cached values
 * 3. Contentful unreachable + cache expired     -> nothing (fallback fees)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('server-only', () => ({}))

const logger = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }))
vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => logger),
}))

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockFetchToolConfigurations = vi.hoisted(() => vi.fn())

vi.mock('@/lib/contentful/client', () => ({
  fetchToolConfigurations: mockFetchToolConfigurations,
}))

import { cacheLife, cacheTag } from 'next/cache'
import {
  TOOL_CONFIG_CACHE_POLICY,
  clearToolConfigCache,
  getCachedToolConfigurations,
  getCachedToolConfig,
  getToolConfigurationsWithFallback,
  isToolEnabled,
  resolveToolConfigurations,
} from '../toolConfigCache'
import { getToolServiceFee } from '@/lib/config/getToolServiceFee'
import { TOOL_FEE_FALLBACKS } from '@/lib/config/toolFeeFallbacks'
import type { ToolConfiguration } from '../client'

function makeConfig(toolId: string, isEnabled = true, overrides: Partial<ToolConfiguration> = {}): ToolConfiguration {
  return { toolId, isEnabled, baseFee: 0.1, networkFee: 0.01, ...overrides }
}

const HOUR = 60 * 60 * 1000
const MAX_AGE = TOOL_CONFIG_CACHE_POLICY.maxAgeMs
const T0 = new Date('2026-01-01T00:00:00.000Z').getTime()

const contentfulUp = (configs: ToolConfiguration[]) => mockFetchToolConfigurations.mockResolvedValue(configs)
const contentfulDown = () => mockFetchToolConfigurations.mockRejectedValue(new Error('Contentful unavailable'))

beforeEach(() => {
  vi.clearAllMocks()
  clearToolConfigCache()
})

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

describe('TOOL_CONFIG_CACHE_POLICY', () => {
  it('should keep Contentful values usable for 24 hours during an outage', () => {
    expect(TOOL_CONFIG_CACHE_POLICY.maxAgeMs).toBe(24 * HOUR)
  })

  it('should re-check Contentful every 5 minutes, well within the max age', () => {
    expect(TOOL_CONFIG_CACHE_POLICY.revalidateSeconds).toBe(300)
    expect(TOOL_CONFIG_CACHE_POLICY.revalidateSeconds * 1000).toBeLessThan(TOOL_CONFIG_CACHE_POLICY.maxAgeMs)
    expect(TOOL_CONFIG_CACHE_POLICY.expireSeconds).toBeGreaterThanOrEqual(TOOL_CONFIG_CACHE_POLICY.revalidateSeconds)
  })
})

describe('resolveToolConfigurations — Contentful reachable', () => {
  it('should return the fresh Contentful values', async () => {
    const configs = [makeConfig('burn-tokens', true, { baseFee: 0.02 })]
    contentfulUp(configs)

    await expect(resolveToolConfigurations(T0)).resolves.toEqual({ configs, source: 'contentful', fetchedAt: T0 })
  })

  it('should always ask Contentful while it is reachable (no stale values)', async () => {
    contentfulUp([makeConfig('burn-tokens', true, { baseFee: 0.02 })])
    await resolveToolConfigurations(T0)
    contentfulUp([makeConfig('burn-tokens', true, { baseFee: 0.03 })])

    const result = await resolveToolConfigurations(T0 + HOUR)

    expect(mockFetchToolConfigurations).toHaveBeenCalledTimes(2)
    expect(result.configs[0].baseFee).toBe(0.03)
  })

  it('should treat an empty (but successful) Contentful response as live data', async () => {
    contentfulUp([])

    await expect(resolveToolConfigurations(T0)).resolves.toEqual({ configs: [], source: 'contentful', fetchedAt: T0 })
  })
})

describe('resolveToolConfigurations — Contentful unreachable, cache valid', () => {
  it('should serve the cached values', async () => {
    const configs = [makeConfig('liquidity-provider', true, { baseFee: 0.3 })]
    contentfulUp(configs)
    await resolveToolConfigurations(T0)
    contentfulDown()

    await expect(resolveToolConfigurations(T0 + HOUR)).resolves.toEqual({ configs, source: 'cache', fetchedAt: T0 })
  })

  it('should serve the cached values right up to the end of the max age', async () => {
    contentfulUp([makeConfig('token-creator', true, { baseFee: 0.25 })])
    await resolveToolConfigurations(T0)
    contentfulDown()

    const result = await resolveToolConfigurations(T0 + MAX_AGE - 1)

    expect(result.source).toBe('cache')
    expect(result.configs[0].baseFee).toBe(0.25)
  })

  it('should serve the most recently fetched values', async () => {
    contentfulUp([makeConfig('burn-tokens', true, { baseFee: 0.02 })])
    await resolveToolConfigurations(T0)
    contentfulUp([makeConfig('burn-tokens', true, { baseFee: 0.04 })])
    await resolveToolConfigurations(T0 + 2 * HOUR)
    contentfulDown()

    const result = await resolveToolConfigurations(T0 + 3 * HOUR)

    expect(result).toMatchObject({ source: 'cache', fetchedAt: T0 + 2 * HOUR })
    expect(result.configs[0].baseFee).toBe(0.04)
  })

  it('should measure the age from the last successful fetch, not the first', async () => {
    contentfulUp([makeConfig('burn-tokens')])
    await resolveToolConfigurations(T0)
    await resolveToolConfigurations(T0 + 20 * HOUR) // refreshed
    contentfulDown()

    // 30h after the first fetch but only 10h after the last one
    await expect(resolveToolConfigurations(T0 + 30 * HOUR)).resolves.toMatchObject({ source: 'cache' })
  })

  it('should keep serving the cache across repeated failed attempts', async () => {
    contentfulUp([makeConfig('burn-tokens', true, { baseFee: 0.02 })])
    await resolveToolConfigurations(T0)
    contentfulDown()

    for (const hours of [1, 5, 12, 23]) {
      await expect(resolveToolConfigurations(T0 + hours * HOUR)).resolves.toMatchObject({ source: 'cache', fetchedAt: T0 })
    }
  })

  it('should warn with the cache age when serving cached values', async () => {
    contentfulUp([makeConfig('burn-tokens')])
    await resolveToolConfigurations(T0)
    contentfulDown()

    await resolveToolConfigurations(T0 + 2 * HOUR)

    expect(logger.warn).toHaveBeenCalledWith('Contentful unavailable, serving cached tool configurations', expect.any(Error), {
      operation: 'resolveToolConfigurations',
      cacheAgeMs: 2 * HOUR,
    })
  })
})

describe('resolveToolConfigurations — Contentful unreachable, cache expired', () => {
  it('should use the fallback (no values) once the cache reaches the max age', async () => {
    contentfulUp([makeConfig('burn-tokens', true, { baseFee: 0.02 })])
    await resolveToolConfigurations(T0)
    contentfulDown()

    await expect(resolveToolConfigurations(T0 + MAX_AGE)).resolves.toEqual({ configs: [], source: 'fallback', fetchedAt: null })
  })

  it('should use the fallback when the cache is long expired', async () => {
    contentfulUp([makeConfig('burn-tokens')])
    await resolveToolConfigurations(T0)
    contentfulDown()

    await expect(resolveToolConfigurations(T0 + 7 * 24 * HOUR)).resolves.toMatchObject({ source: 'fallback' })
  })

  it('should use the fallback when nothing was ever cached (cold start during an outage)', async () => {
    contentfulDown()

    await expect(resolveToolConfigurations(T0)).resolves.toEqual({ configs: [], source: 'fallback', fetchedAt: null })
  })

  it('should go back to live values and renew the cache when Contentful recovers', async () => {
    contentfulUp([makeConfig('burn-tokens', true, { baseFee: 0.02 })])
    await resolveToolConfigurations(T0)
    contentfulDown()
    await expect(resolveToolConfigurations(T0 + 2 * MAX_AGE)).resolves.toMatchObject({ source: 'fallback' })

    contentfulUp([makeConfig('burn-tokens', true, { baseFee: 0.05 })])
    await expect(resolveToolConfigurations(T0 + 2 * MAX_AGE + HOUR)).resolves.toMatchObject({ source: 'contentful' })
    contentfulDown()

    const result = await resolveToolConfigurations(T0 + 2 * MAX_AGE + 2 * HOUR)
    expect(result.source).toBe('cache')
    expect(result.configs[0].baseFee).toBe(0.05)
  })

  it('should log an error when falling back to the fallback fees', async () => {
    contentfulDown()

    await resolveToolConfigurations(T0)

    expect(logger.error).toHaveBeenCalledWith(
      'Contentful unavailable and no valid cached tool configurations, using fallback fees',
      expect.any(Error),
      { operation: 'resolveToolConfigurations', cacheAgeMs: null }
    )
  })

  it('should start from the fallback again after the cache is cleared', async () => {
    contentfulUp([makeConfig('burn-tokens')])
    await resolveToolConfigurations(T0)
    clearToolConfigCache()
    contentfulDown()

    await expect(resolveToolConfigurations(T0 + HOUR)).resolves.toMatchObject({ source: 'fallback' })
  })
})

// ---------------------------------------------------------------------------
// Prices end to end: what the server charges in each situation
// ---------------------------------------------------------------------------

describe('tool prices across a Contentful outage', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should charge the Contentful price, then the cached price, then the fallback price', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(T0)
    contentfulUp([makeConfig('liquidity-provider', true, { baseFee: 0.3 })])

    // 1. Contentful live
    await expect(getToolServiceFee('liquidity-provider')).resolves.toBe(0.3)

    // 2. Contentful down, cache valid
    contentfulDown()
    vi.setSystemTime(T0 + 12 * HOUR)
    await expect(getToolServiceFee('liquidity-provider')).resolves.toBe(0.3)

    // 3. Contentful down, cache expired
    vi.setSystemTime(T0 + MAX_AGE + HOUR)
    await expect(getToolServiceFee('liquidity-provider')).resolves.toBe(TOOL_FEE_FALLBACKS['liquidity-provider'].baseFee)
  })

  it('should show the cached prices to the app during an outage and the fallback prices after expiry', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(T0)
    contentfulUp([makeConfig('token-creator', true, { baseFee: 0.22 })])
    await getToolConfigurationsWithFallback()

    contentfulDown()
    vi.setSystemTime(T0 + HOUR)
    expect((await getToolConfigurationsWithFallback()).find((c) => c.toolId === 'token-creator')?.baseFee).toBe(0.22)

    vi.setSystemTime(T0 + MAX_AGE)
    expect((await getToolConfigurationsWithFallback()).find((c) => c.toolId === 'token-creator')?.baseFee).toBe(0.19)
  })

  it('should keep a tool disabled while Contentful is down and the cache is valid', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(T0)
    contentfulUp([makeConfig('burn-tokens', false)])
    await isToolEnabled('burn-tokens')

    contentfulDown()
    vi.setSystemTime(T0 + HOUR)
    await expect(isToolEnabled('burn-tokens')).resolves.toBe(false)

    // After expiry the fallback configuration applies (tools enabled by default)
    vi.setSystemTime(T0 + MAX_AGE)
    await expect(isToolEnabled('burn-tokens')).resolves.toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Cached accessors
// ---------------------------------------------------------------------------

describe('getCachedToolConfigurations', () => {
  it('should returns all tool configurations from Contentful', async () => {
    const configs = [makeConfig('burn-tokens'), makeConfig('token-creator')]
    contentfulUp(configs)

    const result = await getCachedToolConfigurations()
    expect(result).toEqual(configs)
  })

  it('should calls Contentful', async () => {
    contentfulUp([])
    await getCachedToolConfigurations()
    expect(mockFetchToolConfigurations).toHaveBeenCalled()
  })

  it('should returns empty array when Contentful returns empty', async () => {
    contentfulUp([])
    const result = await getCachedToolConfigurations()
    expect(result).toEqual([])
  })

  it('should returns empty array when Contentful throws and nothing is cached', async () => {
    contentfulDown()
    const result = await getCachedToolConfigurations()
    expect(result).toEqual([])
  })

  it('should return the cached values when Contentful throws after a successful fetch', async () => {
    const configs = [makeConfig('burn-tokens', true, { baseFee: 0.02 })]
    contentfulUp(configs)
    await getCachedToolConfigurations()
    contentfulDown()

    await expect(getCachedToolConfigurations()).resolves.toEqual(configs)
  })

  it('should register the Next.js cache lifetime from the policy and the webhook tag', async () => {
    contentfulUp([])
    await getCachedToolConfigurations()

    expect(cacheLife).toHaveBeenCalledWith({
      stale: TOOL_CONFIG_CACHE_POLICY.revalidateSeconds,
      revalidate: TOOL_CONFIG_CACHE_POLICY.revalidateSeconds,
      expire: TOOL_CONFIG_CACHE_POLICY.expireSeconds,
    })
    expect(cacheTag).toHaveBeenCalledWith('tool-configs')
  })
})

describe('getCachedToolConfig', () => {
  it('should returns the matching config by toolId', async () => {
    contentfulUp([makeConfig('burn-tokens'), makeConfig('token-creator')])

    const result = await getCachedToolConfig('burn-tokens')
    expect(result?.toolId).toBe('burn-tokens')
  })

  it('should returns null when toolId not found', async () => {
    contentfulUp([makeConfig('burn-tokens')])

    const result = await getCachedToolConfig('unknown-tool')
    expect(result).toBeNull()
  })

  it('should returns null when configs array is empty', async () => {
    contentfulUp([])

    const result = await getCachedToolConfig('burn-tokens')
    expect(result).toBeNull()
  })

  it('should returns correct config when multiple configs exist', async () => {
    const bt = makeConfig('burn-tokens', true, { baseFee: 0.05 })
    const tc = makeConfig('token-creator', false, { baseFee: 0.2 })
    contentfulUp([bt, tc])

    const result = await getCachedToolConfig('token-creator')
    expect(result?.isEnabled).toBe(false)
    expect(result?.baseFee).toBe(0.2)
  })
})

describe('isToolEnabled', () => {
  it('should returns true when tool is enabled in config', async () => {
    contentfulUp([makeConfig('burn-tokens', true)])
    const result = await isToolEnabled('burn-tokens')
    expect(result).toBe(true)
  })

  it('should returns false when tool is disabled in config', async () => {
    contentfulUp([makeConfig('burn-tokens', false)])
    const result = await isToolEnabled('burn-tokens')
    expect(result).toBe(false)
  })

  it('should defaults to true when tool has no config', async () => {
    contentfulUp([])
    const result = await isToolEnabled('unknown-tool')
    expect(result).toBe(true)
  })

  it('should defaults to true when Contentful throws and nothing is cached', async () => {
    contentfulDown()
    const result = await isToolEnabled('burn-tokens')
    expect(result).toBe(true)
  })
})

describe('getToolConfigurationsWithFallback', () => {
  const TOOL_COUNT = Object.keys(TOOL_FEE_FALLBACKS).length

  it('should provide the fallback fees of every tool when Contentful is down', async () => {
    contentfulDown()

    const result = await getToolConfigurationsWithFallback()

    expect(result).toHaveLength(TOOL_COUNT)
    expect(result.find((c) => c.toolId === 'liquidity-provider')).toEqual({
      toolId: 'liquidity-provider',
      isEnabled: true,
      baseFee: 0.5,
      networkFee: 0.0005,
    })
    expect(result.find((c) => c.toolId === 'transaction-multisender')?.baseFee).toBe(0.001)
  })

  it('should provide the fallback fees of every tool when Contentful returns no entries', async () => {
    contentfulUp([])

    const result = await getToolConfigurationsWithFallback()

    expect(result).toHaveLength(TOOL_COUNT)
    result.forEach((config) => expect(config.baseFee).toBe(TOOL_FEE_FALLBACKS[config.toolId as keyof typeof TOOL_FEE_FALLBACKS].baseFee))
  })

  it('should keep the Contentful configuration and only fill in the missing tools', async () => {
    contentfulUp([makeConfig('burn-tokens', false, { baseFee: 0.02 })])

    const result = await getToolConfigurationsWithFallback()

    expect(result).toHaveLength(TOOL_COUNT)
    expect(result.find((c) => c.toolId === 'burn-tokens')).toMatchObject({ isEnabled: false, baseFee: 0.02 })
    expect(result.find((c) => c.toolId === 'update-metadata')?.baseFee).toBe(0.19)
  })

  it('should leave getCachedToolConfig returning raw Contentful data (null when missing)', async () => {
    contentfulUp([])

    await expect(getCachedToolConfig('burn-tokens')).resolves.toBeNull()
  })
})
