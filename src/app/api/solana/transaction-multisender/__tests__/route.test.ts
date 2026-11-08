import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { Keypair, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import { AppError } from '@/lib/errors'
import { createMultisenderTransaction } from '@/lib/solana/server-side/createMultisenderTransaction'
import { POST } from '../route'

vi.mock('server-only', () => ({}))

// Server-side kill switch lookup: no Contentful config → tool enabled
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: vi.fn().mockResolvedValue(null),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

vi.mock('@/lib/solana/server-side/createMultisenderTransaction', () => ({
  createMultisenderTransaction: vi.fn(),
}))

const WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const MINT = 'So11111111111111111111111111111111111111112'

const makeRecipients = (n: number) => Array.from({ length: n }, () => ({ address: Keypair.generate().publicKey.toString(), amount: 1 }))

/** A real unsigned v0 transaction paying `recipients` SOL transfers. */
const makeTransaction = (recipients: number): VersionedTransaction => {
  const payerKey = new PublicKey(WALLET)
  const message = new TransactionMessage({
    payerKey,
    recentBlockhash: Keypair.generate().publicKey.toString(),
    instructions: Array.from({ length: recipients }, () =>
      SystemProgram.transfer({ fromPubkey: payerKey, toPubkey: Keypair.generate().publicKey, lamports: 1 })
    ),
  }).compileToV0Message()
  return new VersionedTransaction(message)
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/solana/transaction-multisender', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/solana/transaction-multisender', () => {
  beforeEach(() => {
    vi.mocked(createMultisenderTransaction).mockReset()
  })

  it('should return the per-transaction recipient counts aligned with the serialized transactions', async () => {
    const transactions = [makeTransaction(7), makeTransaction(8), makeTransaction(2)]
    vi.mocked(createMultisenderTransaction).mockResolvedValue({
      transactions,
      recipientCounts: [7, 8, 2],
      totalServiceFee: 0.017,
      estimatedNetworkFee: 0.000015,
      blockhash: 'blockhash',
      lastValidBlockHeight: 123,
    })
    const recipients = makeRecipients(17)

    const response = await POST(makeRequest({ walletAddress: WALLET, tokenMintAddress: MINT, recipients, couponCode: 'SAVE50' }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data.recipientCounts).toEqual([7, 8, 2])
    expect(json.data.serializedTransactions).toHaveLength(3)
    json.data.serializedTransactions.forEach((serialized: string, index: number) => {
      const decoded = VersionedTransaction.deserialize(Buffer.from(serialized, 'base64'))
      expect(decoded.message.compiledInstructions).toHaveLength(json.data.recipientCounts[index])
    })
    expect(json.data.message).toContain('17 recipients in 3 transaction(s)')
    expect(json.data).toMatchObject({ totalServiceFee: 0.017, blockhash: 'blockhash', lastValidBlockHeight: 123 })

    expect(createMultisenderTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        walletPublicKey: new PublicKey(WALLET),
        tokenMintAddress: new PublicKey(MINT),
        recipients,
        couponCode: 'SAVE50',
      })
    )
  })

  it('should pass the builder AppError through instead of a generic 500 when a recipient cannot fit', async () => {
    vi.mocked(createMultisenderTransaction).mockRejectedValue(
      new AppError('TRANSACTION_FAILED', 'Recipient #1 does not fit in a single transaction (limit 1200 bytes)', 500)
    )

    const response = await POST(makeRequest({ walletAddress: WALLET, tokenMintAddress: MINT, recipients: makeRecipients(1) }))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json).toMatchObject({
      status: 'error',
      error_code: 'TRANSACTION_FAILED',
      error_message: expect.stringContaining('does not fit'),
    })
  })

  it('should return 400 without calling the builder for an empty recipient list', async () => {
    const response = await POST(makeRequest({ walletAddress: WALLET, recipients: [] }))

    expect(response.status).toBe(400)
    expect(createMultisenderTransaction).not.toHaveBeenCalled()
  })
})
