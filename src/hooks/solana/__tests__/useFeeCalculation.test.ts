// @vitest-environment jsdom
/**
 * useFeeCalculation Hook Tests
 *
 * Tests:
 * - Returns loading state when toolConfig is not loaded
 * - Calculates base, network, priority fees from toolConfig
 * - Calculates additional fees from formData + toolFeeConfigs
 * - Builds correct fee breakdown
 * - Handles calculation errors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

const mockToolConfig = {
  toolId: 'burn-tokens',
  isEnabled: true,
  baseFee: 0.1,
  networkFee: 0.005,
  priorityFee: 0.002,
}

vi.mock('@/stores/toolConfigStore', () => ({
  useToolConfig: vi.fn(() => ({
    config: mockToolConfig,
    isEnabled: true,
  })),
}))

vi.mock('@/lib/utils/feeConfigs', () => ({
  toolFeeConfigs: {
    'burn-tokens': vi.fn(() => [{ fieldName: 'burnAll', label: 'Burn All Tokens', fee: 0.05, description: 'Fee for burning all tokens' }]),
    'token-creator': vi.fn(() => [
      { fieldName: 'revokeMintAuthority', label: 'Revoke Mint Authority', fee: 0.05 },
      { fieldName: 'revokeFreezeAuthority', label: 'Revoke Freeze Authority', fee: 0.05 },
    ]),
  } as Record<
    string,
    (formData: Record<string, unknown>) => Array<{ fieldName: string; label: string; fee: number; description?: string }>
  >,
}))

import { useFeeCalculation } from '../useFeeCalculation'
import { useToolConfig } from '@/stores/toolConfigStore'
import { toolFeeConfigs } from '@/lib/utils/feeConfigs'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

describe('useFeeCalculation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useToolConfig).mockReturnValue({
      config: mockToolConfig,
      isEnabled: true,
    } as ReturnType<typeof useToolConfig>)
  })

  it('should returns loading state when toolConfig is null', () => {
    vi.mocked(useToolConfig).mockReturnValue({ config: null, isEnabled: true })

    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {} }))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.totalFeeSOL).toBe(0)
    expect(result.current.breakdown).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should calculates totalFeeSOL from base + network fees', () => {
    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {} }))

    // base 0.1 + network 0.005 = 0.105 (no priority, no additional)
    expect(result.current.totalFeeSOL).toBeCloseTo(0.105, 5)
    expect(result.current.isLoading).toBe(false)
  })

  it('should includes priority fee when enablePriorityFee is true', () => {
    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {}, enablePriorityFee: true }))

    // base 0.1 + network 0.005 + priority 0.002 = 0.107
    expect(result.current.priorityFeeSOL).toBeCloseTo(0.002, 5)
    expect(result.current.totalFeeSOL).toBeCloseTo(0.107, 5)
  })

  it('should does not include priority fee when enablePriorityFee is false', () => {
    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {}, enablePriorityFee: false }))

    expect(result.current.priorityFeeSOL).toBe(0)
  })

  it('should adds additional fee when formData field is true', () => {
    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: { burnAll: true } }))

    expect(result.current.additionalFeesSOL).toBeCloseTo(0.05, 5)
    // total = 0.1 + 0.005 + 0.05 = 0.155
    expect(result.current.totalFeeSOL).toBeCloseTo(0.155, 5)
  })

  it('adds additional fee when formData field is string "true"', () => {
    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: { burnAll: 'true' } }))

    expect(result.current.additionalFeesSOL).toBeCloseTo(0.05, 5)
  })

  it('should does not add additional fee when formData field is false', () => {
    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: { burnAll: false } }))

    expect(result.current.additionalFeesSOL).toBe(0)
  })

  it('should totalFeeLamports equals totalFeeSOL * LAMPORTS_PER_SOL rounded', () => {
    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {} }))

    expect(result.current.totalFeeLamports).toBe(Math.round(result.current.totalFeeSOL * LAMPORTS_PER_SOL))
  })

  it('should breakdown includes base fee entry', () => {
    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {} }))

    const baseEntry = result.current.breakdown.find((b) => b.name === 'Service Fee')
    expect(baseEntry).toBeDefined()
    expect(baseEntry?.amount).toBeCloseTo(0.1, 5)
  })

  it('should breakdown includes network fee entry', () => {
    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {} }))

    const networkEntry = result.current.breakdown.find((b) => b.name === 'Network Fee (estimated)')
    expect(networkEntry).toBeDefined()
    expect(networkEntry?.amount).toBeCloseTo(0.005, 5)
  })

  it('should breakdown includes priority fee entry when enabled', () => {
    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {}, enablePriorityFee: true }))

    const priorityEntry = result.current.breakdown.find((b) => b.name === 'Priority Fee')
    expect(priorityEntry).toBeDefined()
    expect(priorityEntry?.amount).toBeCloseTo(0.002, 5)
  })

  it('should breakdown includes conditional fee entry when field is active', () => {
    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: { burnAll: true } }))

    const burnAllEntry = result.current.breakdown.find((b) => b.name === 'Burn All Tokens')
    expect(burnAllEntry).toBeDefined()
    expect(burnAllEntry?.amount).toBeCloseTo(0.05, 5)
  })

  it('should handles tool with no toolFeeConfig (no additional fees)', () => {
    vi.mocked(useToolConfig).mockReturnValue({
      config: { ...mockToolConfig, toolId: 'freeze-wallets' },
      isEnabled: true,
    } as ReturnType<typeof useToolConfig>)

    const { result } = renderHook(() => useFeeCalculation({ toolId: 'freeze-wallets', formData: {} }))

    // freeze-accounts not in toolFeeConfigs mock, so no additional fees
    expect(result.current.additionalFeesSOL).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('should returns error state when toolFeeConfigs throws inside useMemo', () => {
    // useToolConfig is called outside the useMemo try-catch, so we instead
    // trigger the catch block by making the toolFeeConfigs function throw.
    vi.mocked(toolFeeConfigs['burn-tokens' as keyof typeof toolFeeConfigs]).mockImplementationOnce(() => {
      throw new Error('Fee config error')
    })

    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {} }))

    expect(result.current.error).toBe('Fee config error')
    expect(result.current.totalFeeSOL).toBe(0)
    expect(result.current.isLoading).toBe(false)
  })

  it('should baseFeeSOL reflects toolConfig.baseFee', () => {
    vi.mocked(useToolConfig).mockReturnValue({
      config: { ...mockToolConfig, baseFee: 0.25 },
      isEnabled: true,
    } as ReturnType<typeof useToolConfig>)

    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {} }))

    expect(result.current.baseFeeSOL).toBeCloseTo(0.25, 5)
  })

  it('should networkFeeSOL reflects toolConfig.networkFee', () => {
    vi.mocked(useToolConfig).mockReturnValue({
      config: { ...mockToolConfig, networkFee: 0.003 },
      isEnabled: true,
    } as ReturnType<typeof useToolConfig>)

    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {} }))

    expect(result.current.networkFeeSOL).toBeCloseTo(0.003, 5)
  })

  it('should returns zero fees when baseFee and networkFee are 0', () => {
    vi.mocked(useToolConfig).mockReturnValue({
      config: { ...mockToolConfig, baseFee: 0, networkFee: 0, priorityFee: 0 },
      isEnabled: true,
    } as ReturnType<typeof useToolConfig>)

    const { result } = renderHook(() => useFeeCalculation({ toolId: 'burn-tokens', formData: {} }))

    expect(result.current.totalFeeSOL).toBe(0)
    expect(result.current.breakdown).toEqual([])
  })
})
