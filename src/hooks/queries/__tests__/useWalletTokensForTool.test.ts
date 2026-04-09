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
import { renderHook, waitFor } from '@testing-library/react'
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

vi.mock('@/lib/utils/toolHelpers', () => ({
  shouldIncludeAuthorities: vi.fn((toolType: string) => ['revoke-mint-authority', 'revoke-freeze-authority', 'freeze-accounts', 'unfreeze-accounts'].includes(toolType)),
}))

import {
  useWalletTokensForTool,
  useWalletTokensForBurnTool,
  useWalletTokensForAll,
  useWalletTokensForRevokeMintAuthority,
  useWalletTokensForRevokeFreezeAuthority,
  useWalletTokensForFreezeAccounts,
  useWalletTokensForUnfreezeAccounts,
  useWalletTokensForCreateLiquidity,
  useWalletTokensForTransactionMultisender,
  walletTokensQueryKeys,
  useInvalidateWalletTokens,
} from '../useWalletTokensForTool'
import { useWallet } from '@solana/wallet-adapter-react'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
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
      publicKey: mockPublicKey as any,
      connected: true,
    } as any)
  })

  it('is disabled when wallet is not connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      publicKey: null,
      connected: false,
    } as any)

    const { result } = renderHook(() => useWalletTokensForTool('burn-tokens'), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when publicKey is null', () => {
    vi.mocked(useWallet).mockReturnValue({
      publicKey: null,
      connected: true,
    } as any)

    const { result } = renderHook(() => useWalletTokensForTool('burn-tokens'), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('is disabled when enabled option is false', () => {
    const { result } = renderHook(() => useWalletTokensForTool('burn-tokens', { enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
  })

  it('fetches tokens when wallet is connected', async () => {
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

  it('posts correct toolType in request body', async () => {
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

  it('handles API error response', async () => {
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
    await vi.advanceTimersByTimeAsync(8000)

    vi.useRealTimers()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain('Unauthorized')
  })

  it('returns empty array when wallet is connected but query fn returns empty', async () => {
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
  it('all key is correct', () => {
    expect(walletTokensQueryKeys.all).toEqual(['walletTokensForTool'])
  })

  it('wallet key includes wallet address', () => {
    const key = walletTokensQueryKeys.wallet('TestWallet111')
    expect(key).toEqual(['walletTokensForTool', 'TestWallet111'])
  })

  it('wallet key with undefined wallet address', () => {
    const key = walletTokensQueryKeys.wallet(undefined)
    expect(key).toEqual(['walletTokensForTool', undefined])
  })

  it('tool key includes wallet address and toolType', () => {
    const key = walletTokensQueryKeys.tool('TestWallet111', 'burn-tokens')
    expect(key).toEqual(['walletTokensForTool', 'TestWallet111', 'burn-tokens'])
  })

  it('toolWithOptions key includes options object', () => {
    const options = { includeImages: false }
    const key = walletTokensQueryKeys.toolWithOptions('TestWallet111', 'burn-tokens', options)
    expect(key).toEqual(['walletTokensForTool', 'TestWallet111', 'burn-tokens', options])
  })
})

describe('useInvalidateWalletTokens', () => {
  it('returns invalidateAll function', () => {
    const { result } = renderHook(() => useInvalidateWalletTokens())
    expect(result.current.invalidateAll).toBeTypeOf('function')
  })

  it('returns invalidateForTool function', () => {
    const { result } = renderHook(() => useInvalidateWalletTokens())
    expect(result.current.invalidateForTool).toBeTypeOf('function')
  })

  it('invalidateAll can be called without error', () => {
    const { result } = renderHook(() => useInvalidateWalletTokens())
    expect(() => result.current.invalidateAll()).not.toThrow()
  })

  it('invalidateForTool can be called without error', () => {
    const { result } = renderHook(() => useInvalidateWalletTokens())
    expect(() => result.current.invalidateForTool('burn-tokens')).not.toThrow()
  })
})

describe('convenience hooks', () => {
  it('useWalletTokensForBurnTool is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as any)
    const { result } = renderHook(() => useWalletTokensForBurnTool(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('useWalletTokensForAll is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as any)
    const { result } = renderHook(() => useWalletTokensForAll(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('useWalletTokensForRevokeMintAuthority is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as any)
    const { result } = renderHook(() => useWalletTokensForRevokeMintAuthority(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('useWalletTokensForRevokeFreezeAuthority is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as any)
    const { result } = renderHook(() => useWalletTokensForRevokeFreezeAuthority(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('useWalletTokensForFreezeAccounts is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as any)
    const { result } = renderHook(() => useWalletTokensForFreezeAccounts(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('useWalletTokensForUnfreezeAccounts is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as any)
    const { result } = renderHook(() => useWalletTokensForUnfreezeAccounts(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('useWalletTokensForCreateLiquidity is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as any)
    const { result } = renderHook(() => useWalletTokensForCreateLiquidity(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })

  it('useWalletTokensForTransactionMultisender is disabled when not connected', () => {
    vi.mocked(useWallet).mockReturnValue({ publicKey: null, connected: false } as any)
    const { result } = renderHook(() => useWalletTokensForTransactionMultisender(), { wrapper: createWrapper() })
    expect(result.current.fetchStatus).toBe('idle')
  })
})

describe('useWalletTokensForTool module exports', () => {
  it('exports useWalletTokensForTool as a function', async () => {
    const mod = await import('../useWalletTokensForTool')
    expect(mod.useWalletTokensForTool).toBeTypeOf('function')
  })

  it('exports all convenience hooks', async () => {
    const mod = await import('../useWalletTokensForTool')
    expect(mod.useWalletTokensForBurnTool).toBeTypeOf('function')
    expect(mod.useWalletTokensForAll).toBeTypeOf('function')
    expect(mod.useWalletTokensForRevokeMintAuthority).toBeTypeOf('function')
    expect(mod.useWalletTokensForRevokeFreezeAuthority).toBeTypeOf('function')
    expect(mod.useWalletTokensForFreezeAccounts).toBeTypeOf('function')
    expect(mod.useWalletTokensForUnfreezeAccounts).toBeTypeOf('function')
    expect(mod.useWalletTokensForCreateLiquidity).toBeTypeOf('function')
    expect(mod.useWalletTokensForTransactionMultisender).toBeTypeOf('function')
    expect(mod.useInvalidateWalletTokens).toBeTypeOf('function')
  })
})
