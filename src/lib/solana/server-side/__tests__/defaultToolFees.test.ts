import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
}))

const mockGetCachedToolConfig = vi.hoisted(() => vi.fn())
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: (...args: unknown[]) => mockGetCachedToolConfig(...args),
}))

import { DEFAULT_TOOL_BASE_FEES_SOL, resolveToolBaseFee, type FeeChargingToolId } from '../defaultToolFees'

const makeConfig = (baseFee: unknown) => ({ toolId: 'burn-tokens', isEnabled: true, baseFee, networkFee: 0.01 })

describe('DEFAULT_TOOL_BASE_FEES_SOL', () => {
  it('should define a fallback fee greater than zero for every fee-charging tool', () => {
    for (const fee of Object.values(DEFAULT_TOOL_BASE_FEES_SOL)) {
      expect(fee).toBeGreaterThan(0)
    }
  })
})

describe('resolveToolBaseFee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the configured baseFee', async () => {
    mockGetCachedToolConfig.mockResolvedValue(makeConfig(0.05))
    await expect(resolveToolBaseFee('burn-tokens')).resolves.toBe(0.05)
    expect(mockGetCachedToolConfig).toHaveBeenCalledWith('burn-tokens')
  })

  it('should honor an intentional baseFee of 0', async () => {
    mockGetCachedToolConfig.mockResolvedValue(makeConfig(0))
    await expect(resolveToolBaseFee('burn-tokens')).resolves.toBe(0)
  })

  it.each(Object.keys(DEFAULT_TOOL_BASE_FEES_SOL) as FeeChargingToolId[])(
    'should fall back to the hard-coded minimum (> 0) when %s has no config or Contentful is unavailable',
    async (toolId) => {
      mockGetCachedToolConfig.mockResolvedValue(null)
      const fee = await resolveToolBaseFee(toolId)
      expect(fee).toBe(DEFAULT_TOOL_BASE_FEES_SOL[toolId])
      expect(fee).toBeGreaterThan(0)
    }
  )

  it('should fall back to the hard-coded minimum when the lookup throws', async () => {
    mockGetCachedToolConfig.mockRejectedValue(new Error('Contentful down'))
    await expect(resolveToolBaseFee('token-creator')).resolves.toBe(DEFAULT_TOOL_BASE_FEES_SOL['token-creator'])
  })

  it.each([Number.NaN, -0.1, Number.POSITIVE_INFINITY, '0.1', undefined])(
    'should fall back to the hard-coded minimum for an invalid baseFee (%s)',
    async (baseFee) => {
      mockGetCachedToolConfig.mockResolvedValue(makeConfig(baseFee))
      await expect(resolveToolBaseFee('transaction-multisender')).resolves.toBe(DEFAULT_TOOL_BASE_FEES_SOL['transaction-multisender'])
    }
  )
})
