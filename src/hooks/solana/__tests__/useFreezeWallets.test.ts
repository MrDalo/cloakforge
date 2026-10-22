// @vitest-environment jsdom
/**
 * useFreezeWallets / useUnfreezeWallets Hook Tests
 *
 * - The prepared batches are verified (only the entered wallets' token accounts, at most the displayed
 *   per-wallet fee) before the wallet is asked to sign; a failed check never reaches the wallet.
 * - A multi-transaction batch without signAllTransactions fails before any wallet prompt.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { Keypair, PublicKey } from '@solana/web3.js'
import { AppError } from '@/lib/errors'
import type { ToolExecutionContext } from '../useToolBase'
import { TEST_FEE_WALLET_ADDRESS, TEST_WALLET_ADDRESS } from './fixtures/preparedTransactionFixtures'

const mocks = vi.hoisted(() => ({
  captured: { execute: undefined as unknown },
  apiClient: vi.fn(),
  sendRawTransaction: vi.fn(),
  confirmTransaction: vi.fn(),
  signTransaction: vi.fn(),
  signAllTransactions: vi.fn() as ReturnType<typeof vi.fn> | undefined,
  verifyBeforeSigning: vi.fn(),
}))

// jsdom's Uint8Array realm breaks web3.js binary encoding: deserialize into a stand-in
vi.mock('@solana/web3.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@solana/web3.js')>()),
  VersionedTransaction: { deserialize: vi.fn((bytes: Uint8Array) => ({ serialize: () => bytes })) },
}))

vi.mock('@/lib/solana/client', async () => ({
  getMaxServiceFeeLamports: (await import('./fixtures/serviceFeeLimitMock')).getMaxServiceFeeLamportsMock,
  verifyBeforeSigning: (...args: unknown[]) => mocks.verifyBeforeSigning(...args),
  resolveFeeWalletForVerification: () => '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
}))

vi.mock('@/lib/solana/validateBalance', () => ({
  validateBalance: vi.fn().mockResolvedValue({ hasSufficientBalance: true, currentBalance: 5, estimatedCost: 0.03 }),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
}))

vi.mock('@/lib/toast/showTransactionToast', () => ({ showTransactionToast: vi.fn() }))

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: (...args: unknown[]) => mocks.apiClient(...args),
}))

vi.mock('@/stores/discountCouponStore', () => ({ getAppliedCoupon: vi.fn(() => undefined) }))

vi.mock('@/stores/toolConfigStore', () => ({
  useToolConfig: vi.fn((toolId: string) => ({ config: { toolId, baseFee: 0.01, networkFee: 0.0005 }, isEnabled: true })),
}))

vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: vi.fn(() => ({
    connection: { sendRawTransaction: mocks.sendRawTransaction, confirmTransaction: mocks.confirmTransaction },
  })),
  useWallet: vi.fn(() => ({ signAllTransactions: mocks.signAllTransactions })),
}))

vi.mock('../useToolBase', () => ({
  useToolBase: vi.fn((_config: unknown, executionFn: unknown) => {
    mocks.captured.execute = executionFn
    return { isExecuting: false, lastResult: null, execute: vi.fn(), validationErrors: [], reset: vi.fn() }
  }),
}))

import { useFreezeWallets } from '../useFreezeWallets'
import { useUnfreezeWallets } from '../useUnfreezeWallets'

type ExecuteFn = (context: ToolExecutionContext, params: { walletAddresses: string[]; mintAddress: string }) => Promise<unknown>

const MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const TARGETS = Array.from({ length: 3 }, () => Keypair.generate().publicKey.toBase58())

const context = (): ToolExecutionContext => ({
  walletAddress: TEST_WALLET_ADDRESS,
  publicKey: new PublicKey(TEST_WALLET_ADDRESS),
  signTransaction: mocks.signTransaction,
  connected: true,
})

const apiResponse = (transactionCount: number) => ({
  serializedTransactions: Array.from({ length: transactionCount }, (_, i) => Buffer.from([i + 1]).toString('base64')),
  message: 'ok',
  frozenWallets: TARGETS,
  unfrozenWallets: TARGETS,
  derivedTokenAccounts: [],
  blockhash: 'blockhash',
  lastValidBlockHeight: 10,
})

describe.each([
  ['useFreezeWallets', useFreezeWallets, 'freeze-wallets', 'freeze'],
  ['useUnfreezeWallets', useUnfreezeWallets, 'unfreeze-wallets', 'thaw'],
] as const)('%s transaction verification', (_name, useHook, toolId, kind) => {
  const getExecute = (): ExecuteFn => {
    renderHook(() => useHook())
    return mocks.captured.execute as ExecuteFn
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.signAllTransactions = vi.fn(async (txs: unknown[]) => txs)
    mocks.signTransaction.mockImplementation(async (tx: unknown) => tx)
    mocks.verifyBeforeSigning.mockResolvedValue({})
    mocks.apiClient.mockResolvedValue(apiResponse(1))
    mocks.sendRawTransaction.mockResolvedValue('signature')
    mocks.confirmTransaction.mockResolvedValue({ value: { err: null } })
  })

  it('should verify the batches against the entered wallets and the displayed fee before signing', async () => {
    await getExecute()(context(), { walletAddresses: TARGETS, mintAddress: MINT })

    expect(mocks.verifyBeforeSigning).toHaveBeenCalledWith(expect.objectContaining({ toolId, transactions: [expect.anything()] }), {
      wallet: TEST_WALLET_ADDRESS,
      feeWallet: TEST_FEE_WALLET_ADDRESS,
      maxServiceFeeLamports: BigInt(Math.ceil(0.01 * TARGETS.length * 1e9)),
      operation: { kind, mint: MINT, targetWallets: TARGETS },
    })
    expect(mocks.verifyBeforeSigning.mock.invocationCallOrder[0]).toBeLessThan(mocks.signTransaction.mock.invocationCallOrder[0])
  })

  it('should not ask the wallet to sign when verification fails', async () => {
    mocks.apiClient.mockResolvedValue(apiResponse(2))
    mocks.verifyBeforeSigning.mockRejectedValue(new AppError('TRANSACTION_VERIFICATION_FAILED'))

    await expect(getExecute()(context(), { walletAddresses: TARGETS, mintAddress: MINT })).rejects.toMatchObject({
      code: 'TRANSACTION_VERIFICATION_FAILED',
    })
    expect(mocks.signAllTransactions).not.toHaveBeenCalled()
    expect(mocks.signTransaction).not.toHaveBeenCalled()
    expect(mocks.sendRawTransaction).not.toHaveBeenCalled()
  })

  it('should fail before any wallet prompt when a batch needs signAllTransactions and the wallet lacks it', async () => {
    mocks.signAllTransactions = undefined
    mocks.apiClient.mockResolvedValue(apiResponse(2))

    await expect(getExecute()(context(), { walletAddresses: TARGETS, mintAddress: MINT })).rejects.toMatchObject({
      code: 'WALLET_CONNECTION_FAILED',
    })
    expect(mocks.signTransaction).not.toHaveBeenCalled()
  })
})
