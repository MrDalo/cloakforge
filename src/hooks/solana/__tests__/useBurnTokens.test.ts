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
 * - Server coupon errors reach useToolBase unchanged (coupon UI updated); unknown errors are wrapped
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
  isUserRejectionError: vi.fn(() => false),
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

vi.mock('@/lib/utils/apiClient', async (importOriginal) => ({
  ApiRequestError: (await importOriginal<typeof import('@/lib/utils/apiClient')>()).ApiRequestError,
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

import { useBurnTokens, type BurnTokensParams } from '../useBurnTokens'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { ApiRequestError, apiClient } from '@/lib/utils/apiClient'
import { useDiscountCouponStore } from '@/stores/discountCouponStore'
import { COUPON_SERVICE_UNAVAILABLE_MESSAGE, COUPON_UNAVAILABLE_MESSAGE } from '@/lib/utils/discountCouponMessages'

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

  it('should initializes with correct default state', () => {
    const { result } = renderHook(() => useBurnTokens())

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('should exposes burnTokens as a function', () => {
    const { result } = renderHook(() => useBurnTokens())
    expect(result.current.burnTokens).toBeTypeOf('function')
  })

  it('should exposes reset as a function', () => {
    const { result } = renderHook(() => useBurnTokens())
    expect(result.current.reset).toBeTypeOf('function')
  })

  it('should isWalletReady is true when wallet is connected', () => {
    const { result } = renderHook(() => useBurnTokens())
    expect(result.current.isWalletReady).toBe(true)
  })

  it('should isWalletReady is false when wallet is not connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as unknown as ReturnType<typeof useWallet>)

    const { result } = renderHook(() => useBurnTokens())
    expect(result.current.isWalletReady).toBe(false)
  })

  it('should reset clears lastResult and validationErrors', () => {
    const { result } = renderHook(() => useBurnTokens())

    act(() => {
      result.current.reset()
    })

    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('should burnTokens returns null when wallet not connected', async () => {
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

describe('useBurnTokens server errors', () => {
  const SAVE10 = { code: 'SAVE10', discountPercentage: 10 }
  const params: BurnTokensParams = {
    tokenAccountAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: 10,
    mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    tokenSymbol: 'TEST',
  }

  /** Runs a burn whose prepare call (POST /api/solana/burn-tokens) fails with `error`. */
  const burnWithApiError = async (error: Error): Promise<unknown> => {
    vi.mocked(apiClient).mockRejectedValueOnce(error)
    const { result } = renderHook(() => useBurnTokens())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.burnTokens(params)
    })
    return execResult
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      publicKey: { toString: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
      signTransaction: vi.fn(),
    } as unknown as ReturnType<typeof useWallet>)
    useDiscountCouponStore.setState({ appliedCoupon: SAVE10, error: null, isValidating: false })
  })

  it('should pass an unavailable-coupon error through so the coupon is removed and its message shown', async () => {
    const execResult = await burnWithApiError(new ApiRequestError(COUPON_UNAVAILABLE_MESSAGE, 400))

    expect(execResult).toBeNull()
    expect(apiClient).toHaveBeenCalledWith('/api/solana/burn-tokens', expect.objectContaining({ couponCode: 'SAVE10' }))
    expect(toast.error).toHaveBeenCalledWith(`Burn Tokens Failed: ${COUPON_UNAVAILABLE_MESSAGE}`, expect.anything())
    expect(useDiscountCouponStore.getState().appliedCoupon).toBeNull()
    expect(useDiscountCouponStore.getState().error).toBe(COUPON_UNAVAILABLE_MESSAGE)
  })

  it('should pass a temporary coupon-service error through and keep the coupon applied', async () => {
    await burnWithApiError(new ApiRequestError(COUPON_SERVICE_UNAVAILABLE_MESSAGE, 503))

    expect(toast.error).toHaveBeenCalledWith(`Burn Tokens Failed: ${COUPON_SERVICE_UNAVAILABLE_MESSAGE}`, expect.anything())
    expect(useDiscountCouponStore.getState().appliedCoupon).toEqual(SAVE10)
    expect(useDiscountCouponStore.getState().error).toBe(COUPON_SERVICE_UNAVAILABLE_MESSAGE)
  })

  it('should wrap unknown API errors and leave the coupon untouched', async () => {
    await burnWithApiError(new ApiRequestError('Internal server error', 500))

    expect(toast.error).toHaveBeenCalledWith(
      'Burn Tokens Failed: Failed to prepare burn transaction. Internal server error',
      expect.anything()
    )
    expect(useDiscountCouponStore.getState().appliedCoupon).toEqual(SAVE10)
    expect(useDiscountCouponStore.getState().error).toBeNull()
  })
})

describe('useBurnTokens module exports', () => {
  it('should exports useBurnTokens as a function', async () => {
    const mod = await import('../useBurnTokens')
    expect(mod.useBurnTokens).toBeTypeOf('function')
  })
})
