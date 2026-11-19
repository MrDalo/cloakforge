/**
 * AppProvider — hands the tool configurations (completed with the fallback fees) to the client store.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isValidElement, type ReactElement, type ReactNode } from 'react'

vi.mock('@/lib/config/getConfig', () => ({ default: vi.fn(() => ({ network: 'devnet' })) }))

// Child providers are replaced by markers — only the props AppProvider passes matter here
vi.mock('../ConfigProvider', () => ({ ConfigProvider: ({ children }: { children: ReactNode }) => children }))
vi.mock('../SolanaProvider', () => ({ SolanaProvider: ({ children }: { children: ReactNode }) => children }))
vi.mock('../QueryProvider', () => ({ default: ({ children }: { children: ReactNode }) => children }))
vi.mock('../ToolConfigProvider', () => ({ ToolConfigProvider: ({ children }: { children: ReactNode }) => children }))

const mockGetCachedToolConfigurations = vi.hoisted(() => vi.fn())
vi.mock('@/lib/contentful/client', () => ({
  fetchToolConfigurations: (...args: unknown[]) => mockGetCachedToolConfigurations(...args),
}))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

import AppProvider from '../AppProvider'
import { ToolConfigProvider } from '../ToolConfigProvider'
import { TOOL_FEE_FALLBACKS } from '@/lib/config/toolFeeFallbacks'
import { clearToolConfigCache } from '@/lib/contentful/toolConfigCache'
import type { ToolConfiguration } from '@/lib/contentful/client'

/** Depth-first search for the ToolConfigProvider element in the returned tree. */
const findToolConfigProvider = (node: ReactNode): ReactElement<{ initialConfigs: ToolConfiguration[] }> | undefined => {
  if (!isValidElement(node)) return undefined
  if (node.type === ToolConfigProvider) return node as ReactElement<{ initialConfigs: ToolConfiguration[] }>
  return findToolConfigProvider((node.props as { children?: ReactNode }).children)
}

const renderTree = async () => findToolConfigProvider(await AppProvider({ children: 'app' }))

describe('AppProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearToolConfigCache()
  })

  it('should hydrate the client store with the fallback fees of every tool when Contentful is down', async () => {
    mockGetCachedToolConfigurations.mockRejectedValue(new Error('Contentful down'))

    const provider = await renderTree()

    expect(provider).toBeDefined()
    const configs = provider!.props.initialConfigs
    expect(configs.map((c) => c.toolId).sort()).toEqual(Object.keys(TOOL_FEE_FALLBACKS).sort())
    expect(configs.find((c) => c.toolId === 'liquidity-provider')?.baseFee).toBe(0.5)
  })

  it('should pass the Contentful configuration through and complete it with fallbacks', async () => {
    mockGetCachedToolConfigurations.mockResolvedValue([{ toolId: 'burn-tokens', isEnabled: false, baseFee: 0.02, networkFee: 0.001 }])

    const configs = (await renderTree())!.props.initialConfigs

    expect(configs.find((c) => c.toolId === 'burn-tokens')).toMatchObject({ isEnabled: false, baseFee: 0.02 })
    expect(configs.find((c) => c.toolId === 'token-creator')?.baseFee).toBe(0.19)
  })
})
