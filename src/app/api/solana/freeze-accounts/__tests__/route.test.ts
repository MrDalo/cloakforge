import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

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

vi.mock('@/lib/solana/server-side/createFreezeAccountTransaction', () => ({
  createFreezeAccountTransaction: vi.fn(),
}))

vi.mock('@/lib/solana/server-side/createFreezeWalletTransaction', () => ({
  createBatchFreezeTransaction: vi.fn().mockResolvedValue({
    transactions: [
      {
        serialize: vi.fn().mockReturnValue(Buffer.from('mock-freeze-transaction')),
      },
    ],
    frozenWallets: ['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'],
    derivedTokenAccounts: ['4eNvNs43y8s6DniS4QkQk2x9fDhx2M7BfNnHCqB6o6Hu'],
    blockhash: '8AagfFepYVmV4CHwP6R9cUf7JXLpqM13W7B5VgJv8R5f',
    lastValidBlockHeight: 123456,
  }),
}))

// Valid addresses
const WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const TOKEN_ACCOUNT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const MINT = 'So11111111111111111111111111111111111111112'

const VALID_BODY = {
  walletAddress: WALLET,
  targetWallets: [TOKEN_ACCOUNT],
  mintAddress: MINT,
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/solana/freeze-wallets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/solana/freeze-wallets', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../../freeze-wallets/route')
    POST = mod.POST
  })

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('should returns 200 with serialized transaction for valid request', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toHaveProperty('serializedTransactions')
    expect(json.data).toHaveProperty('message')
  })

  it('should includes wallet count in the response message', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()
    void json
    expect(json.data.message).toContain('wallet')
  })

  it('should calls createBatchFreezeTransaction with correct args', async () => {
    const { createBatchFreezeTransaction } = await import('@/lib/solana/server-side/createFreezeWalletTransaction')

    await POST(makeRequest(VALID_BODY))

    expect(createBatchFreezeTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        walletPublicKey: expect.any(Object),
        targetWallets: expect.any(Array),
        mintAddress: expect.any(Object),
      })
    )
  })

  // ---------------------------------------------------------------------------
  // Validation failures
  // ---------------------------------------------------------------------------

  it('should returns 400 for an invalid wallet address', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, walletAddress: 'bad-wallet' }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should returns 400 for an invalid target wallet address', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, targetWallets: ['bad-token-account'] }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should returns 400 for an invalid mintAddress', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, mintAddress: 'bad-mint' }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should returns 400 when walletAddress is missing', async () => {
    const { targetWallets, mintAddress } = VALID_BODY
    const response = await POST(makeRequest({ targetWallets, mintAddress }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  it('should returns 400 when targetWallets is missing', async () => {
    const { walletAddress, mintAddress } = VALID_BODY
    const response = await POST(makeRequest({ walletAddress, mintAddress, targetWallets: undefined }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  it('should returns 400 when mintAddress is missing', async () => {
    const { walletAddress, targetWallets } = VALID_BODY
    const response = await POST(makeRequest({ walletAddress, targetWallets }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  // ---------------------------------------------------------------------------
  // Handler errors
  // ---------------------------------------------------------------------------

  it('should returns 500 when createBatchFreezeTransaction throws', async () => {
    const { createBatchFreezeTransaction } = await import('@/lib/solana/server-side/createFreezeWalletTransaction')
    vi.mocked(createBatchFreezeTransaction).mockRejectedValueOnce(new Error('Freeze transaction failed'))

    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()
    void json

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
    expect(json.data).toBeNull()
  })
})
