// @vitest-environment jsdom
/**
 * useDonation Hook Tests
 *
 * - The prepared donation is verified (exact amount to the donation wallet, no service fee) before the
 *   wallet is asked to sign; a failed check never reaches signTransaction.
 * - SPL donations are checked with the mint decimals the client reads on-chain.
 * - Without a pinned donation wallet the hook refuses before calling the API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { PublicKey } from '@solana/web3.js'
import { AppError } from '@/lib/errors'
import type { ToolExecutionContext } from '../useToolBase'
import type { DonationParams, DonationResult } from '../useDonation'
import { TEST_FEE_WALLET_ADDRESS, TEST_WALLET_ADDRESS } from './fixtures/preparedTransactionFixtures'

type ExecuteFn = (context: ToolExecutionContext, params: DonationParams) => Promise<DonationResult>

const mocks = vi.hoisted(() => ({
  captured: { execute: undefined as unknown },
  apiClient: vi.fn(),
  sendRawTransaction: vi.fn(),
  confirmTransaction: vi.fn(),
  signTransaction: vi.fn(),
  verifyBeforeSigning: vi.fn(),
  fetchMint: vi.fn(),
  resolveFeeWalletForVerification: vi.fn(),
}))

// jsdom's Uint8Array realm breaks web3.js binary encoding: deserialize into a stand-in
vi.mock('@solana/web3.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@solana/web3.js')>()),
  VersionedTransaction: { deserialize: vi.fn((bytes: Uint8Array) => ({ serialize: () => bytes })) },
}))

vi.mock('@/lib/solana/client', () => ({
  verifyBeforeSigning: (...args: unknown[]) => mocks.verifyBeforeSigning(...args),
  fetchMint: (...args: unknown[]) => mocks.fetchMint(...args),
  resolveFeeWalletForVerification: () => mocks.resolveFeeWalletForVerification(),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
}))

vi.mock('sonner', () => ({
  toast: { loading: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), dismiss: vi.fn() },
}))

vi.mock('@/lib/toast/showTransactionToast', () => ({ showTransactionToast: vi.fn() }))

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: (...args: unknown[]) => mocks.apiClient(...args),
}))

vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: vi.fn(() => ({
    connection: { sendRawTransaction: mocks.sendRawTransaction, confirmTransaction: mocks.confirmTransaction },
  })),
  useWallet: vi.fn(() => ({ signTransaction: mocks.signTransaction })),
}))

vi.mock('../useToolBase', () => ({
  useToolBase: vi.fn((_config: unknown, executionFn: unknown) => {
    mocks.captured.execute = executionFn
    return { isExecuting: false, lastResult: null, execute: vi.fn(), validationErrors: [], reset: vi.fn() }
  }),
}))

import { useDonation } from '../useDonation'

const MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const CONTEXT: ToolExecutionContext = {
  walletAddress: TEST_WALLET_ADDRESS,
  publicKey: new PublicKey(TEST_WALLET_ADDRESS),
  signTransaction: vi.fn(),
  connected: true,
}

const getExecute = (): ExecuteFn => {
  renderHook(() => useDonation())
  return mocks.captured.execute as ExecuteFn
}

describe('useDonation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveFeeWalletForVerification.mockReturnValue(TEST_FEE_WALLET_ADDRESS)
    mocks.verifyBeforeSigning.mockResolvedValue({})
    mocks.fetchMint.mockResolvedValue({ decimals: 6 })
    mocks.apiClient.mockResolvedValue({
      serializedTransaction: Buffer.from([1, 2, 3]).toString('base64'),
      message: 'ok',
      blockhash: 'blockhash',
      lastValidBlockHeight: 10,
    })
    mocks.signTransaction.mockImplementation(async (tx: unknown) => tx)
    mocks.sendRawTransaction.mockResolvedValue('donation-signature')
    mocks.confirmTransaction.mockResolvedValue({ value: { err: null } })
  })

  it('should verify a SOL donation goes to the donation wallet, with no service fee, before signing', async () => {
    const result = await getExecute()(CONTEXT, { amount: 0.25 })

    expect(result).toEqual({ signature: 'donation-signature' })
    expect(mocks.verifyBeforeSigning).toHaveBeenCalledWith(expect.objectContaining({ toolId: 'donation' }), {
      wallet: TEST_WALLET_ADDRESS,
      feeWallet: TEST_FEE_WALLET_ADDRESS,
      maxServiceFeeLamports: BigInt(0),
      operation: { kind: 'sol-transfers', payments: [{ recipient: TEST_FEE_WALLET_ADDRESS, amount: 0.25 }] },
    })
    expect(mocks.verifyBeforeSigning.mock.invocationCallOrder[0]).toBeLessThan(mocks.signTransaction.mock.invocationCallOrder[0])
  })

  it('should check an SPL donation with the mint decimals read by the client', async () => {
    await getExecute()(CONTEXT, { tokenMintAddress: MINT, amount: 3.5 })

    expect(mocks.fetchMint).toHaveBeenCalledWith(expect.anything(), MINT)
    expect(mocks.verifyBeforeSigning.mock.calls[0][1].operation).toEqual({
      kind: 'token-transfers',
      mint: MINT,
      payments: [{ recipient: TEST_FEE_WALLET_ADDRESS, amount: 3.5 }],
      decimals: 6,
    })
  })

  it('should not ask the wallet to sign when the prepared donation fails verification', async () => {
    mocks.verifyBeforeSigning.mockRejectedValue(new AppError('TRANSACTION_VERIFICATION_FAILED'))

    await expect(getExecute()(CONTEXT, { amount: 0.25 })).rejects.toMatchObject({ code: 'TRANSACTION_VERIFICATION_FAILED' })
    expect(mocks.signTransaction).not.toHaveBeenCalled()
    expect(mocks.sendRawTransaction).not.toHaveBeenCalled()
  })

  it('should refuse before calling the API when the donation wallet is not pinned', async () => {
    mocks.resolveFeeWalletForVerification.mockReturnValue(null)

    await expect(getExecute()(CONTEXT, { amount: 0.25 })).rejects.toMatchObject({ code: 'TRANSACTION_VERIFICATION_FAILED' })
    expect(mocks.apiClient).not.toHaveBeenCalled()
    expect(mocks.signTransaction).not.toHaveBeenCalled()
  })
})
