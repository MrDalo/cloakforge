import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/security/originValidator', () => ({
  validateSecurity: vi.fn().mockResolvedValue(undefined),
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
  createFreezeAccountTransaction: vi.fn().mockResolvedValue({
    transaction: {
      serialize: vi.fn().mockReturnValue(Buffer.from('mock-freeze-transaction')),
    },
  }),
}))

// Valid addresses
const WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const TOKEN_ACCOUNT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const MINT = 'So11111111111111111111111111111111111111112'

const VALID_BODY = {
  walletAddress: WALLET,
  tokenAccount: TOKEN_ACCOUNT,
  mintAddress: MINT,
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/solana/freeze-accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/solana/freeze-accounts', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../route')
    POST = mod.POST
  })

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('returns 200 with serialized transaction for valid request', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toHaveProperty('serializedTransaction')
    expect(json.data).toHaveProperty('message')
  })

  it('includes the token account in the response message', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()
    expect(json.data.message).toContain(TOKEN_ACCOUNT)
  })

  it('calls createFreezeAccountTransaction with correct args', async () => {
    const { createFreezeAccountTransaction } = await import('@/lib/solana/server-side/createFreezeAccountTransaction')

    await POST(makeRequest(VALID_BODY))

    expect(createFreezeAccountTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        walletPublicKey: expect.any(Object),
        tokenAccount: expect.any(Object),
        mintAddress: expect.any(Object),
      })
    )
  })

  // ---------------------------------------------------------------------------
  // Validation failures
  // ---------------------------------------------------------------------------

  it('returns 400 for an invalid wallet address', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, walletAddress: 'bad-wallet' }))
    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('returns 400 for an invalid tokenAccount address', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, tokenAccount: 'bad-token-account' }))
    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('returns 400 for an invalid mintAddress', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, mintAddress: 'bad-mint' }))
    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('returns 400 when walletAddress is missing', async () => {
    const { tokenAccount, mintAddress } = VALID_BODY
    const response = await POST(makeRequest({ tokenAccount, mintAddress }))
    const json = await response.json()
    expect(response.status).toBe(400)
  })

  it('returns 400 when tokenAccount is missing', async () => {
    const { walletAddress, mintAddress } = VALID_BODY
    const response = await POST(makeRequest({ walletAddress, mintAddress }))
    const json = await response.json()
    expect(response.status).toBe(400)
  })

  it('returns 400 when mintAddress is missing', async () => {
    const { walletAddress, tokenAccount } = VALID_BODY
    const response = await POST(makeRequest({ walletAddress, tokenAccount }))
    const json = await response.json()
    expect(response.status).toBe(400)
  })

  // ---------------------------------------------------------------------------
  // Handler errors
  // ---------------------------------------------------------------------------

  it('returns 500 when createFreezeAccountTransaction throws', async () => {
    const { createFreezeAccountTransaction } = await import('@/lib/solana/server-side/createFreezeAccountTransaction')
    vi.mocked(createFreezeAccountTransaction).mockRejectedValueOnce(new Error('Freeze transaction failed'))

    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
    expect(json.data).toBeNull()
  })
})
