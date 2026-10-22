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

const verification = vi.hoisted(() => ({
  verifyBeforeSigning: vi.fn(),
  feeWallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
}))

// The real verifier decodes transactions with web3.js layouts, which jsdom breaks: it is tested in
// src/lib/solana/client/__tests__; here it is a mock so the tests can show signing depends on it
vi.mock('@/lib/solana/client', async () => ({
  // The real helper: it enforces the absolute fee ceiling, which these tests exercise
  getMaxServiceFeeLamports: (await import('@/lib/solana/client/serviceFeeLimit')).getMaxServiceFeeLamports,
  verifyBeforeSigning: (...args: unknown[]) => verification.verifyBeforeSigning(...args),
  resolveFeeWalletForVerification: () => verification.feeWallet,
}))

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

vi.mock('@/lib/solana', async (importOriginal) => ({
  // Pure helpers (amounts) used by the real service fee limit
  ...(await importOriginal<typeof import('@/lib/solana')>()),
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
import { useToolConfig } from '@/stores/toolConfigStore'
import { useDiscountCouponStore } from '@/stores/discountCouponStore'
import { COUPON_SERVICE_UNAVAILABLE_MESSAGE, COUPON_UNAVAILABLE_MESSAGE } from '@/lib/utils/discountCouponMessages'
import { SERIALIZED_LEGACY_TRANSACTION, TEST_FEE_WALLET_ADDRESS, TEST_WALLET_ADDRESS } from './fixtures/preparedTransactionFixtures'
import { AppError } from '@/lib/errors'

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

describe('useBurnTokens transaction verification', () => {
  let signTransaction: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    useDiscountCouponStore.setState({ appliedCoupon: null, error: null, isValidating: false })
    verification.verifyBeforeSigning.mockResolvedValue({})
    signTransaction = vi.fn(async (tx: unknown) => ({ ...(tx as object), serialize: () => Buffer.from('serialized') }))
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      publicKey: { toString: () => TEST_WALLET_ADDRESS },
      signTransaction,
      signMessage: vi.fn(),
    } as unknown as ReturnType<typeof useWallet>)
    vi.mocked(apiClient).mockResolvedValue({ serializedTransaction: SERIALIZED_LEGACY_TRANSACTION, message: 'ok' })
  })

  const run = async (): Promise<unknown> => {
    const { result } = renderHook(() => useBurnTokens())
    let execResult: unknown
    await act(async () => {
      execResult = await result.current.burnTokens({
        tokenAccountAddress: TEST_WALLET_ADDRESS,
        amount: 10,
        mintAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        decimals: 6,
        tokenSymbol: 'TEST',
      })
    })
    return execResult
  }

  it('should verify the prepared transaction against the request before asking the wallet to sign', async () => {
    const execResult = await run()

    expect(execResult).not.toBeNull()
    expect(verification.verifyBeforeSigning).toHaveBeenCalledWith(
      expect.objectContaining({ toolId: 'burn-tokens', transactions: [expect.anything()] }),
      {
        wallet: TEST_WALLET_ADDRESS,
        feeWallet: TEST_FEE_WALLET_ADDRESS,
        maxServiceFeeLamports: BigInt(10_000_000),
        operation: { kind: 'burn', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', tokenAccount: TEST_WALLET_ADDRESS, amount: 10 },
      }
    )
    expect(verification.verifyBeforeSigning.mock.invocationCallOrder[0]).toBeLessThan(signTransaction.mock.invocationCallOrder[0])
  })

  it('should bound the fee wallet transfer by the discounted fee when a coupon is applied', async () => {
    useDiscountCouponStore.setState({ appliedCoupon: { code: 'HALF50', discountPercentage: 50 } })

    await run()

    const [, expectation] = verification.verifyBeforeSigning.mock.calls[0]
    // 50% off 0.01 SOL is 5_000_000 lamports (rounded up, so at most one lamport of float slack), never the undiscounted 10_000_000
    expect(expectation.maxServiceFeeLamports).toBeGreaterThanOrEqual(BigInt(5_000_000))
    expect(expectation.maxServiceFeeLamports).toBeLessThanOrEqual(BigInt(5_000_001))
    expect(apiClient).toHaveBeenCalledWith('/api/solana/burn-tokens', expect.objectContaining({ couponCode: 'HALF50' }))
  })

  it('should allow no fee wallet transfer for a 100% coupon', async () => {
    useDiscountCouponStore.setState({ appliedCoupon: { code: 'FREE', discountPercentage: 100 } })

    await run()

    expect(verification.verifyBeforeSigning.mock.calls[0][1].maxServiceFeeLamports).toBe(BigInt(0))
  })

  it('should bound the fee wallet transfer by the full fee when no coupon is applied', async () => {
    await run()

    expect(verification.verifyBeforeSigning.mock.calls[0][1].maxServiceFeeLamports).toBe(BigInt(10_000_000))
  })

  it('should refuse to run when the served base fee is above the burn ceiling, before anything is signed', async () => {
    // A compromised server raising the Contentful baseFee must not raise the displayed fee or the verifier limit
    vi.mocked(useToolConfig).mockReturnValue({
      config: { toolId: 'burn-tokens', baseFee: 5, networkFee: 0.0005 },
      isEnabled: true,
    } as unknown as ReturnType<typeof useToolConfig>)

    const execResult = await run()

    expect(execResult).toBeNull()
    expect(verification.verifyBeforeSigning).not.toHaveBeenCalled()
    expect(signTransaction).not.toHaveBeenCalled()
    expect(mockConnection.sendRawTransaction).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('higher than this app allows'), expect.any(Object))

    vi.mocked(useToolConfig).mockReturnValue({
      config: { toolId: 'burn-tokens', baseFee: 0.01, networkFee: 0.0005 },
      isEnabled: true,
    } as unknown as ReturnType<typeof useToolConfig>)
  })

  it('should not ask the wallet to sign when the prepared transaction fails verification', async () => {
    verification.verifyBeforeSigning.mockRejectedValueOnce(
      new AppError('TRANSACTION_VERIFICATION_FAILED', 'The prepared transaction does not match your request')
    )

    const execResult = await run()

    expect(execResult).toBeNull()
    expect(signTransaction).not.toHaveBeenCalled()
    expect(mockConnection.sendRawTransaction).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('does not match your request'), expect.any(Object))
  })
})
