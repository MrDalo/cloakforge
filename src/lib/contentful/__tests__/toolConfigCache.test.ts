/**
 * Unit tests for src/lib/contentful/toolConfigCache.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockGetAllToolConfigurations = vi.hoisted(() => vi.fn())

vi.mock('@/lib/contentful/client', () => ({
  getAllToolConfigurations: mockGetAllToolConfigurations,
}))

import { getCachedToolConfigurations, getCachedToolConfig, isToolEnabled } from '../toolConfigCache'
import type { ToolConfiguration } from '../client'

function makeConfig(toolId: string, isEnabled = true, overrides: Partial<ToolConfiguration> = {}): ToolConfiguration {
  return { toolId, isEnabled, baseFee: 0.1, networkFee: 0.01, ...overrides }
}

describe('getCachedToolConfigurations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should returns all tool configurations from getAllToolConfigurations', async () => {
    const configs = [makeConfig('burn-tokens'), makeConfig('token-creator')]
    mockGetAllToolConfigurations.mockResolvedValue(configs)

    const result = await getCachedToolConfigurations()
    expect(result).toEqual(configs)
  })

  it('should calls getAllToolConfigurations', async () => {
    mockGetAllToolConfigurations.mockResolvedValue([])
    await getCachedToolConfigurations()
    expect(mockGetAllToolConfigurations).toHaveBeenCalled()
  })

  it('should returns empty array when getAllToolConfigurations returns empty', async () => {
    mockGetAllToolConfigurations.mockResolvedValue([])
    const result = await getCachedToolConfigurations()
    expect(result).toEqual([])
  })

  it('should returns empty array when getAllToolConfigurations throws', async () => {
    mockGetAllToolConfigurations.mockRejectedValue(new Error('Contentful down'))
    const result = await getCachedToolConfigurations()
    expect(result).toEqual([])
  })
})

describe('getCachedToolConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should returns the matching config by toolId', async () => {
    const configs = [makeConfig('burn-tokens'), makeConfig('token-creator')]
    mockGetAllToolConfigurations.mockResolvedValue(configs)

    const result = await getCachedToolConfig('burn-tokens')
    expect(result?.toolId).toBe('burn-tokens')
  })

  it('should returns null when toolId not found', async () => {
    mockGetAllToolConfigurations.mockResolvedValue([makeConfig('burn-tokens')])

    const result = await getCachedToolConfig('unknown-tool')
    expect(result).toBeNull()
  })

  it('should returns null when configs array is empty', async () => {
    mockGetAllToolConfigurations.mockResolvedValue([])

    const result = await getCachedToolConfig('burn-tokens')
    expect(result).toBeNull()
  })

  it('should returns correct config when multiple configs exist', async () => {
    const bt = makeConfig('burn-tokens', true, { baseFee: 0.05 })
    const tc = makeConfig('token-creator', false, { baseFee: 0.2 })
    mockGetAllToolConfigurations.mockResolvedValue([bt, tc])

    const result = await getCachedToolConfig('token-creator')
    expect(result?.isEnabled).toBe(false)
    expect(result?.baseFee).toBe(0.2)
  })
})

describe('isToolEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should returns true when tool is enabled in config', async () => {
    mockGetAllToolConfigurations.mockResolvedValue([makeConfig('burn-tokens', true)])
    const result = await isToolEnabled('burn-tokens')
    expect(result).toBe(true)
  })

  it('should returns false when tool is disabled in config', async () => {
    mockGetAllToolConfigurations.mockResolvedValue([makeConfig('burn-tokens', false)])
    const result = await isToolEnabled('burn-tokens')
    expect(result).toBe(false)
  })

  it('should defaults to true when tool has no config', async () => {
    mockGetAllToolConfigurations.mockResolvedValue([])
    const result = await isToolEnabled('unknown-tool')
    expect(result).toBe(true)
  })

  it('should defaults to true when getAllToolConfigurations throws', async () => {
    mockGetAllToolConfigurations.mockRejectedValue(new Error('network error'))
    const result = await isToolEnabled('burn-tokens')
    expect(result).toBe(true)
  })
})
