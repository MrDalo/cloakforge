import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

// Server-side kill switch lookup: no Contentful config → tool enabled
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: vi.fn().mockResolvedValue(null),
}))

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

vi.mock('@/lib/solana/server-side/createTokenCreationTransaction', () => ({
  createTokenCreationTransaction: vi.fn().mockResolvedValue({
    transaction: {
      serialize: vi.fn().mockReturnValue(Buffer.from('mock-token-creation-tx')),
    },
    mintPublicKey: 'NewMintPublicKey111111111111111111111111111',
  }),
}))

// Valid Solana address
const WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const VALID_BODY = {
  walletAddress: WALLET,
  mintPublicKey: 'So11111111111111111111111111111111111111112',
  tokenData: {
    name: 'My Test Token',
    symbol: 'MTT',
    description: 'A test token',
    decimals: 9,
    totalSupply: 1_000_000,
    immutableMetadata: false,
    revokeFreezeAuthority: false,
    revokeMintAuthority: true,
  },
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/solana/token-creator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/solana/token-creator', () => {
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
    expect(json.data).toHaveProperty('mintPublicKey')
    expect(json.data).toHaveProperty('message')
  })

  it('should includes mint public key in message', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()
    void json
    expect(json.data.message).toContain('NewMintPublicKey')
  })

  it('should accepts optional metadata with URIs', async () => {
    const bodyWithMetadata = {
      ...VALID_BODY,
      metadata: {
        logoUri: 'ipfs://QmSomeHash',
        metadataUri: 'ipfs://QmMetadataHash',
      },
    }
    const response = await POST(makeRequest(bodyWithMetadata))
    const json = await response.json()
    void json
    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
  })

  it('should accepts token with website URL', async () => {
    const body = {
      ...VALID_BODY,
      tokenData: { ...VALID_BODY.tokenData, website: 'https://example.com' },
    }
    const response = await POST(makeRequest(body))
    const json = await response.json()
    void json
    expect(response.status).toBe(200)
  })

  it('should accepts empty website string', async () => {
    const body = {
      ...VALID_BODY,
      tokenData: { ...VALID_BODY.tokenData, website: '' },
    }
    const response = await POST(makeRequest(body))
    const json = await response.json()
    void json
    expect(response.status).toBe(200)
  })

  // ---------------------------------------------------------------------------
  // Validation failures
  // ---------------------------------------------------------------------------

  it('should returns 400 for invalid wallet address', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, walletAddress: 'not-valid' }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should returns 400 for invalid mint public key', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, mintPublicKey: 'not-valid' }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should returns 400 when token name is empty', async () => {
    const response = await POST(
      makeRequest({
        ...VALID_BODY,
        tokenData: { ...VALID_BODY.tokenData, name: '' },
      })
    )
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  it('should returns 400 when token name exceeds 32 characters', async () => {
    const response = await POST(
      makeRequest({
        ...VALID_BODY,
        tokenData: { ...VALID_BODY.tokenData, name: 'A'.repeat(33) },
      })
    )
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  it('should returns 400 when symbol exceeds 10 characters', async () => {
    const response = await POST(
      makeRequest({
        ...VALID_BODY,
        tokenData: { ...VALID_BODY.tokenData, symbol: 'TOOLONGSYM' + 'X' },
      })
    )
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  it('should returns 400 when decimals exceeds 9', async () => {
    const response = await POST(
      makeRequest({
        ...VALID_BODY,
        tokenData: { ...VALID_BODY.tokenData, decimals: 10 },
      })
    )
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  it('should returns 400 when totalSupply is 0', async () => {
    const response = await POST(
      makeRequest({
        ...VALID_BODY,
        tokenData: { ...VALID_BODY.tokenData, totalSupply: 0 },
      })
    )
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  it('should returns 400 when website is not a valid URL', async () => {
    const response = await POST(
      makeRequest({
        ...VALID_BODY,
        tokenData: { ...VALID_BODY.tokenData, website: 'not-a-url' },
      })
    )
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  // ---------------------------------------------------------------------------
  // Handler errors
  // ---------------------------------------------------------------------------

  it('should returns 500 when createTokenCreationTransaction throws', async () => {
    const { createTokenCreationTransaction } = await import('@/lib/solana/server-side/createTokenCreationTransaction')
    vi.mocked(createTokenCreationTransaction).mockRejectedValueOnce(new Error('Transaction build failed'))

    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()
    void json

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
    expect(json.data).toBeNull()
  })
})
