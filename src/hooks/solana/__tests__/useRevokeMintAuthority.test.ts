// @vitest-environment jsdom
/**
 * useRevokeMintAuthority Hook Tests
 *
 * Tests:
 * - Hook initializes with correct default state
 * - Exposes revokeMintAuthority, isExecuting, lastResult, reset, isWalletReady, validationErrors
 * - revokeMintAuthority is a function
 * - isWalletReady reflects wallet connection state
 * - reset clears state
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
vi.mock('@/lib/solana/client', () => ({
  verifyBeforeSigning: (...args: unknown[]) => verification.verifyBeforeSigning(...args),
  resolveFeeWalletForVerification: () => verification.feeWallet,
  solToLamportsCeil: (sol: number) => BigInt(Math.ceil(sol * 1e9)),
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
    config: { toolId: 'revoke-mint-authority', baseFee: 0.01, networkFee: 0.0005 },
    isEnabled: true,
  })),
}))

vi.mock('@/lib/toast/showTransactionToast', () => ({
  showTransactionToast: vi.fn(),
}))

const mockConnection = {
  getBalance: vi.fn().mockResolvedValue(5_000_000_000),
  getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'testblockhash' }),
  sendRawTransaction: vi.fn().mockResolvedValue('revokeSignature456'),
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

import { useRevokeMintAuthority } from '../useRevokeMintAuthority'
import { useWallet } from '@solana/wallet-adapter-react'
import { SERIALIZED_LEGACY_TRANSACTION, TEST_FEE_WALLET_ADDRESS, TEST_WALLET_ADDRESS } from './fixtures/preparedTransactionFixtures'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { toast } from 'sonner'

describe('useRevokeMintAuthority', () => {
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
    const { result } = renderHook(() => useRevokeMintAuthority())

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('should exposes revokeMintAuthority as a function', () => {
    const { result } = renderHook(() => useRevokeMintAuthority())
    expect(result.current.revokeMintAuthority).toBeTypeOf('function')
  })

  it('should exposes reset as a function', () => {
    const { result } = renderHook(() => useRevokeMintAuthority())
    expect(result.current.reset).toBeTypeOf('function')
  })

  it('should isWalletReady is true when wallet is connected', () => {
    const { result } = renderHook(() => useRevokeMintAuthority())
    expect(result.current.isWalletReady).toBe(true)
  })

  it('should isWalletReady is false when wallet is not connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as unknown as ReturnType<typeof useWallet>)

    const { result } = renderHook(() => useRevokeMintAuthority())
    expect(result.current.isWalletReady).toBe(false)
  })

  it('should reset clears lastResult and validationErrors', () => {
    const { result } = renderHook(() => useRevokeMintAuthority())

    act(() => {
      result.current.reset()
    })

    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('should revokeMintAuthority returns null when wallet not connected', async () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as unknown as ReturnType<typeof useWallet>)

    const { result } = renderHook(() => useRevokeMintAuthority())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.revokeMintAuthority({
        tokenAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      })
    })

    expect(execResult).toBeNull()
  })
})

describe('useRevokeMintAuthority module exports', () => {
  it('should exports useRevokeMintAuthority as a function', async () => {
    const mod = await import('../useRevokeMintAuthority')
    expect(mod.useRevokeMintAuthority).toBeTypeOf('function')
  })
})

describe('useRevokeMintAuthority transaction verification', () => {
  let signTransaction: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
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
    const { result } = renderHook(() => useRevokeMintAuthority())
    let execResult: unknown
    await act(async () => {
      execResult = await result.current.revokeMintAuthority({ tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' })
    })
    return execResult
  }

  it('should verify the prepared transaction against the request before asking the wallet to sign', async () => {
    const execResult = await run()

    expect(execResult).not.toBeNull()
    expect(verification.verifyBeforeSigning).toHaveBeenCalledWith(
      expect.objectContaining({ toolId: 'revoke-mint-authority', transactions: [expect.anything()] }),
      {
        wallet: TEST_WALLET_ADDRESS,
        feeWallet: TEST_FEE_WALLET_ADDRESS,
        maxServiceFeeLamports: BigInt(10_000_000),
        operation: { kind: 'revoke-authority', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', authority: 'mint' },
      }
    )
    expect(verification.verifyBeforeSigning.mock.invocationCallOrder[0]).toBeLessThan(signTransaction.mock.invocationCallOrder[0])
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
