// @vitest-environment jsdom
/**
 * useGetBalanceQuery Hook Tests
 *
 * Tests:
 * - Query is enabled when address is provided
 * - Query fetches balance and Solana price
 * - Query structure and caching behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { PublicKey } from '@solana/web3.js'

vi.mock('server-only', () => ({}))

const mockGetBalance = vi.fn().mockResolvedValue(5_000_000_000) // 5 SOL in lamports
const mockRpcEndpoint = 'https://api.mainnet-beta.solana.com'

vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: vi.fn(() => ({
    connection: {
      getBalance: mockGetBalance,
      rpcEndpoint: mockRpcEndpoint,
    },
  })),
}))

vi.mock('@/lib/solana', () => ({
  getSolanaPrice: vi.fn().mockResolvedValue(150.0),
}))

import { useGetBalanceQuery } from '../useGetBalanceQuery'
import { getSolanaPrice } from '@/lib/solana'
import { useConnection } from '@solana/wallet-adapter-react'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

const TEST_ADDRESS = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

describe('useGetBalanceQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetBalance.mockResolvedValue(5_000_000_000)
    vi.mocked(getSolanaPrice).mockResolvedValue(150.0)
    vi.mocked(useConnection).mockReturnValue({
      connection: {
        getBalance: mockGetBalance,
        rpcEndpoint: mockRpcEndpoint,
      } as any,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches balance and solana price when address is provided', async () => {
    const { result } = renderHook(() => useGetBalanceQuery({ address: TEST_ADDRESS }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      balance: 5_000_000_000,
      solanaPrice: 150.0,
    })
  })

  it('calls connection.getBalance with the provided address', async () => {
    const { result } = renderHook(() => useGetBalanceQuery({ address: TEST_ADDRESS }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockGetBalance).toHaveBeenCalledWith(TEST_ADDRESS)
  })

  it('calls getSolanaPrice', async () => {
    const { result } = renderHook(() => useGetBalanceQuery({ address: TEST_ADDRESS }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(getSolanaPrice).toHaveBeenCalled()
  })

  it('includes address in query key', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children)

    const { result } = renderHook(() => useGetBalanceQuery({ address: TEST_ADDRESS }), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const queries = queryClient.getQueryCache().getAll()
    expect(queries.length).toBeGreaterThan(0)

    const queryKey = queries[0].queryKey
    expect(queryKey[0]).toBe('get-balance')
    expect(queryKey[1]).toMatchObject({ address: TEST_ADDRESS })
  })

  it('is enabled when address is a valid PublicKey', async () => {
    const { result } = renderHook(() => useGetBalanceQuery({ address: TEST_ADDRESS }), {
      wrapper: createWrapper(),
    })

    // Should not be idle (disabled)
    await waitFor(() => expect(result.current.fetchStatus).not.toBe('idle'))
  })

  it('handles balance fetch error', async () => {
    // retry:1 means one retry after 1000ms — use fake timers to skip the delay
    vi.useFakeTimers()
    mockGetBalance.mockRejectedValue(new Error('RPC Error'))

    const { result } = renderHook(() => useGetBalanceQuery({ address: TEST_ADDRESS }), {
      wrapper: createWrapper(),
    })

    await vi.advanceTimersByTimeAsync(3000)
    vi.useRealTimers()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('RPC Error')
  })

  it('handles getSolanaPrice error', async () => {
    // retry:1 means one retry after 1000ms — use fake timers to skip the delay
    vi.useFakeTimers()
    vi.mocked(getSolanaPrice).mockRejectedValue(new Error('Price fetch failed'))

    const { result } = renderHook(() => useGetBalanceQuery({ address: TEST_ADDRESS }), {
      wrapper: createWrapper(),
    })

    await vi.advanceTimersByTimeAsync(3000)
    vi.useRealTimers()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Price fetch failed')
  })

  it('returns correct data structure', async () => {
    mockGetBalance.mockResolvedValue(2_000_000_000) // 2 SOL
    vi.mocked(getSolanaPrice).mockResolvedValue(200.0)

    const { result } = renderHook(() => useGetBalanceQuery({ address: TEST_ADDRESS }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.balance).toBe(2_000_000_000)
    expect(result.current.data?.solanaPrice).toBe(200.0)
  })

  it('is exported as a named function', async () => {
    const mod = await import('../useGetBalanceQuery')
    expect(mod.useGetBalanceQuery).toBeTypeOf('function')
  })
})
