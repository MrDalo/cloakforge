// @vitest-environment jsdom
/**
 * useRevokeMetadataAuthority Hook Tests
 *
 * Tests:
 * - Hook initializes with correct default state
 * - Exposes revokeMetadataAuthority, isExecuting, lastResult, reset, isWalletReady, validationErrors
 * - revokeMetadataAuthority is a function
 * - isWalletReady reflects wallet connection state
 * - reset clears state
 * - Validation errors (missing / invalid token address) surface as user-facing failures
 * - Insufficient balance surfaces as a user-facing failure
 * - Happy path calls apiClient with the correct request shape and returns a result
 * - Success toast is shown after a successful execution
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
    estimatedCost: 0.1005,
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
    config: { toolId: 'revoke-metadata-authority', baseFee: 0.1, networkFee: 0.0005 },
    isEnabled: true,
  })),
}))

vi.mock('@/lib/toast/showTransactionToast', () => ({
  showTransactionToast: vi.fn(),
}))

const WALLET_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const TOKEN_ADDRESS = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'

/**
 * A real, unsigned, base64-serialized Transaction (a single-lamport self-transfer, fee
 * payer + recent blockhash both set to WALLET_ADDRESS) so `Transaction.from(...)` inside
 * the hook can successfully deserialize it in the happy-path test. Generated once via
 * `SystemProgram.transfer` + `Transaction.serialize({ requireAllSignatures: false })` in a
 * plain Node script — computed ahead of time because `@solana/buffer-layout`'s Uint8Array
 * checks are incompatible with the jsdom test environment's globals.
 */
const SERIALIZED_TRANSACTION =
  'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAECxvp6877brTo9ZfNqq8l0MbG75MLS9uDkfKYCA0UvXWEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMb6evO+2606PWXzaqvJdDGxu+TC0vbg5HymAgNFL11hAQECAAAMAgAAAAEAAAAAAAAA'

function buildSerializedTransaction(): string {
  return SERIALIZED_TRANSACTION
}

const mockConnection = {
  getBalance: vi.fn().mockResolvedValue(5_000_000_000),
  getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'testblockhash' }),
  sendRawTransaction: vi.fn().mockResolvedValue('revokeMetadataSignature789'),
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

import { useRevokeMetadataAuthority } from '../useRevokeMetadataAuthority'
import { useWallet } from '@solana/wallet-adapter-react'
import { apiClient } from '@/lib/utils/apiClient'
import { validateBalance } from '@/lib/solana/validateBalance'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { toast } from 'sonner'
import { SERIALIZED_LEGACY_TRANSACTION, TEST_FEE_WALLET_ADDRESS, TEST_WALLET_ADDRESS } from './fixtures/preparedTransactionFixtures'
import { AppError } from '@/lib/errors'

describe('useRevokeMetadataAuthority', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useWallet).mockReturnValue({
      connected: true,
      publicKey: { toString: () => WALLET_ADDRESS },
      signTransaction: vi.fn(async (tx: unknown) => ({
        ...(tx as object),
        serialize: () => Buffer.from('serialized'),
      })),
    } as unknown as ReturnType<typeof useWallet>)
    vi.mocked(validateBalance).mockResolvedValue({
      hasSufficientBalance: true,
      currentBalance: 5,
      estimatedCost: 0.1005,
    } as unknown as Awaited<ReturnType<typeof validateBalance>>)
  })

  it('should initializes with correct default state', () => {
    const { result } = renderHook(() => useRevokeMetadataAuthority())

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('should exposes revokeMetadataAuthority as a function', () => {
    const { result } = renderHook(() => useRevokeMetadataAuthority())
    expect(result.current.revokeMetadataAuthority).toBeTypeOf('function')
  })

  it('should exposes reset as a function', () => {
    const { result } = renderHook(() => useRevokeMetadataAuthority())
    expect(result.current.reset).toBeTypeOf('function')
  })

  it('should isWalletReady is true when wallet is connected', () => {
    const { result } = renderHook(() => useRevokeMetadataAuthority())
    expect(result.current.isWalletReady).toBe(true)
  })

  it('should isWalletReady is false when wallet is not connected', () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as unknown as ReturnType<typeof useWallet>)

    const { result } = renderHook(() => useRevokeMetadataAuthority())
    expect(result.current.isWalletReady).toBe(false)
  })

  it('should reset clears lastResult and validationErrors', () => {
    const { result } = renderHook(() => useRevokeMetadataAuthority())

    act(() => {
      result.current.reset()
    })

    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('should revokeMetadataAuthority returns null when wallet not connected', async () => {
    vi.mocked(useWallet).mockReturnValue({
      connected: false,
      publicKey: null,
      signTransaction: undefined,
    } as unknown as ReturnType<typeof useWallet>)

    const { result } = renderHook(() => useRevokeMetadataAuthority())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.revokeMetadataAuthority({ tokenAddress: TOKEN_ADDRESS })
    })

    expect(execResult).toBeNull()
    expect(apiClient).not.toHaveBeenCalled()
  })

  it('should throw an AppError-style validation failure when tokenAddress is missing', async () => {
    const { result } = renderHook(() => useRevokeMetadataAuthority())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.revokeMetadataAuthority({ tokenAddress: '' })
    })

    expect(execResult).toBeNull()
    expect(apiClient).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Token address is required'), expect.any(Object))
  })

  it('should throw an AppError-style validation failure when tokenAddress format is invalid', async () => {
    const { result } = renderHook(() => useRevokeMetadataAuthority())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.revokeMetadataAuthority({ tokenAddress: 'invalid-address' })
    })

    expect(execResult).toBeNull()
    expect(apiClient).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Invalid token address format'), expect.any(Object))
  })

  it('should throw an AppError-style INSUFFICIENT_FUNDS failure when balance is insufficient', async () => {
    vi.mocked(validateBalance).mockResolvedValueOnce({
      hasSufficientBalance: false,
      currentBalance: 0.001,
      estimatedCost: 0.1005,
    } as unknown as Awaited<ReturnType<typeof validateBalance>>)

    const { result } = renderHook(() => useRevokeMetadataAuthority())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.revokeMetadataAuthority({ tokenAddress: TOKEN_ADDRESS })
    })

    expect(execResult).toBeNull()
    expect(apiClient).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Insufficient funds'), expect.any(Object))
  })

  it('should call apiClient with correct request shape and return a result on success', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      serializedTransaction: buildSerializedTransaction(),
      message: 'ok',
    })

    const { result } = renderHook(() => useRevokeMetadataAuthority())

    let execResult: unknown
    await act(async () => {
      execResult = await result.current.revokeMetadataAuthority({ tokenAddress: TOKEN_ADDRESS })
    })

    expect(apiClient).toHaveBeenCalledWith('/api/solana/revoke-metadata-authority', {
      walletAddress: WALLET_ADDRESS,
      tokenAddress: TOKEN_ADDRESS,
      couponCode: undefined,
    })

    expect(mockConnection.sendRawTransaction).toHaveBeenCalled()
    expect(execResult).toMatchObject({
      signature: 'revokeMetadataSignature789',
      tokenAddress: TOKEN_ADDRESS,
      message: `Successfully revoked metadata authority for token: ${TOKEN_ADDRESS}`,
    })
  })

  it('should show a success toast after a successful execution', async () => {
    vi.mocked(apiClient).mockResolvedValueOnce({
      serializedTransaction: buildSerializedTransaction(),
      message: 'ok',
    })

    const { result } = renderHook(() => useRevokeMetadataAuthority())

    await act(async () => {
      await result.current.revokeMetadataAuthority({ tokenAddress: TOKEN_ADDRESS })
    })

    expect(showTransactionToast).toHaveBeenCalledWith(
      'revokeMetadataSignature789',
      `Metadata authority revoked for ${TOKEN_ADDRESS.slice(0, 8)}...`
    )
  })
})

describe('useRevokeMetadataAuthority module exports', () => {
  it('should exports useRevokeMetadataAuthority as a function', async () => {
    const mod = await import('../useRevokeMetadataAuthority')
    expect(mod.useRevokeMetadataAuthority).toBeTypeOf('function')
  })
})

describe('useRevokeMetadataAuthority transaction verification', () => {
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
    const { result } = renderHook(() => useRevokeMetadataAuthority())
    let execResult: unknown
    await act(async () => {
      execResult = await result.current.revokeMetadataAuthority({ tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' })
    })
    return execResult
  }

  it('should verify the prepared transaction against the request before asking the wallet to sign', async () => {
    const execResult = await run()

    expect(execResult).not.toBeNull()
    expect(verification.verifyBeforeSigning).toHaveBeenCalledWith(
      expect.objectContaining({ toolId: 'revoke-metadata-authority', transactions: [expect.anything()] }),
      {
        wallet: TEST_WALLET_ADDRESS,
        feeWallet: TEST_FEE_WALLET_ADDRESS,
        maxServiceFeeLamports: BigInt(100_000_000),
        operation: { kind: 'revoke-metadata-authority', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
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
