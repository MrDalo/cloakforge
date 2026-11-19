import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { Keypair, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js'

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock the Solana transaction builder (covered by its own unit tests)
vi.mock('@/lib/solana/server-side/createMultisenderTransaction', () => ({
  createMultisenderTransaction: vi.fn(),
}))

// Valid Solana addresses
const WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const RECIPIENT_A = 'So11111111111111111111111111111111111111112'
const RECIPIENT_B = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const BLOCKHASH = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N'

const VALID_BODY = {
  walletAddress: WALLET,
  tokenMintAddress: MINT,
  recipients: [
    { address: RECIPIENT_A, amount: 1.5 },
    { address: RECIPIENT_B, amount: 2 },
  ],
  decimals: 6,
}

// Real unsigned v0 transactions so the base64 payload can be round-tripped like the client does
const buildUnsignedTransaction = (lamports: number): VersionedTransaction =>
  new VersionedTransaction(
    new TransactionMessage({
      payerKey: new PublicKey(WALLET),
      recentBlockhash: BLOCKHASH,
      instructions: [SystemProgram.transfer({ fromPubkey: new PublicKey(WALLET), toPubkey: Keypair.generate().publicKey, lamports })],
    }).compileToV0Message()
  )

const makeBuilderResult = (transactions: VersionedTransaction[]) => ({
  transactions,
  batches: transactions.map((_, i) => ({ startIndex: i, recipientCount: 1, sizeBytes: 400 + i })),
  decimals: 6,
  totalServiceFee: 0.002,
  estimatedNetworkFee: 0.00001 * transactions.length,
  blockhash: BLOCKHASH,
  lastValidBlockHeight: 123456,
})

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/solana/transaction-multisender', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const makeRecipients = (n: number) => Array.from({ length: n }, () => ({ address: Keypair.generate().publicKey.toString(), amount: 1 }))

describe('POST /api/solana/transaction-multisender', () => {
  let POST: (req: NextRequest) => Promise<Response>
  let createMultisenderTransaction: ReturnType<typeof vi.fn>
  let builtTransactions: VersionedTransaction[]
  // Loaded after vi.resetModules() so `instanceof AppError` checks inside the route see the same class
  let AppError: typeof import('@/lib/errors').AppError

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../route')
    POST = mod.POST
    AppError = (await import('@/lib/errors')).AppError

    const builder = await import('@/lib/solana/server-side/createMultisenderTransaction')
    createMultisenderTransaction = vi.mocked(builder.createMultisenderTransaction) as unknown as ReturnType<typeof vi.fn>
    createMultisenderTransaction.mockReset()

    builtTransactions = [buildUnsignedTransaction(1_000), buildUnsignedTransaction(2_000)]
    createMultisenderTransaction.mockResolvedValue(makeBuilderResult(builtTransactions))
  })

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('should return 200 with the standard success envelope', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.status_code).toBe(200)
    expect(json.error_message).toBe('')
    expect(json.data).toHaveProperty('serializedTransactions')
    expect(json.data).toHaveProperty('batches')
    expect(json.data).toHaveProperty('decimals')
    expect(json.data).toHaveProperty('message')
    expect(json.data).toHaveProperty('totalServiceFee')
    expect(json.data).toHaveProperty('estimatedNetworkFee')
    expect(json.data).toHaveProperty('blockhash')
    expect(json.data).toHaveProperty('lastValidBlockHeight')
  })

  it('should serialize every transaction as base64 that deserializes back to the same message', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(json.data.serializedTransactions).toHaveLength(2)
    json.data.serializedTransactions.forEach((b64: string, i: number) => {
      expect(b64).toMatch(/^[A-Za-z0-9+/]+=*$/)
      const roundTripped = VersionedTransaction.deserialize(Buffer.from(b64, 'base64'))
      expect(Buffer.from(roundTripped.message.serialize())).toEqual(Buffer.from(builtTransactions[i].message.serialize()))
    })
  })

  it('should pass fee estimates and blockhash expiry data through to the client', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(json.data.totalServiceFee).toBe(0.002)
    expect(json.data.estimatedNetworkFee).toBeCloseTo(0.00002, 12)
    expect(json.data.blockhash).toBe(BLOCKHASH)
    expect(json.data.lastValidBlockHeight).toBe(123456)
  })

  it('should pass the batch layout and resolved decimals through to the client', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(json.data.batches).toEqual([
      { startIndex: 0, recipientCount: 1, sizeBytes: 400 },
      { startIndex: 1, recipientCount: 1, sizeBytes: 401 },
    ])
    expect(json.data.decimals).toBe(6)
  })

  it('should describe recipients and transactions in the message', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(json.data.message).toBe('Multisender prepared: 2 recipients in 2 transactions')
  })

  it('should use the singular form when everything fits into one transaction', async () => {
    createMultisenderTransaction.mockResolvedValueOnce(makeBuilderResult([buildUnsignedTransaction(1_000)]))
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(json.data.serializedTransactions).toHaveLength(1)
    expect(json.data.message).toBe('Multisender prepared: 2 recipients in 1 transaction')
  })

  it('should call the builder with PublicKey instances for the wallet and mint', async () => {
    await POST(makeRequest(VALID_BODY))

    expect(createMultisenderTransaction).toHaveBeenCalledTimes(1)
    const params = createMultisenderTransaction.mock.calls[0][0]
    expect(params.walletPublicKey).toBeInstanceOf(PublicKey)
    expect(params.walletPublicKey.toBase58()).toBe(WALLET)
    expect(params.tokenMintAddress).toBeInstanceOf(PublicKey)
    expect(params.tokenMintAddress.toBase58()).toBe(MINT)
    expect(params.recipients).toEqual(VALID_BODY.recipients)
    expect(params.decimals).toBe(6)
    expect(params.couponCode).toBeUndefined()
  })

  it('should treat a request without tokenMintAddress as a native SOL send', async () => {
    const { tokenMintAddress: _omit, ...solBody } = VALID_BODY
    void _omit
    const response = await POST(makeRequest({ ...solBody, decimals: 9 }))

    expect(response.status).toBe(200)
    expect(createMultisenderTransaction.mock.calls[0][0].tokenMintAddress).toBeUndefined()
  })

  it('should pass decimals through as an optional hint (undefined when omitted)', async () => {
    const { decimals: _omit, ...body } = VALID_BODY
    void _omit
    await POST(makeRequest(body))

    expect(createMultisenderTransaction.mock.calls[0][0].decimals).toBeUndefined()
  })

  it('should forward a trimmed coupon code to the builder', async () => {
    await POST(makeRequest({ ...VALID_BODY, couponCode: '  SAVE10 ' }))

    expect(createMultisenderTransaction.mock.calls[0][0].couponCode).toBe('SAVE10')
  })

  it('should accept the maximum of 500 recipients', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, recipients: makeRecipients(500) }))

    expect(response.status).toBe(200)
    expect(createMultisenderTransaction.mock.calls[0][0].recipients).toHaveLength(500)
  })

  it('should accept the minimum amount of 0.000001', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, recipients: [{ address: RECIPIENT_A, amount: 0.000001 }] }))
    expect(response.status).toBe(200)
  })

  // ---------------------------------------------------------------------------
  // Validation failures — builder must never be reached
  // ---------------------------------------------------------------------------

  it.each([
    ['an invalid wallet address', { walletAddress: 'bad-address' }],
    ['an empty wallet address', { walletAddress: '' }],
    ['an invalid tokenMintAddress', { tokenMintAddress: 'not-a-mint' }],
    ['an empty recipient list', { recipients: [] }],
    ['more than 500 recipients', { recipients: makeRecipients(501) }],
    ['an invalid recipient address', { recipients: [{ address: 'bad-recipient', amount: 1 }] }],
    ['a zero amount', { recipients: [{ address: RECIPIENT_A, amount: 0 }] }],
    ['a negative amount', { recipients: [{ address: RECIPIENT_A, amount: -1 }] }],
    ['an amount below 0.000001', { recipients: [{ address: RECIPIENT_A, amount: 0.0000001 }] }],
    ['a string amount', { recipients: [{ address: RECIPIENT_A, amount: '1' }] }],
    ['a recipient without amount', { recipients: [{ address: RECIPIENT_A }] }],
    ['negative decimals', { decimals: -1 }],
    ['decimals above 18', { decimals: 19 }],
    ['non-integer decimals', { decimals: 6.5 }],
    ['a coupon code shorter than 4 characters', { couponCode: 'AB' }],
    ['a coupon code longer than 6 characters', { couponCode: 'TOOLONG1' }],
  ])('should return 400 for %s', async (_label, override) => {
    const response = await POST(makeRequest({ ...VALID_BODY, ...override }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.status_code).toBe(400)
    expect(json.data).toBeNull()
    expect(createMultisenderTransaction).not.toHaveBeenCalled()
  })

  it('should return 400 when walletAddress is missing', async () => {
    const { walletAddress: _omit, ...body } = VALID_BODY
    void _omit
    const response = await POST(makeRequest(body))

    expect(response.status).toBe(400)
    expect(createMultisenderTransaction).not.toHaveBeenCalled()
  })

  it('should return 400 when recipients are missing', async () => {
    const response = await POST(makeRequest({ walletAddress: WALLET }))

    expect(response.status).toBe(400)
    expect(createMultisenderTransaction).not.toHaveBeenCalled()
  })

  it('should describe schema violations in the error message', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, recipients: [] }))
    const json = await response.json()

    expect(json.error_message).toMatch(/^Validation failed: /)
    expect(json.error_message).toContain('At least one recipient is required')
  })

  it('should report the 500 recipient cap in the error message', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, recipients: makeRecipients(501) }))
    const json = await response.json()

    expect(json.error_message).toContain('Maximum 500 recipients per request')
  })

  // ---------------------------------------------------------------------------
  // Handler errors
  // ---------------------------------------------------------------------------

  it('should surface an AppError from the builder with its status and message', async () => {
    createMultisenderTransaction.mockRejectedValueOnce(new AppError('TOKEN_NOT_FOUND', 'Token mint not found'))

    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_message).toBe('Token mint not found')
    expect(json.data).toBeNull()
  })

  it('should surface an invalid coupon rejection to the client', async () => {
    createMultisenderTransaction.mockRejectedValueOnce(
      new AppError('INVALID_INPUT', 'Discount coupon is invalid or has no remaining usage', 400)
    )

    const response = await POST(makeRequest({ ...VALID_BODY, couponCode: 'BAD1' }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error_message).toBe('Discount coupon is invalid or has no remaining usage')
  })

  it('should return 500 when the builder throws an unexpected (non-AppError) error', async () => {
    createMultisenderTransaction.mockRejectedValueOnce(new Error('Unexpected builder failure'))

    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
    expect(json.status_code).toBe(500)
    expect(json.data).toBeNull()
  })

  it('should map RPC network failures to a user-friendly message', async () => {
    createMultisenderTransaction.mockRejectedValueOnce(new Error('fetch failed'))

    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error_message).not.toBe('fetch failed')
    expect(json.error_message.length).toBeGreaterThan(0)
  })

  it('should return 500 when a built transaction cannot be serialized', async () => {
    createMultisenderTransaction.mockResolvedValueOnce(
      makeBuilderResult([
        {
          serialize: () => {
            throw new RangeError('encoding overruns Uint8Array')
          },
        } as unknown as VersionedTransaction,
      ])
    )

    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
    expect(json.data).toBeNull()
  })
})
