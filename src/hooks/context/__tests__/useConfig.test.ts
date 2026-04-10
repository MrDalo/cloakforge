// @vitest-environment jsdom
/**
 * useConfig Hook Tests
 *
 * Tests that useConfig returns the value from ConfigContext and throws
 * when called outside a ConfigProvider.
 */

import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'

vi.mock('server-only', () => ({}))

import { useConfig } from '../useConfig'
import { ConfigContext } from '@/providers/ConfigProvider'
import type { ConfigType } from '@/types/config'

const mockConfig: ConfigType = {
  rpcPublicEndpoint: 'https://api.mainnet-beta.solana.com',
  feeWalletAddress: 'FeeWallet1111111111111111111111111111111111',
}

describe('useConfig', () => {
  it('should returns config value when rendered inside ConfigProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(ConfigContext.Provider, { value: mockConfig }, children)

    const { result } = renderHook(() => useConfig(), { wrapper })

    expect(result.current).toEqual(mockConfig)
    expect(result.current.rpcPublicEndpoint).toBe('https://api.mainnet-beta.solana.com')
    expect(result.current.feeWalletAddress).toBe('FeeWallet1111111111111111111111111111111111')
  })

  it('should throws an error when rendered outside ConfigProvider', () => {
    // Suppress React error boundary console output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useConfig())
    }).toThrow('useConfig must be used within a ConfigProvider')

    consoleSpy.mockRestore()
  })

  it('should returns updated config when provider value changes', () => {
    let configValue = mockConfig

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(ConfigContext.Provider, { value: configValue }, children)

    const { result, rerender } = renderHook(() => useConfig(), { wrapper })
    expect(result.current.rpcPublicEndpoint).toBe('https://api.mainnet-beta.solana.com')

    const newConfig: ConfigType = {
      rpcPublicEndpoint: 'https://rpc.new-endpoint.com',
      feeWalletAddress: 'NewFeeWallet111111111111111111111111111111',
    }
    configValue = newConfig
    rerender()

    expect(result.current.rpcPublicEndpoint).toBe('https://rpc.new-endpoint.com')
    expect(result.current.feeWalletAddress).toBe('NewFeeWallet111111111111111111111111111111')
  })

  it('should is exported as a named function', async () => {
    const mod = await import('../useConfig')
    expect(mod.useConfig).toBeTypeOf('function')
  })
})
