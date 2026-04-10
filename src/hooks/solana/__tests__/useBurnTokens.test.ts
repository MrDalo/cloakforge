// @vitest-environment jsdom
/**
 * useBurnTokens Hook Tests
 *
 * Tests:
 * - Hook initializes with correct default state
 * - Exposes burnTokens, isExecuting, lastResult, reset, isWalletReady, validationErrors
 * - burnTokens is a function
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
    estimatedCost: 0.11,
  }),
}))

vi.mock('@/lib/solana', () => ({
  confirmTransactionWithParallelStrategy: vi.fn().mockResolvedValue({ confirmed: true, confirmationTime: 100, method: 'websocket' }),
  createConnectionPair: vi.fn(() => ({
    kitRpc: {},
    connection: {},
  })),
  getSolanaPrice: vi.fn().mockResolvedValue(150),
}))

vi.mock('@/stores/toolConfigStore', () => ({
  useToolConfig: vi.fn(() => ({
    config: { toolId: 'burn-tokens', baseFee: 0.01, networkFee: 0.0005 },
    isEnabled: true,
  })),
}))

vi.mock('@/lib/toast/showTransactionToast', () => ({
  showTransactionToast: vi.fn(),
}))

const mockConnection = {
  getBalance: vi.fn().mockResolvedValue(5_000_000_000),
  getParsedAccountInfo: vi.fn().mockResolvedValue({
    value: {
      data: {
        parsed: {
          info: {
            tokenAmount: { uiAmount: 100 },
          },
        },
      },
    },
  }),
  getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'testblockhash' }),
  sendRawTransaction: vi.fn().mockResolvedValue('testSignature123'),
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

import { useBurnTokens } from '../useBurnTokens'
import { useWallet } from '@solana/wallet-adapter-react'

describe('useBurnTokens', () => {
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

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useBurnTokens())

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('exposes burnTokens as a function', () => {
    const { result } = renderHook(() => useBurnTokens())
    expect(result.current.burnTokens).toBeTypeOf('function')
  })

  it('exposes reset as a function', () => {
    const { result } = renderHook(() => useBurnTokens())
    expect(result.current.reset).toBeTypeOf('function')
  })

  it('isWalletReady is true when wallet is connected', () => {
    const { result } = renderHook(() => useBurnTokens())
    expect(result.current.isWalletReady).toBe(true)
  })

  it('isWalletReady is false when wallet is not connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as unknown as ReturnType<typeof useWallet>)

    const { result } = renderHook(() => useBurnTokens())
    expect(result.current.isWalletReady).toBe(false)
  })

  it('reset clears lastResult and validationErrors', () => {
    const { result } = renderHook(() => useBurnTokens())

    act(() => {
      result.current.reset()
    })

    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('burnTokens returns null when wallet not connected', async () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as unknown as ReturnType<typeof useWallet>)

    const { result } = renderHook(() => useBurnTokens())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.burnTokens({
        tokenAccountAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        amount: 100,
        mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        decimals: 6,
        tokenSymbol: 'TEST',
      })
    })

    expect(execResult).toBeNull()
  })
})

describe('useBurnTokens module exports', () => {
  it('exports useBurnTokens as a function', async () => {
    const mod = await import('../useBurnTokens')
    expect(mod.useBurnTokens).toBeTypeOf('function')
  })
})
