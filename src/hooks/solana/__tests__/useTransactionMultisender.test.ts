// @vitest-environment jsdom
/**
 * useTransactionMultisender Hook Tests
 *
 * The server packs recipients by transaction size, so batches are uneven: success accounting must use the
 * per-transaction `recipientCounts` from the API response, never a fixed batch size.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { PublicKey } from '@solana/web3.js'
import type { ToolExecutionContext } from '../useToolBase'
import type { MultisenderParams, MultisenderResult } from '../useTransactionMultisender'

type ExecuteFn = (context: ToolExecutionContext, params: MultisenderParams) => Promise<MultisenderResult>

const mocks = vi.hoisted(() => ({
  captured: { execute: undefined as unknown },
  apiClient: vi.fn(),
  getBalance: vi.fn(),
  sendRawTransaction: vi.fn(),
  confirmTransaction: vi.fn(),
  signTransaction: vi.fn(),
  signAllTransactions: vi.fn(),
  showTransactionToast: vi.fn(),
}))

// jsdom's Uint8Array realm breaks web3.js binary encoding: deserialize into a stand-in that re-serializes as-is
vi.mock('@solana/web3.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@solana/web3.js')>()),
  VersionedTransaction: {
    deserialize: vi.fn((bytes: Uint8Array) => ({ serialize: () => bytes })),
  },
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
}))

vi.mock('sonner', () => ({
  toast: { loading: vi.fn(), success: vi.fn(), error: vi.fn(), warning: vi.fn(), dismiss: vi.fn() },
}))

vi.mock('@/lib/toast/showTransactionToast', () => ({
  showTransactionToast: (...args: unknown[]) => mocks.showTransactionToast(...args),
}))

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: (...args: unknown[]) => mocks.apiClient(...args),
}))

vi.mock('@/stores/discountCouponStore', () => ({
  getAppliedCouponCode: vi.fn(() => undefined),
}))

vi.mock('@/stores/toolConfigStore', () => ({
  useToolConfig: vi.fn(() => ({ config: { toolId: 'transaction-multisender', baseFee: 0.001, networkFee: 0.0005 }, isEnabled: true })),
}))

vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: vi.fn(() => ({
    connection: {
      getBalance: mocks.getBalance,
      sendRawTransaction: mocks.sendRawTransaction,
      confirmTransaction: mocks.confirmTransaction,
    },
  })),
  useWallet: vi.fn(() => ({ signTransaction: mocks.signTransaction, signAllTransactions: mocks.signAllTransactions })),
}))

// Capture the execution function the hook hands to useToolBase, so it can be driven directly
vi.mock('../useToolBase', () => ({
  useToolBase: vi.fn((_config: unknown, executionFn: unknown) => {
    mocks.captured.execute = executionFn
    return { isExecuting: false, lastResult: null, execute: vi.fn(), validationErrors: [], reset: vi.fn() }
  }),
}))

import { useTransactionMultisender } from '../useTransactionMultisender'

const WALLET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
const MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

const CONTEXT: ToolExecutionContext = {
  walletAddress: WALLET.toString(),
  publicKey: WALLET,
  signTransaction: vi.fn(),
  connected: true,
}

// Addresses are not validated client-side (the API is mocked), so placeholders keep the test deterministic
const makeRecipients = (n: number) => Array.from({ length: n }, (_, i) => ({ address: `recipient-${i + 1}`, amount: 1 }))

const apiResponse = (recipientCounts: unknown, transactionCount: number, totalServiceFee = 0.001) => ({
  serializedTransactions: Array.from({ length: transactionCount }, (_, i) => Buffer.from(`tx-${i + 1}`).toString('base64')),
  recipientCounts,
  message: 'ok',
  totalServiceFee,
  estimatedNetworkFee: 0.000005 * transactionCount,
  blockhash: 'blockhash',
  lastValidBlockHeight: 123,
})

const getExecute = (): ExecuteFn => {
  renderHook(() => useTransactionMultisender())
  return mocks.captured.execute as ExecuteFn
}

describe('useTransactionMultisender', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getBalance.mockResolvedValue(10 * 1e9)
    mocks.sendRawTransaction.mockImplementation(async () => `sig-${mocks.sendRawTransaction.mock.calls.length}`)
    mocks.confirmTransaction.mockResolvedValue({ context: { slot: 1 }, value: { err: null } })
    mocks.signTransaction.mockImplementation(async (tx: unknown) => tx)
    mocks.signAllTransactions.mockImplementation(async (txs: unknown[]) => txs)
  })

  it('should count successful recipients from the server recipientCounts, not a fixed batch size', async () => {
    mocks.apiClient.mockResolvedValue(apiResponse([7, 8, 5], 3, 0.02))
    mocks.sendRawTransaction
      .mockResolvedValueOnce('sig-1')
      .mockRejectedValueOnce(new Error('Blockhash not found'))
      .mockResolvedValueOnce('sig-3')

    const result = await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(20) })

    expect(result).toEqual({ signatures: ['sig-1', 'sig-3'], successfulRecipients: 12, failedRecipients: 8 })
    expect(mocks.signAllTransactions).toHaveBeenCalledTimes(1)
    expect(mocks.showTransactionToast).toHaveBeenCalledWith('sig-1', 'Batch 1/3 sent (7 recipients)')
    expect(mocks.showTransactionToast).toHaveBeenCalledWith('sig-3', 'Batch 3/3 sent (5 recipients)')
  })

  it('should count every recipient when all uneven batches confirm', async () => {
    mocks.apiClient.mockResolvedValue(apiResponse([7, 8, 8, 2], 4, 0.025))

    const result = await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(25) })

    expect(result.successfulRecipients).toBe(25)
    expect(result.failedRecipients).toBe(0)
    expect(result.signatures).toHaveLength(4)
  })

  it('should count a batch that lands but fails on-chain as failed', async () => {
    mocks.apiClient.mockResolvedValue(apiResponse([7, 3], 2, 0.01))
    mocks.confirmTransaction
      .mockResolvedValueOnce({ context: { slot: 1 }, value: { err: { InstructionError: [4, 'Custom'] } } })
      .mockResolvedValueOnce({ context: { slot: 1 }, value: { err: null } })

    const result = await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(10) })

    expect(result).toEqual({ signatures: ['sig-2'], successfulRecipients: 3, failedRecipients: 7 })
  })

  it('should sign a single transaction with signTransaction', async () => {
    mocks.apiClient.mockResolvedValue(apiResponse([3], 1, 0.003))

    const result = await getExecute()(CONTEXT, { recipients: makeRecipients(3) })

    expect(mocks.signTransaction).toHaveBeenCalledTimes(1)
    expect(mocks.signAllTransactions).not.toHaveBeenCalled()
    expect(result.successfulRecipients).toBe(3)
  })

  it.each([
    ['missing', undefined],
    ['shorter than the transactions', [10]],
    ['not summing to the recipient count', [7, 7]],
    ['containing an empty batch', [10, 0]],
  ])('should reject recipientCounts %s before asking the wallet to sign', async (_label, recipientCounts) => {
    mocks.apiClient.mockResolvedValue(apiResponse(recipientCounts, 2))

    await expect(getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(10) })).rejects.toMatchObject({
      code: 'TRANSACTION_FAILED',
    })
    expect(mocks.signAllTransactions).not.toHaveBeenCalled()
    expect(mocks.sendRawTransaction).not.toHaveBeenCalled()
  })

  it('should check the balance against the actual transaction count and the server service fee', async () => {
    // 20 recipients in 3 transactions: 0.02 service fee + 3 x 0.0005 network fee = 0.0215 SOL
    mocks.apiClient.mockResolvedValue(apiResponse([7, 8, 5], 3, 0.02))
    mocks.getBalance.mockResolvedValue(0.0214 * 1e9)

    await expect(getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(20) })).rejects.toMatchObject({
      code: 'INSUFFICIENT_FUNDS',
    })
    expect(mocks.getBalance).toHaveBeenCalledWith(new PublicKey(CONTEXT.walletAddress))
    expect(mocks.signAllTransactions).not.toHaveBeenCalled()

    mocks.getBalance.mockResolvedValue(0.0216 * 1e9)
    const result = await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(20) })
    expect(result.successfulRecipients).toBe(20)
  })

  it('should include the SOL amounts in the balance check for SOL sends', async () => {
    // 3 x 1 SOL + 0.003 service fee + 0.0005 network fee
    mocks.apiClient.mockResolvedValue(apiResponse([3], 1, 0.003))
    mocks.getBalance.mockResolvedValue(3.003 * 1e9)

    await expect(getExecute()(CONTEXT, { recipients: makeRecipients(3) })).rejects.toMatchObject({ code: 'INSUFFICIENT_FUNDS' })
  })
})
