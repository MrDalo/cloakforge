import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const logger = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }))
vi.mock('@/lib/logger/logger', () => ({ getLogger: () => logger }))

vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: vi.fn(),
}))

import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import type { ToolConfiguration } from '@/lib/contentful/client'
import type { CoreToolType } from '@/types/toolTypes'
import { TOOL_FEE_FALLBACKS } from '../toolFeeFallbacks'
import { getToolServiceFee } from '../getToolServiceFee'

const ALL_TOOLS = Object.keys(TOOL_FEE_FALLBACKS) as CoreToolType[]

const contentfulConfig = (toolId: string, baseFee: unknown): ToolConfiguration =>
  ({ toolId, isEnabled: true, baseFee, networkFee: 0.0005 }) as ToolConfiguration

describe('getToolServiceFee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(ALL_TOOLS)('%s: should use the fee configured in Contentful', async (toolId) => {
    vi.mocked(getCachedToolConfig).mockResolvedValue(contentfulConfig(toolId, 0.777))

    await expect(getToolServiceFee(toolId)).resolves.toBe(0.777)
    expect(getCachedToolConfig).toHaveBeenCalledWith(toolId)
  })

  it.each(ALL_TOOLS)('%s: should use the fallback fee when Contentful has no configuration', async (toolId) => {
    vi.mocked(getCachedToolConfig).mockResolvedValue(null)

    await expect(getToolServiceFee(toolId)).resolves.toBe(TOOL_FEE_FALLBACKS[toolId].baseFee)
  })

  it.each(ALL_TOOLS)('%s: should use the fallback fee when Contentful is unreachable', async (toolId) => {
    vi.mocked(getCachedToolConfig).mockRejectedValue(new Error('Contentful unavailable'))

    await expect(getToolServiceFee(toolId)).resolves.toBe(TOOL_FEE_FALLBACKS[toolId].baseFee)
  })

  it.each([
    ['NaN', Number.NaN],
    ['a negative fee', -0.5],
    ['undefined', undefined],
    ['a non-numeric string', 'free'],
  ])('should use the fallback fee when the Contentful fee is %s', async (_label, baseFee) => {
    vi.mocked(getCachedToolConfig).mockResolvedValue(contentfulConfig('liquidity-provider', baseFee))

    await expect(getToolServiceFee('liquidity-provider')).resolves.toBe(0.5)
  })

  it('should respect a fee explicitly set to zero in Contentful', async () => {
    vi.mocked(getCachedToolConfig).mockResolvedValue(contentfulConfig('burn-tokens', 0))

    await expect(getToolServiceFee('burn-tokens')).resolves.toBe(0)
  })

  it('should warn when falling back because the tool has no configuration', async () => {
    vi.mocked(getCachedToolConfig).mockResolvedValue(null)

    await getToolServiceFee('token-creator')

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('fallback service fee'), undefined, {
      toolId: 'token-creator',
      fallbackFee: 0.19,
    })
  })

  it('should log an error when falling back because Contentful failed', async () => {
    const error = new Error('Contentful unavailable')
    vi.mocked(getCachedToolConfig).mockRejectedValue(error)

    await getToolServiceFee('update-metadata')

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('fallback service fee'), error, {
      toolId: 'update-metadata',
      fallbackFee: 0.19,
    })
  })
})
