// @vitest-environment jsdom
/**
 * useRevokeFreezeAuthority Hook Tests
 *
 * Tests:
 * - Hook initializes with correct default state
 * - Exposes revokeFreezeAuthority, isExecuting, lastResult, reset, isWalletReady, validationErrors
 * - revokeFreezeAuthority is a function
 * - isWalletReady reflects wallet connection state
 * - reset clears state
 * - Module exports
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

vi.mock('@/lib/errors', () => ({
  AppError: class AppError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  },
  handleError: vi.fn((err: unknown) => (err instanceof Error ? err.message : 'Unknown error')),
}))

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock('@solana/kit', () => ({
  address: vi.fn((addr: string) => addr),
}))

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: vi.fn(),
}))

vi.mock('@/lib/solana/validateBalance', () => ({
  validateBalance: vi.fn().mockResolvedValue({
    hasSufficientBalance: true,
    currentBalance: 5,
    estimatedCost: 0.011,
  }),
}))

vi.mock('@/lib/solana', () => ({
  confirmTransactionWithParallelStrategy: vi.fn().mockResolvedValue({
    confirmed: true,
    confirmationTime: 100,
    method: 'websocket',
  }),
  createConnectionPair: vi.fn(() => ({
    kitRpc: {},
    connection: {},
  })),
  getSolanaPrice: vi.fn().mockResolvedValue(150),
}))

vi.mock('@/stores/toolConfigStore', () => ({
  useToolConfig: vi.fn(() => ({
    config: { toolId: 'revoke-freeze-authority', baseFee: 0.01, networkFee: 0.0005 },
    isEnabled: true,
  })),
}))

vi.mock('@/lib/toast/showTransactionToast', () => ({
  showTransactionToast: vi.fn(),
}))

const mockConnection = {
  getBalance: vi.fn().mockResolvedValue(5_000_000_000),
  getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'testblockhash' }),
  sendRawTransaction: vi.fn().mockResolvedValue('revokeFreezeSignature456'),
  getSignatureStatus: vi.fn().mockResolvedValue({ value: { confirmationStatus: 'confirmed' } }),
}

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    connected: true,
    publicKey: { toString: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    signTransaction: vi.fn(async (tx: unknown) => ({
      ...(tx as object),
      serialize: () => Buffer.from('serialized'),
    })),
  })),
  useConnection: vi.fn(() => ({ connection: mockConnection })),
}))

import { useRevokeFreezeAuthority } from '../useRevokeFreezeAuthority'
import { useWallet } from '@solana/wallet-adapter-react'

describe('useRevokeFreezeAuthority', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      publicKey: { toString: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
      signTransaction: vi.fn(async (tx: unknown) => ({
        ...(tx as object),
        serialize: () => Buffer.from('serialized'),
      })),
    } as unknown as ReturnType<typeof useWallet>)
  })

  it('should initializes with correct default state', () => {
    const { result } = renderHook(() => useRevokeFreezeAuthority())

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('should exposes revokeFreezeAuthority as a function', () => {
    const { result } = renderHook(() => useRevokeFreezeAuthority())
    expect(result.current.revokeFreezeAuthority).toBeTypeOf('function')
  })

  it('should exposes reset as a function', () => {
    const { result } = renderHook(() => useRevokeFreezeAuthority())
    expect(result.current.reset).toBeTypeOf('function')
  })

  it('should isWalletReady is true when wallet is connected', () => {
    const { result } = renderHook(() => useRevokeFreezeAuthority())
    expect(result.current.isWalletReady).toBe(true)
  })

  it('should isWalletReady is false when wallet is not connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as unknown as ReturnType<typeof useWallet>)

    const { result } = renderHook(() => useRevokeFreezeAuthority())
    expect(result.current.isWalletReady).toBe(false)
  })

  it('should reset clears lastResult and validationErrors', () => {
    const { result } = renderHook(() => useRevokeFreezeAuthority())

    act(() => {
      result.current.reset()
    })

    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('should revokeFreezeAuthority returns null when wallet not connected', async () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as unknown as ReturnType<typeof useWallet>)

    const { result } = renderHook(() => useRevokeFreezeAuthority())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.revokeFreezeAuthority({
        tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      })
    })

    expect(execResult).toBeNull()
  })
})

describe('useRevokeFreezeAuthority module exports', () => {
  it('should exports useRevokeFreezeAuthority as a function', async () => {
    const mod = await import('../useRevokeFreezeAuthority')
    expect(mod.useRevokeFreezeAuthority).toBeTypeOf('function')
  })
})
