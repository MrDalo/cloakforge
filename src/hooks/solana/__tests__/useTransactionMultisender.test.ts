// @vitest-environment jsdom
/**
 * useTransactionMultisender Hook Tests
 *
 * Exercises the full client-side multisender flow on top of the real useToolBase,
 * apiClient/handleApiResponse and Zustand stores. Only the browser boundaries are faked:
 * the wallet adapter (useWallet/useConnection), `fetch` (API route) and toasts.
 *
 * VersionedTransaction is replaced by a lightweight fake: under jsdom, Node's Buffer and the
 * jsdom global Uint8Array live in different realms, so web3.js cannot (de)serialize real
 * transactions here. The fake keeps identity (server payload -> wallet signature -> broadcast
 * bytes) so every step can be asserted. Real wire-format round-tripping is covered by the
 * API route tests (node environment).
 *
 * Tests:
 * - Wallet connection gating (no RPC/API/signing when the wallet is not ready)
 * - API request contract (endpoint, body, coupon) and API error handling
 * - SOL balance validation from the server's exact fee figures (SOL vs SPL, boundaries)
 * - Signing: one wallet approval for all batches, sequential fallback, rejection
 * - Sending & confirming (parallel send, partial batch failures, batch-exact accounting)
 * - Coupon redemption, execution state and reset
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { Keypair, PublicKey, VersionedTransaction } from '@solana/web3.js'
import { type WalletContextState, useWallet, useConnection } from '@solana/wallet-adapter-react'
import type { MultisenderBatch, UnsignedMultisenderResponse } from '@/types/api'

vi.mock('@solana/web3.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/web3.js')>()

  /** Fake v0 transaction: the "wire format" is simply `<payload>` or `<payload>|signed`. */
  class FakeVersionedTransaction {
    constructor(
      readonly payload: string,
      readonly signed = false
    ) {}

    static deserialize(bytes: Uint8Array): FakeVersionedTransaction {
      const [payload, signed] = Buffer.from(bytes).toString('utf8').split('|')
      return new FakeVersionedTransaction(payload, signed === 'signed')
    }

    serialize(): Buffer {
      return Buffer.from(this.signed ? `${this.payload}|signed` : this.payload, 'utf8')
    }
  }

  return { ...actual, VersionedTransaction: FakeVersionedTransaction }
})

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock('@/lib/toast/showTransactionToast', () => ({
  showTransactionToast: vi.fn(),
}))

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(),
  useConnection: vi.fn(),
}))

import { toast } from 'sonner'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { useDiscountCouponStore } from '@/stores/discountCouponStore'
import { useTransactionMultisender, type MultisenderParams, type MultisenderResult } from '../useTransactionMultisender'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const WALLET = Keypair.generate().publicKey
const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const BLOCKHASH = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N'
const LAST_VALID_BLOCK_HEIGHT = 987654
const MULTISENDER_ENDPOINT = '/api/solana/transaction-multisender'
const REDEEM_ENDPOINT = '/api/discount-coupon/redeem'
const LAMPORTS = 1_000_000_000

const makeRecipients = (n: number, amount = 1) =>
  Array.from({ length: n }, () => ({ address: Keypair.generate().publicKey.toString(), amount }))

const solParams = (n: number, amount = 1): MultisenderParams => ({ recipients: makeRecipients(n, amount), decimals: 9 })
const splParams = (n: number, amount = 1): MultisenderParams => ({
  tokenMintAddress: MINT,
  recipients: makeRecipients(n, amount),
  decimals: 6,
})

interface FakeTx {
  payload: string
  signed: boolean
  serialize(): Buffer
}

/** Base64 "unsigned transaction" as returned by the API route (see FakeVersionedTransaction). */
const serverTransaction = (index: number): string => Buffer.from(`server-tx-${index}`, 'utf8').toString('base64')

/** Batch layout as the server reports it: one transaction per entry, `recipientCount` recipients each. */
const batchesOf = (sizes: number[]): MultisenderBatch[] => {
  let startIndex = 0
  return sizes.map((recipientCount) => {
    const batch = { startIndex, recipientCount, sizeBytes: 400 + recipientCount * 49 }
    startIndex += recipientCount
    return batch
  })
}

const serverPayload = (batchSizes: number[], overrides: Partial<UnsignedMultisenderResponse> = {}): UnsignedMultisenderResponse => ({
  serializedTransactions: batchSizes.map((_, i) => serverTransaction(i + 1)),
  batches: batchesOf(batchSizes),
  decimals: 6,
  message: 'Multisender prepared',
  totalServiceFee: 0.001 * batchSizes.reduce((a, b) => a + b, 0),
  estimatedNetworkFee: 0.00001 * batchSizes.length,
  blockhash: BLOCKHASH,
  lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT,
  ...overrides,
})

const successEnvelope = (data: unknown) => ({ status: 'success', status_code: 200, error_message: '', data })
const errorEnvelope = (status: number, message: string) => ({ status: 'error', status_code: status, error_message: message, data: null })

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response

// ---------------------------------------------------------------------------
// Wallet / connection / fetch fakes
// ---------------------------------------------------------------------------

/** Simulates a wallet signature, returning a new (signed) instance like real wallet adapters do. */
const FakeVersionedTransaction = VersionedTransaction as unknown as new (payload: string, signed?: boolean) => FakeTx
const fakeSign = (tx: FakeTx): FakeTx => new FakeVersionedTransaction(tx.payload, true)

let signTransaction: ReturnType<typeof vi.fn>
let signAllTransactions: ReturnType<typeof vi.fn>
let connection: {
  getBalance: ReturnType<typeof vi.fn>
  sendRawTransaction: ReturnType<typeof vi.fn>
  confirmTransaction: ReturnType<typeof vi.fn>
}
let fetchMock: ReturnType<typeof vi.fn>
let multisenderResponse: () => Response

const respondWith = (payload: UnsignedMultisenderResponse) => {
  multisenderResponse = () => jsonResponse(successEnvelope(payload))
}

const mockConnectedWallet = (overrides: Partial<WalletContextState> = {}) =>
  vi.mocked(useWallet).mockReturnValue({
    connected: true,
    publicKey: WALLET,
    signTransaction,
    signAllTransactions,
    signMessage: undefined,
    ...overrides,
  } as unknown as WalletContextState)

const mockDisconnectedWallet = () =>
  vi.mocked(useWallet).mockReturnValue({
    connected: false,
    publicKey: null,
    signTransaction: undefined,
    signAllTransactions: undefined,
  } as unknown as WalletContextState)

const multisenderCalls = () => fetchMock.mock.calls.filter(([url]) => url === MULTISENDER_ENDPOINT)
const requestBody = (callIndex = 0) => JSON.parse(multisenderCalls()[callIndex][1].body as string)
const broadcastPayloads = () => connection.sendRawTransaction.mock.calls.map(([bytes]) => Buffer.from(bytes).toString('utf8'))

/** Runs execute inside act() and returns its resolved value. */
const run = async (result: { current: ReturnType<typeof useTransactionMultisender> }, params: MultisenderParams) => {
  let value: MultisenderResult | null = null
  await act(async () => {
    value = await result.current.execute(params)
  })
  return value as MultisenderResult | null
}

const errorToastMessages = () => vi.mocked(toast.error).mock.calls.map(([message]) => String(message))

beforeEach(() => {
  vi.clearAllMocks()

  signTransaction = vi.fn(async (tx: FakeTx) => fakeSign(tx))
  signAllTransactions = vi.fn(async (txs: FakeTx[]) => txs.map(fakeSign))
  mockConnectedWallet()

  let sigCounter = 0
  connection = {
    getBalance: vi.fn().mockResolvedValue(100 * LAMPORTS),
    sendRawTransaction: vi.fn(async () => `signature-${++sigCounter}`),
    confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
  }
  vi.mocked(useConnection).mockReturnValue({ connection } as unknown as ReturnType<typeof useConnection>)

  respondWith(serverPayload([1]))
  fetchMock = vi.fn(async (url: string) => {
    if (url === MULTISENDER_ENDPOINT) return multisenderResponse()
    if (url === REDEEM_ENDPOINT) return jsonResponse(successEnvelope({ code: 'SAVE10', remainingUsage: 4 }))
    throw new Error(`Unexpected fetch to ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)

  // Real store, reset to a known state
  useDiscountCouponStore.setState({ appliedCoupon: null, isValidating: false, error: null })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('useTransactionMultisender — initial state', () => {
  it('should expose the tool base API', () => {
    const { result } = renderHook(() => useTransactionMultisender())

    expect(result.current.execute).toBeTypeOf('function')
    expect(result.current.reset).toBeTypeOf('function')
    expect(result.current.isExecuting).toBe(false)
    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })

  it('should report isWalletReady = true when the wallet is connected and can sign', () => {
    const { result } = renderHook(() => useTransactionMultisender())
    expect(result.current.isWalletReady).toBe(true)
  })

  it('should report isWalletReady = false when the wallet is disconnected', () => {
    mockDisconnectedWallet()
    const { result } = renderHook(() => useTransactionMultisender())
    expect(result.current.isWalletReady).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Wallet connection gating
// ---------------------------------------------------------------------------

describe('useTransactionMultisender — wallet connection gating', () => {
  it('should return null without touching RPC, API or wallet when disconnected', async () => {
    mockDisconnectedWallet()
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(2))

    expect(value).toBeNull()
    expect(connection.getBalance).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(connection.sendRawTransaction).not.toHaveBeenCalled()
  })

  it('should show a wallet connection toast listing the unmet requirements', async () => {
    mockDisconnectedWallet()
    const { result } = renderHook(() => useTransactionMultisender())

    await run(result, solParams(1))

    expect(toast.error).toHaveBeenCalledWith(
      'Wallet Connection Required: Transaction Multisender requirements not met: Wallet not connected, No wallet public key available, Wallet signing not available',
      { id: 'transaction-multisender-validation' }
    )
    expect(result.current.validationErrors).toEqual([
      'Wallet not connected',
      'No wallet public key available',
      'Wallet signing not available',
    ])
  })

  it('should block a connected wallet that cannot sign transactions', async () => {
    mockConnectedWallet({ signTransaction: undefined })
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(1))

    expect(value).toBeNull()
    expect(result.current.validationErrors).toEqual(['Wallet signing not available'])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('should reject an empty recipient list before calling the API', async () => {
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, { recipients: [] })

    expect(value).toBeNull()
    expect(errorToastMessages()).toContain('Transaction Multisender Failed: At least one recipient is required')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// API request
// ---------------------------------------------------------------------------

describe('useTransactionMultisender — API request', () => {
  it('should POST the wallet, token, recipients and decimals hint to the multisender API route', async () => {
    const params = splParams(3, 2.5)
    const { result } = renderHook(() => useTransactionMultisender())

    await run(result, params)

    expect(multisenderCalls()).toHaveLength(1)
    const [url, init] = multisenderCalls()[0]
    expect(url).toBe(MULTISENDER_ENDPOINT)
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' })
    expect(requestBody()).toEqual({
      walletAddress: WALLET.toBase58(),
      tokenMintAddress: MINT,
      recipients: params.recipients,
      decimals: 6,
    })
  })

  it('should omit tokenMintAddress for native SOL sends', async () => {
    const { result } = renderHook(() => useTransactionMultisender())
    await run(result, solParams(1))

    expect(requestBody()).not.toHaveProperty('tokenMintAddress')
    expect(requestBody().decimals).toBe(9)
  })

  it('should omit the decimals hint when the caller does not know it', async () => {
    const { result } = renderHook(() => useTransactionMultisender())
    await run(result, { tokenMintAddress: MINT, recipients: makeRecipients(1) })

    expect(requestBody()).not.toHaveProperty('decimals')
  })

  it('should include the applied discount coupon code', async () => {
    useDiscountCouponStore.setState({ appliedCoupon: { code: 'SAVE10', discountPercentage: 10 } })
    const { result } = renderHook(() => useTransactionMultisender())

    await run(result, solParams(1))

    expect(requestBody().couponCode).toBe('SAVE10')
  })

  it('should show a preparing toast and always dismiss the progress toast', async () => {
    const { result } = renderHook(() => useTransactionMultisender())
    await run(result, solParams(1))

    expect(toast.loading).toHaveBeenCalledWith('Preparing transactions...', { id: 'multisender-progress' })
    expect(toast.dismiss).toHaveBeenCalledWith('multisender-progress')
  })

  it('should surface the server error message and skip balance check and signing when the API rejects the request', async () => {
    multisenderResponse = () => jsonResponse(errorEnvelope(400, 'Token mint not found'), 400)
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, splParams(2))

    expect(value).toBeNull()
    expect(errorToastMessages()).toContain('Transaction Multisender Failed: Token mint not found')
    expect(connection.getBalance).not.toHaveBeenCalled()
    expect(signTransaction).not.toHaveBeenCalled()
    expect(signAllTransactions).not.toHaveBeenCalled()
    expect(toast.dismiss).toHaveBeenCalledWith('multisender-progress')
  })

  it('should fall back to the HTTP status when the API error body is not JSON', async () => {
    multisenderResponse = () =>
      ({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError('Unexpected token <')
        },
      }) as unknown as Response
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(1))

    expect(value).toBeNull()
    expect(errorToastMessages()).toContain('Transaction Multisender Failed: API request failed with status 502')
  })

  it('should fail when the server returns no transactions', async () => {
    respondWith(serverPayload([], { serializedTransactions: [], batches: [] }))
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(1))

    expect(value).toBeNull()
    expect(errorToastMessages()).toContain('Transaction Multisender Failed: No transactions returned from server')
    expect(signTransaction).not.toHaveBeenCalled()
    expect(connection.sendRawTransaction).not.toHaveBeenCalled()
  })

  it('should fail when the batch metadata does not match the transactions', async () => {
    respondWith(serverPayload([1], { batches: [] }))
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(1))

    expect(value).toBeNull()
    expect(errorToastMessages()).toContain('Transaction Multisender Failed: No transactions returned from server')
    expect(signTransaction).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Balance validation (uses the server's exact fee figures)
// ---------------------------------------------------------------------------

describe('useTransactionMultisender — SOL balance validation', () => {
  it('should check the balance of the connected wallet after the transactions are prepared', async () => {
    const { result } = renderHook(() => useTransactionMultisender())
    await run(result, solParams(1))

    expect(connection.getBalance).toHaveBeenCalledTimes(1)
    const [pubkey] = connection.getBalance.mock.calls[0]
    expect(pubkey).toBeInstanceOf(PublicKey)
    expect(pubkey.equals(WALLET)).toBe(true)
    expect(fetchMock.mock.invocationCallOrder[0]).toBeLessThan(connection.getBalance.mock.invocationCallOrder[0])
  })

  it('should require the server fees plus the SOL being sent for native SOL sends', async () => {
    // 3 * 0.5 SOL + 0.003 service fee + 0.00001 network fee = 1.50301 SOL
    respondWith(serverPayload([3], { totalServiceFee: 0.003, estimatedNetworkFee: 0.00001 }))
    connection.getBalance.mockResolvedValue(1_503_009_999)
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(3, 0.5))

    expect(value).toBeNull()
    expect(errorToastMessages()).toContain('Transaction Multisender Failed: Insufficient SOL balance. Need approx 1.5030 SOL')
    expect(signTransaction).not.toHaveBeenCalled()
    expect(connection.sendRawTransaction).not.toHaveBeenCalled()
  })

  it('should proceed when the balance exactly covers a native SOL send', async () => {
    respondWith(serverPayload([3], { totalServiceFee: 0.003, estimatedNetworkFee: 0.00001 }))
    connection.getBalance.mockResolvedValue(1_503_010_000)
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(3, 0.5))

    expect(value).not.toBeNull()
    expect(connection.sendRawTransaction).toHaveBeenCalledTimes(1)
  })

  it('should only require the fees (not the token amount) in SOL for SPL sends', async () => {
    // 0.003 service fee + 0.00001 network fee = 0.00301 SOL, regardless of 1000 tokens each
    respondWith(serverPayload([3], { totalServiceFee: 0.003, estimatedNetworkFee: 0.00001 }))
    connection.getBalance.mockResolvedValue(3_010_000)
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, splParams(3, 1000))

    expect(value).not.toBeNull()
  })

  it('should reject an SPL send when SOL does not cover the fees', async () => {
    respondWith(serverPayload([3], { totalServiceFee: 0.003, estimatedNetworkFee: 0.00001 }))
    connection.getBalance.mockResolvedValue(3_009_999)
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, splParams(3, 1000))

    expect(value).toBeNull()
    expect(errorToastMessages()).toContain('Transaction Multisender Failed: Insufficient SOL balance. Need approx 0.0030 SOL')
  })

  it('should use the discounted service fee reported by the server', async () => {
    // Server already applied the coupon: 0.0015 instead of 0.003
    respondWith(serverPayload([3], { totalServiceFee: 0.0015, estimatedNetworkFee: 0.00001 }))
    connection.getBalance.mockResolvedValue(1_510_000)
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, splParams(3))

    expect(value).not.toBeNull()
  })

  it('should fail gracefully when the balance lookup fails', async () => {
    connection.getBalance.mockRejectedValue(new Error('fetch failed'))
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(1))

    expect(value).toBeNull()
    expect(signTransaction).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/^Transaction Multisender Failed: /), {
      id: 'transaction-multisender-error',
    })
  })
})

// ---------------------------------------------------------------------------
// Transaction signing — one wallet approval
// ---------------------------------------------------------------------------

describe('useTransactionMultisender — transaction signing', () => {
  it('should sign a single transaction with signTransaction', async () => {
    const { result } = renderHook(() => useTransactionMultisender())
    await run(result, solParams(3))

    expect(signTransaction).toHaveBeenCalledTimes(1)
    expect(signAllTransactions).not.toHaveBeenCalled()

    // The wallet is asked to sign the deserialized, still unsigned server transaction
    const [tx] = signTransaction.mock.calls[0]
    expect(tx).toBeInstanceOf(VersionedTransaction)
    expect(tx).toMatchObject({ payload: 'server-tx-1', signed: false })
    expect(toast.loading).toHaveBeenCalledWith('Approve the transaction in your wallet...', { id: 'multisender-progress' })
  })

  it('should sign multiple batches with a single signAllTransactions approval, in server order', async () => {
    const payload = serverPayload([18, 18, 14])
    respondWith(payload)
    const { result } = renderHook(() => useTransactionMultisender())

    await run(result, solParams(50))

    expect(signAllTransactions).toHaveBeenCalledTimes(1)
    expect(signTransaction).not.toHaveBeenCalled()

    const [txs] = signAllTransactions.mock.calls[0]
    expect(txs).toHaveLength(3)
    txs.forEach((tx: FakeTx, i: number) => {
      expect(tx).toBeInstanceOf(VersionedTransaction)
      expect(tx.signed).toBe(false)
      expect(Buffer.from(tx.serialize()).toString('base64')).toBe(payload.serializedTransactions[i])
    })
    expect(toast.loading).toHaveBeenCalledWith('Approve 3 transactions in your wallet...', { id: 'multisender-progress' })
  })

  it('should fall back to signing each batch in turn when the wallet cannot sign all at once', async () => {
    mockConnectedWallet({ signAllTransactions: undefined })
    respondWith(serverPayload([18, 7]))
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(25))

    expect(value).not.toBeNull()
    expect(signTransaction).toHaveBeenCalledTimes(2)
    expect(signTransaction.mock.calls.map(([tx]) => tx.payload)).toEqual(['server-tx-1', 'server-tx-2'])
    expect(toast.info).toHaveBeenCalledWith('Your wallet cannot sign batches at once — please approve 2 transactions in turn.')
    expect(broadcastPayloads()).toEqual(['server-tx-1|signed', 'server-tx-2|signed'])
  })

  it('should abort without sending anything when the user rejects the signature request', async () => {
    signTransaction.mockRejectedValueOnce(new Error('User rejected the request.'))
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(1))

    expect(value).toBeNull()
    expect(connection.sendRawTransaction).not.toHaveBeenCalled()
    expect(result.current.lastResult).toBeNull()
    expect(errorToastMessages().some((m) => m.startsWith('Transaction Multisender Failed: '))).toBe(true)
    expect(toast.dismiss).toHaveBeenCalledWith('multisender-progress')
  })

  it('should abort all batches when the user rejects the batch approval', async () => {
    signAllTransactions.mockRejectedValueOnce(new Error('User rejected the request.'))
    respondWith(serverPayload([18, 7]))
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(25))

    expect(value).toBeNull()
    expect(connection.sendRawTransaction).not.toHaveBeenCalled()
  })

  it('should not broadcast any batch when the user rejects midway through the sequential fallback', async () => {
    mockConnectedWallet({ signAllTransactions: undefined })
    signTransaction
      .mockImplementationOnce(async (tx: FakeTx) => fakeSign(tx))
      .mockRejectedValueOnce(new Error('User rejected the request.'))
    respondWith(serverPayload([18, 7]))
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(25))

    expect(value).toBeNull()
    expect(connection.sendRawTransaction).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Sending & confirming
// ---------------------------------------------------------------------------

describe('useTransactionMultisender — sending and confirming', () => {
  it('should broadcast the wallet-signed bytes with preflight enabled', async () => {
    const { result } = renderHook(() => useTransactionMultisender())
    await run(result, solParams(1))

    expect(connection.sendRawTransaction).toHaveBeenCalledTimes(1)
    const [bytes, options] = connection.sendRawTransaction.mock.calls[0]
    // The broadcast bytes must come from the wallet-signed transaction, not the unsigned server one
    expect(Buffer.from(bytes).toString('utf8')).toBe('server-tx-1|signed')
    expect(options).toEqual({ skipPreflight: false, preflightCommitment: 'confirmed' })
  })

  it('should broadcast every signed batch in server order', async () => {
    respondWith(serverPayload([18, 18, 14]))
    const { result } = renderHook(() => useTransactionMultisender())

    await run(result, solParams(50))

    expect(broadcastPayloads()).toEqual(['server-tx-1|signed', 'server-tx-2|signed', 'server-tx-3|signed'])
  })

  it('should confirm each signature against the server blockhash expiry window', async () => {
    respondWith(serverPayload([18, 7]))
    const { result } = renderHook(() => useTransactionMultisender())

    await run(result, solParams(25))

    expect(connection.confirmTransaction).toHaveBeenCalledTimes(2)
    expect(connection.confirmTransaction).toHaveBeenCalledWith(
      { signature: 'signature-1', blockhash: BLOCKHASH, lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT },
      'confirmed'
    )
    expect(connection.confirmTransaction).toHaveBeenCalledWith(
      { signature: 'signature-2', blockhash: BLOCKHASH, lastValidBlockHeight: LAST_VALID_BLOCK_HEIGHT },
      'confirmed'
    )
  })

  it('should broadcast all batches in parallel before any confirmation resolves', async () => {
    respondWith(serverPayload([18, 18, 14]))
    const pendingConfirmations: (() => void)[] = []
    connection.confirmTransaction.mockImplementation(
      () => new Promise((resolve) => pendingConfirmations.push(() => resolve({ value: { err: null } })))
    )
    const { result } = renderHook(() => useTransactionMultisender())

    let promise: Promise<MultisenderResult | null> = Promise.resolve(null)
    act(() => {
      promise = result.current.execute(solParams(50))
    })

    await waitFor(() => expect(pendingConfirmations).toHaveLength(3))
    expect(connection.sendRawTransaction).toHaveBeenCalledTimes(3)

    await act(async () => {
      pendingConfirmations.forEach((resolve) => resolve())
      await promise
    })
    expect(result.current.lastResult?.signatures).toHaveLength(3)
  })

  it('should return all signatures and count every recipient as successful', async () => {
    respondWith(serverPayload([18, 18, 14]))
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(50))

    expect(value).toEqual({
      signatures: ['signature-1', 'signature-2', 'signature-3'],
      transactionCount: 3,
      successfulRecipients: 50,
      failedRecipients: 0,
      failedRecipientList: [],
    })
    expect(result.current.lastResult).toEqual(value)
  })

  it('should show an explorer toast for every confirmed batch', async () => {
    respondWith(serverPayload([18, 7]))
    const { result } = renderHook(() => useTransactionMultisender())

    await run(result, solParams(25))

    expect(showTransactionToast).toHaveBeenCalledTimes(2)
    expect(showTransactionToast).toHaveBeenCalledWith('signature-1', 'Batch 1/2 sent')
    expect(showTransactionToast).toHaveBeenCalledWith('signature-2', 'Batch 2/2 sent')
    expect(toast.loading).toHaveBeenCalledWith('Sending 2 transaction(s)...', { id: 'multisender-progress' })
  })

  it('should keep successful batches and list the recipients of a middle batch that failed to send', async () => {
    const params = solParams(50)
    respondWith(serverPayload([18, 18, 14]))
    connection.sendRawTransaction
      .mockResolvedValueOnce('signature-1')
      .mockRejectedValueOnce(new Error('Transaction simulation failed'))
      .mockResolvedValueOnce('signature-3')
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, params)

    // Batch 2 carried recipients 18..35 (18 of them) — exactly those are reported back
    expect(value).toEqual({
      signatures: ['signature-1', 'signature-3'],
      transactionCount: 3,
      successfulRecipients: 32,
      failedRecipients: 18,
      failedRecipientList: params.recipients.slice(18, 36),
    })
    expect(toast.error).toHaveBeenCalledWith('Batch 2 failed.')
    expect(showTransactionToast).toHaveBeenCalledTimes(2)
  })

  it('should count only the recipients of the last (partial) batch when it fails', async () => {
    const params = solParams(50)
    respondWith(serverPayload([18, 18, 14]))
    connection.sendRawTransaction
      .mockResolvedValueOnce('signature-1')
      .mockResolvedValueOnce('signature-2')
      .mockRejectedValueOnce(new Error('Blockhash not found'))
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, params)

    expect(value).toMatchObject({ signatures: ['signature-1', 'signature-2'], successfulRecipients: 36, failedRecipients: 14 })
    expect(value?.failedRecipientList).toEqual(params.recipients.slice(36))
    expect(toast.error).toHaveBeenCalledWith('Batch 3 failed.')
  })

  it('should rely on the server batch layout rather than a fixed batch size', async () => {
    const params = splParams(20)
    // SPL batches are smaller (8 per transaction)
    respondWith(serverPayload([8, 8, 4]))
    connection.sendRawTransaction
      .mockRejectedValueOnce(new Error('Transaction simulation failed'))
      .mockResolvedValueOnce('signature-2')
      .mockResolvedValueOnce('signature-3')
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, params)

    expect(value).toMatchObject({ successfulRecipients: 12, failedRecipients: 8 })
    expect(value?.failedRecipientList).toEqual(params.recipients.slice(0, 8))
  })

  it('should treat a batch whose confirmation fails as failed', async () => {
    respondWith(serverPayload([18, 7]))
    connection.confirmTransaction.mockRejectedValueOnce(new Error('block height exceeded')).mockResolvedValueOnce({ value: { err: null } })
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, solParams(25))

    expect(value).toMatchObject({ signatures: ['signature-2'], successfulRecipients: 7, failedRecipients: 18 })
    expect(toast.error).toHaveBeenCalledWith('Batch 1 failed.')
  })

  it('should report every recipient as failed (without throwing) when all batches fail', async () => {
    const params = solParams(4)
    respondWith(serverPayload([4]))
    connection.sendRawTransaction.mockRejectedValue(new Error('Transaction simulation failed'))
    const { result } = renderHook(() => useTransactionMultisender())

    const value = await run(result, params)

    expect(value).toEqual({
      signatures: [],
      transactionCount: 1,
      successfulRecipients: 0,
      failedRecipients: 4,
      failedRecipientList: params.recipients,
    })
    expect(showTransactionToast).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Batch 1 failed.')
  })
})

// ---------------------------------------------------------------------------
// Coupon redemption
// ---------------------------------------------------------------------------

describe('useTransactionMultisender — coupon redemption', () => {
  it('should redeem the applied coupon with the first batch signature after a successful send', async () => {
    useDiscountCouponStore.setState({ appliedCoupon: { code: 'SAVE10', discountPercentage: 10 } })
    respondWith(serverPayload([18, 7]))
    const { result } = renderHook(() => useTransactionMultisender())

    await run(result, solParams(25))

    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => url === REDEEM_ENDPOINT)).toBe(true))
    const [, init] = fetchMock.mock.calls.find(([url]) => url === REDEEM_ENDPOINT)!
    expect(JSON.parse(init.body)).toEqual({ couponCode: 'SAVE10', txSignature: 'signature-1' })
    expect(useDiscountCouponStore.getState().appliedCoupon).toBeNull()
  })

  it('should keep the coupon applied when the send fails before any transaction lands', async () => {
    useDiscountCouponStore.setState({ appliedCoupon: { code: 'SAVE10', discountPercentage: 10 } })
    multisenderResponse = () => jsonResponse(errorEnvelope(500, 'Failed to prepare multisender transaction'), 500)
    const { result } = renderHook(() => useTransactionMultisender())

    await run(result, solParams(1))

    expect(fetchMock.mock.calls.some(([url]) => url === REDEEM_ENDPOINT)).toBe(false)
    expect(useDiscountCouponStore.getState().appliedCoupon).toEqual({ code: 'SAVE10', discountPercentage: 10 })
  })
})

// ---------------------------------------------------------------------------
// Execution state & reset
// ---------------------------------------------------------------------------

describe('useTransactionMultisender — execution state', () => {
  it('should flag isExecuting while the send is in flight and clear it afterwards', async () => {
    let resolveBalance: (lamports: number) => void = () => {}
    connection.getBalance.mockImplementationOnce(() => new Promise<number>((resolve) => (resolveBalance = resolve)))
    const { result } = renderHook(() => useTransactionMultisender())

    let promise: Promise<MultisenderResult | null> = Promise.resolve(null)
    act(() => {
      promise = result.current.execute(solParams(1))
    })
    await waitFor(() => expect(result.current.isExecuting).toBe(true))

    await act(async () => {
      resolveBalance(100 * LAMPORTS)
      await promise
    })
    expect(result.current.isExecuting).toBe(false)
  })

  it('should ignore a second submission while one is already in progress', async () => {
    let resolveBalance: (lamports: number) => void = () => {}
    connection.getBalance.mockImplementationOnce(() => new Promise<number>((resolve) => (resolveBalance = resolve)))
    const { result } = renderHook(() => useTransactionMultisender())

    let first: Promise<MultisenderResult | null> = Promise.resolve(null)
    act(() => {
      first = result.current.execute(solParams(1))
    })
    await waitFor(() => expect(result.current.isExecuting).toBe(true))

    let second: MultisenderResult | null = null
    await act(async () => {
      second = await result.current.execute(solParams(1))
    })
    expect(second).toBeNull()
    expect(toast.warning).toHaveBeenCalledWith('Transaction Multisender already in progress')

    await act(async () => {
      resolveBalance(100 * LAMPORTS)
      await first
    })
    expect(multisenderCalls()).toHaveLength(1)
  })

  it('should clear lastResult on reset', async () => {
    const { result } = renderHook(() => useTransactionMultisender())
    await run(result, solParams(1))
    expect(result.current.lastResult).not.toBeNull()

    act(() => result.current.reset())

    expect(result.current.lastResult).toBeNull()
    expect(result.current.validationErrors).toEqual([])
  })
})

describe('useTransactionMultisender module exports', () => {
  it('should export the hook as named and default export', async () => {
    const mod = await import('../useTransactionMultisender')
    expect(mod.useTransactionMultisender).toBeTypeOf('function')
    expect(mod.default).toBe(mod.useTransactionMultisender)
  })
})
