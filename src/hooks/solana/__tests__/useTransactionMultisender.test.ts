// @vitest-environment jsdom
/**
 * useTransactionMultisender Hook Tests
 *
 * - Transactions are verified against the entered recipients and displayed fee BEFORE any wallet
 *   prompt; a verification or simulation failure never reaches signTransaction / signAllTransactions.
 * - The balance check uses the verified costs plus rent for recipient token accounts (WEB3-14).
 * - Recipients are accounted per batch from the verified payment mapping, never a fixed batch size;
 *   only batches that definitely paid nobody are reported as failed (safe to retry), unknown outcomes
 *   are reported as unconfirmed (no double pay).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token'
import { renderHook } from '@testing-library/react'
import { PublicKey, SendTransactionError } from '@solana/web3.js'
import { AppError } from '@/lib/errors'
import type { PreparedTransactionSummary } from '@/lib/solana/client'
import type { ToolExecutionContext } from '../useToolBase'
import type { MultisenderParams, MultisenderResult } from '../useTransactionMultisender'
import { TEST_FEE_WALLET_ADDRESS, TEST_WALLET_ADDRESS } from './fixtures/preparedTransactionFixtures'
import { getMaxServiceFeeLamports } from '@/lib/solana/client/serviceFeeLimit'
import { useToolConfig } from '@/stores/toolConfigStore'
import { getAppliedCoupon } from '@/stores/discountCouponStore'

type ExecuteFn = (context: ToolExecutionContext, params: MultisenderParams) => Promise<MultisenderResult>

const mocks = vi.hoisted(() => ({
  captured: { execute: undefined as unknown },
  apiClient: vi.fn(),
  getBalance: vi.fn(),
  sendRawTransaction: vi.fn(),
  confirmTransaction: vi.fn(),
  getSignatureStatuses: vi.fn(),
  getBlockHeight: vi.fn(),
  isBlockhashValid: vi.fn(),
  signTransaction: vi.fn(),
  signAllTransactions: vi.fn(),
  showTransactionToast: vi.fn(),
  assertPreparedTransactionsMatch: vi.fn(),
  assertPreparedTransactionsSimulate: vi.fn(),
  estimateNewTokenAccountRentLamports: vi.fn(),
  resolveFeeWalletForVerification: vi.fn(),
}))

// jsdom's Uint8Array realm breaks web3.js binary encoding: deserialize into a stand-in that re-serializes
// as-is and carries a distinct 64-byte fee-payer signature (what the wallet would return once signed)
vi.mock('@solana/web3.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@solana/web3.js')>()),
  VersionedTransaction: {
    deserialize: vi.fn((bytes: Uint8Array) => ({
      serialize: () => bytes,
      signatures: [new Uint8Array(64).fill(bytes[bytes.length - 1])],
      // The prepared transactions carry the blockhash in their message
      message: { recentBlockhash: 'blockhash' },
    })),
  },
}))

vi.mock('@/lib/solana/client', () => ({
  assertPreparedTransactionsMatch: (...args: unknown[]) => mocks.assertPreparedTransactionsMatch(...args),
  assertPreparedTransactionsSimulate: (...args: unknown[]) => mocks.assertPreparedTransactionsSimulate(...args),
  estimateNewTokenAccountRentLamports: (...args: unknown[]) => mocks.estimateNewTokenAccountRentLamports(...args),
  resolveFeeWalletForVerification: () => mocks.resolveFeeWalletForVerification(),
  // The real helper: it enforces the absolute fee ceiling, which these tests exercise
  getMaxServiceFeeLamports: (input: Parameters<typeof getMaxServiceFeeLamports>[0]) => getMaxServiceFeeLamports(input),
  formatLamportsAsSol: (lamports: bigint) => `${Number(lamports) / 1e9} SOL`,
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
  getAppliedCoupon: vi.fn(() => null),
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
      getSignatureStatuses: mocks.getSignatureStatuses,
      getBlockHeight: mocks.getBlockHeight,
      isBlockhashValid: mocks.isBlockhashValid,
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

const WALLET = new PublicKey(TEST_WALLET_ADDRESS)
const MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const LAST_VALID_BLOCK_HEIGHT = 123

const CONTEXT: ToolExecutionContext = {
  walletAddress: WALLET.toString(),
  publicKey: WALLET,
  signTransaction: vi.fn(),
  connected: true,
}

// Addresses are not validated by the hook itself (the verifier is mocked), so placeholders keep the test deterministic
const makeRecipients = (n: number, amount = 1) => Array.from({ length: n }, (_, i) => ({ address: `recipient-${i + 1}`, amount }))

const apiResponse = (transactionCount: number) => ({
  // The last byte differs per transaction, so each stand-in gets a distinct signature
  serializedTransactions: Array.from({ length: transactionCount }, (_, i) => Buffer.from([1, 2, i + 1]).toString('base64')),
  message: 'ok',
  blockhash: 'blockhash',
  lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT,
})

/** Verified summary whose transactions pay consecutive recipients, `batchSizes[i]` each. */
const summaryFor = (batchSizes: number[], overrides: Partial<PreparedTransactionSummary> = {}): PreparedTransactionSummary => {
  let next = 0
  return {
    transactionCount: batchSizes.length,
    serviceFeeLamports: BigInt(0),
    paymentLamports: BigInt(0),
    rentLamports: BigInt(0),
    networkFeeLamports: BigInt(0),
    createdTokenAccounts: [],
    paymentIndexesByTransaction: batchSizes.map((size) => Array.from({ length: size }, () => next++)),
    ...overrides,
  }
}

const getExecute = (): ExecuteFn => {
  renderHook(() => useTransactionMultisender())
  return mocks.captured.execute as ExecuteFn
}

const preflightRejection = (): SendTransactionError =>
  new SendTransactionError({ action: 'send', signature: '', transactionMessage: 'Blockhash not found' })

describe('useTransactionMultisender', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveFeeWalletForVerification.mockReturnValue(TEST_FEE_WALLET_ADDRESS)
    mocks.assertPreparedTransactionsSimulate.mockResolvedValue(undefined)
    mocks.estimateNewTokenAccountRentLamports.mockResolvedValue(BigInt(0))
    mocks.getBalance.mockResolvedValue(10 * 1e9)
    mocks.sendRawTransaction.mockResolvedValue('rpc-signature')
    mocks.confirmTransaction.mockResolvedValue({ context: { slot: 1 }, value: { err: null } })
    mocks.getSignatureStatuses.mockResolvedValue({ context: { slot: 1 }, value: [null] })
    mocks.getBlockHeight.mockResolvedValue(LAST_VALID_BLOCK_HEIGHT - 10)
    mocks.isBlockhashValid.mockResolvedValue({ context: { slot: 1 }, value: true })
    mocks.signTransaction.mockImplementation(async (tx: unknown) => tx)
    mocks.signAllTransactions.mockImplementation(async (txs: unknown[]) => txs)
  })

  it('should verify the batches against the entered recipients and the displayed per-recipient fee', async () => {
    const recipients = makeRecipients(20)
    mocks.apiClient.mockResolvedValue(apiResponse(3))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([7, 8, 5]))

    await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients })

    expect(mocks.assertPreparedTransactionsMatch).toHaveBeenCalledWith(
      expect.objectContaining({ toolId: 'transaction-multisender', transactions: expect.any(Array) }),
      {
        wallet: TEST_WALLET_ADDRESS,
        feeWallet: TEST_FEE_WALLET_ADDRESS,
        maxServiceFeeLamports: BigInt(20_000_000),
        operation: {
          kind: 'token-transfers',
          mint: MINT,
          payments: recipients.map((recipient) => ({ recipient: recipient.address, amount: recipient.amount })),
        },
      }
    )
    expect(mocks.assertPreparedTransactionsSimulate.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.signAllTransactions.mock.invocationCallOrder[0]
    )
  })

  it('should send the applied coupon and bound the fee by the discounted per-recipient fee', async () => {
    vi.mocked(getAppliedCoupon).mockReturnValueOnce({ code: 'HALF', discountPercentage: 50 })
    mocks.apiClient.mockResolvedValue(apiResponse(3))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([7, 8, 5]))

    await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(20) })

    expect(mocks.apiClient).toHaveBeenCalledWith('/api/solana/transaction-multisender', expect.objectContaining({ couponCode: 'HALF' }))
    expect(mocks.assertPreparedTransactionsMatch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ maxServiceFeeLamports: BigInt(10_000_000) })
    )
  })

  it('should refuse to run when the served per-recipient fee is above the ceiling, before anything is signed', async () => {
    // A compromised server raising the Contentful baseFee must not raise the displayed fee or the verifier limit
    vi.mocked(useToolConfig).mockReturnValueOnce({
      config: { toolId: 'transaction-multisender', baseFee: 0.05, networkFee: 0.0005 },
      isEnabled: true,
    } as unknown as ReturnType<typeof useToolConfig>)
    mocks.apiClient.mockResolvedValue(apiResponse(1))

    await expect(getExecute()(CONTEXT, { recipients: makeRecipients(3) })).rejects.toMatchObject({
      code: 'TRANSACTION_VERIFICATION_FAILED',
      message: expect.stringContaining('higher than this app allows'),
    })
    expect(mocks.assertPreparedTransactionsMatch).not.toHaveBeenCalled()
    expect(mocks.signAllTransactions).not.toHaveBeenCalled()
    expect(mocks.signTransaction).not.toHaveBeenCalled()
    expect(mocks.sendRawTransaction).not.toHaveBeenCalled()
  })

  it('should expect plain SOL payments when no mint is selected', async () => {
    mocks.apiClient.mockResolvedValue(apiResponse(1))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([3]))

    await getExecute()(CONTEXT, { recipients: makeRecipients(3) })

    expect(mocks.assertPreparedTransactionsMatch.mock.calls[0][1].operation).toEqual({
      kind: 'sol-transfers',
      payments: makeRecipients(3).map((recipient) => ({ recipient: recipient.address, amount: recipient.amount })),
    })
  })

  it.each([
    ['verification', () => mocks.assertPreparedTransactionsMatch.mockRejectedValue(new AppError('TRANSACTION_VERIFICATION_FAILED'))],
    [
      'simulation',
      () => {
        mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([5, 5]))
        mocks.assertPreparedTransactionsSimulate.mockRejectedValue(new AppError('SIMULATION_FAILED'))
      },
    ],
  ])('should not ask the wallet to sign when %s fails', async (_label, arrange) => {
    mocks.apiClient.mockResolvedValue(apiResponse(2))
    arrange()

    await expect(getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(10) })).rejects.toBeInstanceOf(AppError)
    expect(mocks.signAllTransactions).not.toHaveBeenCalled()
    expect(mocks.signTransaction).not.toHaveBeenCalled()
    expect(mocks.sendRawTransaction).not.toHaveBeenCalled()
  })

  it('should refuse before calling the API when the fee wallet cannot be pinned', async () => {
    mocks.resolveFeeWalletForVerification.mockImplementation(() => {
      throw new AppError('TRANSACTION_VERIFICATION_FAILED')
    })

    await expect(getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(2) })).rejects.toMatchObject({
      code: 'TRANSACTION_VERIFICATION_FAILED',
    })
    expect(mocks.apiClient).not.toHaveBeenCalled()
    expect(mocks.signAllTransactions).not.toHaveBeenCalled()
  })

  it('should account recipients per batch from the verified mapping and return the unpaid ones for retry', async () => {
    const recipients = makeRecipients(20)
    mocks.apiClient.mockResolvedValue(apiResponse(3))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([7, 8, 5]))
    mocks.sendRawTransaction.mockResolvedValueOnce('sig').mockRejectedValueOnce(preflightRejection()).mockResolvedValueOnce('sig')

    const result = await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients })

    expect(result.successfulRecipients).toBe(12)
    expect(result.failedRecipients).toEqual(recipients.slice(7, 15))
    expect(result.unconfirmedRecipients).toEqual([])
    expect(result.signatures).toHaveLength(2)
    expect(mocks.signAllTransactions).toHaveBeenCalledTimes(1)
    expect(mocks.showTransactionToast).toHaveBeenCalledWith(result.signatures[0], 'Batch 1/3 sent (7 recipients)')
    expect(mocks.showTransactionToast).toHaveBeenCalledWith(result.signatures[1], 'Batch 3/3 sent (5 recipients)')
  })

  it('should count a batch that lands but fails on-chain as failed', async () => {
    const recipients = makeRecipients(10)
    mocks.apiClient.mockResolvedValue(apiResponse(2))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([7, 3]))
    mocks.confirmTransaction
      .mockResolvedValueOnce({ context: { slot: 1 }, value: { err: { InstructionError: [4, 'Custom'] } } })
      .mockResolvedValueOnce({ context: { slot: 1 }, value: { err: null } })

    const result = await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients })

    expect(result.successfulRecipients).toBe(3)
    expect(result.failedRecipients).toEqual(recipients.slice(0, 7))
  })

  it('should never report a batch with an unknown outcome as failed (no double pay on retry)', async () => {
    const recipients = makeRecipients(6)
    mocks.apiClient.mockResolvedValue(apiResponse(3))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([2, 2, 2]))
    // Every confirmation times out; the status lookup then settles each batch
    mocks.confirmTransaction.mockRejectedValue(new Error('confirmation timed out'))
    mocks.getSignatureStatuses
      .mockResolvedValueOnce({ context: { slot: 1 }, value: [{ confirmationStatus: 'confirmed', err: null }] })
      .mockResolvedValueOnce({ context: { slot: 1 }, value: [null] })
      .mockResolvedValueOnce({ context: { slot: 1 }, value: [null] })
      .mockResolvedValueOnce({ context: { slot: 1 }, value: [null] })
    // Batch 2: the cluster says the blockhash is still valid (it may still land); batch 3: expired, still not landed
    mocks.isBlockhashValid
      .mockResolvedValueOnce({ context: { slot: 1 }, value: true })
      .mockResolvedValueOnce({ context: { slot: 1 }, value: false })

    const result = await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients })

    expect(result.successfulRecipients).toBe(2)
    expect(result.unconfirmedRecipients).toEqual(recipients.slice(2, 4))
    expect(result.failedRecipients).toEqual(recipients.slice(4, 6))
    expect(mocks.isBlockhashValid).toHaveBeenCalledWith('blockhash', { commitment: 'confirmed' })
  })

  it('should not trust a server lastValidBlockHeight of 0 to mark batches as failed', async () => {
    const recipients = makeRecipients(4)
    mocks.apiClient.mockResolvedValue({ ...apiResponse(2), lastValidBlockHeight: 0 })
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([2, 2]))
    mocks.confirmTransaction.mockRejectedValue(new Error('confirmation timed out'))
    // The cluster says the blockhash is still valid and the current height is far above the server's 0
    mocks.getBlockHeight.mockResolvedValue(1_000)

    const result = await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients })

    expect(result.failedRecipients).toEqual([])
    expect(result.unconfirmedRecipients).toEqual(recipients)
    // The implausible server height is replaced by a client-derived one for the confirmation wait
    expect(mocks.confirmTransaction).toHaveBeenCalledWith(expect.objectContaining({ lastValidBlockHeight: 1_150 }), 'confirmed')
  })

  it('should keep a server lastValidBlockHeight only when it is within a blockhash validity window', async () => {
    mocks.apiClient.mockResolvedValue(apiResponse(1))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([1]))

    await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(1) })

    expect(mocks.confirmTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT }),
      'confirmed'
    )
  })

  it('should report a batch as unconfirmed when the blockhash check fails or the batch lands during the re-check', async () => {
    const recipients = makeRecipients(4)
    mocks.apiClient.mockResolvedValue(apiResponse(2))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([2, 2]))
    mocks.confirmTransaction.mockRejectedValue(new Error('confirmation timed out'))
    mocks.getSignatureStatuses
      .mockResolvedValueOnce({ context: { slot: 1 }, value: [null] })
      .mockResolvedValueOnce({ context: { slot: 1 }, value: [null] })
      .mockResolvedValueOnce({ context: { slot: 1 }, value: [{ confirmationStatus: 'confirmed', err: null }] })
    // Batch 1: RPC error; batch 2: expired, but it landed between the checks
    mocks.isBlockhashValid.mockRejectedValueOnce(new Error('rpc unavailable')).mockResolvedValueOnce({ context: { slot: 1 }, value: false })

    const result = await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients })

    expect(result.failedRecipients).toEqual([])
    expect(result.unconfirmedRecipients).toEqual(recipients.slice(0, 2))
    expect(result.successfulRecipients).toBe(2)
  })

  it('should keep the signature and recipients of every unconfirmed batch in the result', async () => {
    const recipients = makeRecipients(6)
    mocks.apiClient.mockResolvedValue(apiResponse(3))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([2, 3, 1]))
    mocks.confirmTransaction
      .mockResolvedValueOnce({ context: { slot: 1 }, value: { err: null } })
      .mockRejectedValueOnce(new Error('confirmation timed out'))
      .mockResolvedValueOnce({ context: { slot: 1 }, value: { err: null } })

    const result = await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients })

    expect(result.signatures).toHaveLength(2)
    expect(result.unconfirmedBatches).toEqual([{ batchNumber: 2, signature: expect.any(String), recipients: recipients.slice(2, 5) }])
    expect(result.signatures).not.toContain(result.unconfirmedBatches[0].signature)
    expect(mocks.showTransactionToast).toHaveBeenCalledTimes(2)
  })

  it('should sign nothing when a transaction does not carry the blockhash the server reported', async () => {
    mocks.apiClient.mockResolvedValue({ ...apiResponse(2), blockhash: 'another-blockhash' })
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([1, 1]))

    await expect(getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(2) })).rejects.toMatchObject({
      code: 'TRANSACTION_VERIFICATION_FAILED',
    })
    expect(mocks.signAllTransactions).not.toHaveBeenCalled()
    expect(mocks.signTransaction).not.toHaveBeenCalled()
    expect(mocks.sendRawTransaction).not.toHaveBeenCalled()
  })

  it('should sign a single transaction with signTransaction', async () => {
    mocks.apiClient.mockResolvedValue(apiResponse(1))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(summaryFor([3]))

    const result = await getExecute()(CONTEXT, { recipients: makeRecipients(3) })

    expect(mocks.signTransaction).toHaveBeenCalledTimes(1)
    expect(mocks.signAllTransactions).not.toHaveBeenCalled()
    expect(result.successfulRecipients).toBe(3)
  })

  it('should include the rent of missing recipient token accounts in the balance check', async () => {
    const createdTokenAccounts = makeRecipients(3).map((recipient, i) => ({
      address: `ata-${i}`,
      owner: recipient.address,
      mint: MINT,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    }))
    mocks.apiClient.mockResolvedValue(apiResponse(1))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(
      summaryFor([3], { serviceFeeLamports: BigInt(3_000_000), networkFeeLamports: BigInt(10_000), createdTokenAccounts })
    )
    mocks.estimateNewTokenAccountRentLamports.mockResolvedValue(BigInt(3 * 2_039_280))
    // Needed: 0.003 fee + 0.00001 network + 0.00611784 rent = 0.00912784 SOL
    mocks.getBalance.mockResolvedValue(9_127_839)

    await expect(getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(3) })).rejects.toMatchObject({
      code: 'INSUFFICIENT_FUNDS',
      message: expect.stringContaining('0.00611784 SOL rent for new recipient token accounts'),
    })
    expect(mocks.estimateNewTokenAccountRentLamports).toHaveBeenCalledWith(expect.anything(), createdTokenAccounts)
    expect(mocks.signTransaction).not.toHaveBeenCalled()

    mocks.getBalance.mockResolvedValue(9_127_840)
    const result = await getExecute()(CONTEXT, { tokenMintAddress: MINT, recipients: makeRecipients(3) })
    expect(result.successfulRecipients).toBe(3)
  })

  it('should include the SOL amounts in the balance check for SOL sends', async () => {
    mocks.apiClient.mockResolvedValue(apiResponse(1))
    mocks.assertPreparedTransactionsMatch.mockResolvedValue(
      summaryFor([3], { paymentLamports: BigInt(3e9), serviceFeeLamports: BigInt(3_000_000), networkFeeLamports: BigInt(10_000) })
    )
    mocks.getBalance.mockResolvedValue(3e9 + 3_000_000)

    await expect(getExecute()(CONTEXT, { recipients: makeRecipients(3) })).rejects.toMatchObject({ code: 'INSUFFICIENT_FUNDS' })
    expect(mocks.getBalance).toHaveBeenCalledWith(new PublicKey(CONTEXT.walletAddress))
    expect(mocks.assertPreparedTransactionsSimulate).not.toHaveBeenCalled()
  })
})
