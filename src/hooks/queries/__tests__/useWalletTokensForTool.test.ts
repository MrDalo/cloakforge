// @vitest-environment jsdom
/**
 * useWalletTokensForTool Hook Tests
 *
 * Tests:
 * - Query is disabled when wallet not connected
 * - Correct toolType passed
 * - walletTokensQueryKeys factory
 * - Convenience hooks export correctly
 * - useInvalidateWalletTokens exports invalidation utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

vi.mock('server-only', () => ({}))

const mockPublicKey = {
  toString: () => 'TestWallet111111111111111111111111111111111',
  toBase58: () => 'TestWallet111111111111111111111111111111111',
}

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    publicKey: mockPublicKey,
    connected: true,
  })),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}))

import {
  useWalletTokensForTool,
  useWalletTokensForBurnTool,
  useWalletTokensForAll,
  useWalletTokensForRevokeMintAuthority,
  useWalletTokensForRevokeFreezeAuthority,
  useWalletTokensForFreezeWallets,
  useWalletTokensForUnfreezeWallets,
  useWalletTokensForLiquidityProvider,
  useWalletTokensForTransactionMultisender,
  walletTokensQueryKeys,
} from '../useWalletTokensForTool'
import { useWallet } from '@solana/wallet-adapter-react'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  Wrapper.displayName = 'QueryClientWrapper'
  return Wrapper
}

const mockTokens = [
  {
    mint: 'Mint111111111111111111111111111111111111111',
    owner: 'TestWallet111111111111111111111111111111111',
    amount: '1000000',
    decimals: 6,
    symbol: 'TEST',
    name: 'Test Token',
  },
]

describe('useWalletTokensForTool', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useWallet).mockReturnValue({
      publicKey: mockPublicKey,
      connected: true,
    } as ReturnType<typeof useWallet>)
  })

  it('should is disabled when wallet is not connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      publicKey: null,
      connected: false,
    } as ReturnType<typeof useWallet>)

    const { result } = renderHook(() => useWalletTokensForTool('burn-tokens'), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should is disabled when publicKey is null', () => {
    vi.mocked(useWallet).mockReturnValue({
      publicKey: null,
      connected: true,
    } as ReturnType<typeof useWallet>)

    const { result } = renderHook(() => useWalletTokensForTool('burn-tokens'), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should is disabled when enabled option is false', () => {
    const { result } = renderHook(() => useWalletTokensForTool('burn-tokens', { enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should fetches tokens when wallet is connected', async () => {
    const mockResponse = {
      status: 'success',
      data: {
        tokens: {
          tokens: mockTokens,
        },
      },
      status_code: 200,
      error_message: null,
      error_code: null,
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const { result } = renderHook(() => useWalletTokensForTool('burn-tokens'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockTokens)
  })

  it('should posts correct toolType in request body', async () => {
    const mockResponse = {
      status: 'success',
      data: { tokens: { tokens: mockTokens } },
      status_code: 200,
      error_message: null,
      error_code: null,
    }

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)
    global.fetch = fetchMock

    const { result } = renderHook(() => useWalletTokensForTool('revoke-mint-authority'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const fetchCall = fetchMock.mock.calls[0]
    const body = JSON.parse(fetchCall[1].body as string)
    expect(body.toolType).toBe('revoke-mint-authority')
    expect(body.walletAddress).toBe(mockPublicKey.toString())
  })

  it('should handles API error response', async () => {
    // The hook has retry:3 with exponential backoff (1s+2s+4s=7s total).
    // Use fake timers to skip through retry delays without actually waiting.
    vi.useFakeTimers()

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error_message: 'Unauthorized' }),
      status: 401,
    } as Response)

    const { result } = renderHook(() => useWalletTokensForTool('burn-tokens'), {
      wrapper: createWrapper(),
    })

    // Advance past all retry delays (1000 + 2000 + 4000 = 7000ms)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8000)
    })

    vi.useRealTimers()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain('Unauthorized')
  })

  it('should returns empty array when wallet is connected but query fn returns empty', async () => {
    // Simulate edge: connected and publicKey exist, but no tokens
    const mockResponse = {
      status: 'success',
      data: { tokens: { tokens: [] } },
      status_code: 200,
      error_message: null,
      error_code: null,
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const { result } = renderHook(() => useWalletTokensForTool('burn-tokens'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })
})

describe('walletTokensQueryKeys', () => {
  it('should all key is correct', () => {
    expect(walletTokensQueryKeys.all).toEqual(['walletTokensForTool'])
  })

  it('should wallet key includes wallet address', () => {
    const key = walletTokensQueryKeys.wallet('TestWallet111')
    expect(key).toEqual(['walletTokensForTool', 'TestWallet111'])
  })

  it('should wallet key with undefined wallet address', () => {
    const key = walletTokensQueryKeys.wallet(undefined)
    expect(key).toEqual(['walletTokensForTool', undefined])
  })

  it('should tool key includes wallet address and toolType', () => {
    const key = walletTokensQueryKeys.tool('TestWallet111', 'burn-tokens')
    expect(key).toEqual(['walletTokensForTool', 'TestWallet111', 'burn-tokens'])
  })

  it('should toolWithOptions key includes options object', () => {
    const options = { includeImages: false }
    const key = walletTokensQueryKeys.toolWithOptions('TestWallet111', 'burn-tokens', options)
    expect(key).toEqual(['walletTokensForTool', 'TestWallet111', 'burn-tokens', options])
  })
})

describe('convenience hooks', () => {
  it('should useWalletTokensForBurnTool is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as ReturnType<typeof useWallet>)
    const { result } = renderHook(() => useWalletTokensForBurnTool(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should useWalletTokensForAll is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as ReturnType<typeof useWallet>)
    const { result } = renderHook(() => useWalletTokensForAll(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should useWalletTokensForRevokeMintAuthority is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as ReturnType<typeof useWallet>)
    const { result } = renderHook(() => useWalletTokensForRevokeMintAuthority(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should useWalletTokensForRevokeFreezeAuthority is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as ReturnType<typeof useWallet>)
    const { result } = renderHook(() => useWalletTokensForRevokeFreezeAuthority(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should useWalletTokensForFreezeWallets is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as ReturnType<typeof useWallet>)
    const { result } = renderHook(() => useWalletTokensForFreezeWallets(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should useWalletTokensForUnfreezeWallets is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as ReturnType<typeof useWallet>)
    const { result } = renderHook(() => useWalletTokensForUnfreezeWallets(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should useWalletTokensForLiquidityProvider is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as ReturnType<typeof useWallet>)
    const { result } = renderHook(() => useWalletTokensForLiquidityProvider(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('should useWalletTokensForTransactionMultisender is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as ReturnType<typeof useWallet>)
    const { result } = renderHook(() => useWalletTokensForTransactionMultisender(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useWalletTokensForTool module exports', () => {
  it('should exports useWalletTokensForTool as a function', async () => {
    const mod = await import('../useWalletTokensForTool')
    expect(mod.useWalletTokensForTool).toBeTypeOf('function')
  })

  it('should exports all convenience hooks', async () => {
    const mod = await import('../useWalletTokensForTool')
    expect(mod.useWalletTokensForBurnTool).toBeTypeOf('function')
    expect(mod.useWalletTokensForAll).toBeTypeOf('function')
    expect(mod.useWalletTokensForRevokeMintAuthority).toBeTypeOf('function')
    expect(mod.useWalletTokensForRevokeFreezeAuthority).toBeTypeOf('function')
    expect(mod.useWalletTokensForFreezeWallets).toBeTypeOf('function')
    expect(mod.useWalletTokensForUnfreezeWallets).toBeTypeOf('function')
    expect(mod.useWalletTokensForLiquidityProvider).toBeTypeOf('function')
    expect(mod.useWalletTokensForTransactionMultisender).toBeTypeOf('function')
  })
})
