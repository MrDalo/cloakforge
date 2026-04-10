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

// Mock the Solana transaction builder
vi.mock('@/lib/solana/server-side/createBurnTokenTransaction', () => ({
  createBurnTokenTransaction: vi.fn().mockResolvedValue({
    transaction: {
      serialize: vi.fn().mockReturnValue(Buffer.from('mock-burn-transaction')),
    },
    rawAmount: '1000000',
    uiAmount: 1.0,
    tokenAccount: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    mint: 'So11111111111111111111111111111111111111112',
  }),
}))

// Valid Solana addresses
const WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const TOKEN_ACCOUNT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const MINT = 'So11111111111111111111111111111111111111112'

const VALID_BODY = {
  walletAddress: WALLET,
  tokenAccountAddress: TOKEN_ACCOUNT,
  mintAddress: MINT,
  amount: 1.0,
  decimals: 6,
  tokenSymbol: 'USDC',
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/solana/burn-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/solana/burn-tokens', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../route')
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
    expect(json.data).toHaveProperty('serializedTransaction')
    expect(json.data).toHaveProperty('rawAmount')
    expect(json.data).toHaveProperty('uiAmount')
    expect(json.data).toHaveProperty('tokenAccount')
    expect(json.data).toHaveProperty('mint')
    expect(json.data).toHaveProperty('message')
  })

  it('should includes token symbol in message when provided', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, tokenSymbol: 'USDC' }))
    const json = await response.json()
    void json
    expect(json.data.message).toContain('USDC')
  })

  it('uses "tokens" in message when tokenSymbol is absent', async () => {
    const bodyWithoutSymbol = { ...VALID_BODY }
    delete (bodyWithoutSymbol as { tokenSymbol?: string }).tokenSymbol
    const response = await POST(makeRequest(bodyWithoutSymbol))
    const json = await response.json()
    void json
    expect(json.data.message).toContain('tokens')
  })

  // ---------------------------------------------------------------------------
  // Validation failures
  // ---------------------------------------------------------------------------

  it('should returns 400 for an invalid wallet address', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, walletAddress: 'bad-address' }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should returns 400 for an invalid tokenAccountAddress', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, tokenAccountAddress: 'bad-token-account' }))
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

  it('should returns 400 when amount is 0', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, amount: 0 }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should returns 400 when amount is negative', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, amount: -1 }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should returns 400 when decimals is negative', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, decimals: -1 }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  it('should returns 400 when decimals exceeds 18', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, decimals: 19 }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  it('should returns 400 for missing required fields', async () => {
    const response = await POST(makeRequest({ walletAddress: WALLET }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  // ---------------------------------------------------------------------------
  // Handler errors
  // ---------------------------------------------------------------------------

  it('should returns 500 when createBurnTokenTransaction throws', async () => {
    const { createBurnTokenTransaction } = await import('@/lib/solana/server-side/createBurnTokenTransaction')
    vi.mocked(createBurnTokenTransaction).mockRejectedValueOnce(new Error('RPC connection failed'))

    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()
    void json

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
    expect(json.data).toBeNull()
  })
})
