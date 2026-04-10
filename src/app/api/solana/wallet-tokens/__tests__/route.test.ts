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

const mockTokens = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Wrapped SOL',
    balance: 1.5,
    decimals: 9,
  },
]

vi.mock('@/lib/solana/server-side/getWalletTokensServer', () => ({
  getWalletTokensWithMetadataServer: vi.fn().mockResolvedValue(mockTokens),
}))

const WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const VALID_BODY = {
  walletAddress: WALLET,
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/solana/wallet-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/solana/wallet-tokens', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../route')
    POST = mod.POST
  })

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('should returns 200 with tokens for a valid request', async () => {
    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toHaveProperty('tokens')
    expect(json.data.tokens).toEqual(mockTokens)
  })

  it('uses default toolType "all" when not specified', async () => {
    const { getWalletTokensWithMetadataServer } = await import('@/lib/solana/server-side/getWalletTokensServer')

    await POST(makeRequest(VALID_BODY))

    expect(getWalletTokensWithMetadataServer).toHaveBeenCalledWith(WALLET, expect.objectContaining({ toolType: 'all' }))
  })

  it('should passes toolType to the server utility', async () => {
    const { getWalletTokensWithMetadataServer } = await import('@/lib/solana/server-side/getWalletTokensServer')

    await POST(makeRequest({ ...VALID_BODY, toolType: 'burn-tokens' }))

    expect(getWalletTokensWithMetadataServer).toHaveBeenCalledWith(WALLET, expect.objectContaining({ toolType: 'burn-tokens' }))
  })

  it('should defaults nonZeroOnly to true', async () => {
    const { getWalletTokensWithMetadataServer } = await import('@/lib/solana/server-side/getWalletTokensServer')

    await POST(makeRequest(VALID_BODY))

    expect(getWalletTokensWithMetadataServer).toHaveBeenCalledWith(WALLET, expect.objectContaining({ nonZeroOnly: true }))
  })

  it('should accepts nonZeroOnly=false', async () => {
    const { getWalletTokensWithMetadataServer } = await import('@/lib/solana/server-side/getWalletTokensServer')

    await POST(makeRequest({ ...VALID_BODY, nonZeroOnly: false }))

    expect(getWalletTokensWithMetadataServer).toHaveBeenCalledWith(WALLET, expect.objectContaining({ nonZeroOnly: false }))
  })

  it('should passes revoke-mint-authority tool type through to the server utility', async () => {
    const { getWalletTokensWithMetadataServer } = await import('@/lib/solana/server-side/getWalletTokensServer')

    await POST(makeRequest({ ...VALID_BODY, toolType: 'revoke-mint-authority' }))

    expect(getWalletTokensWithMetadataServer).toHaveBeenCalledWith(WALLET, expect.objectContaining({ toolType: 'revoke-mint-authority' }))
  })

  it('should accepts all valid tool types', async () => {
    const toolTypes = [
      'burn-tokens',
      'revoke-mint-authority',
      'revoke-freeze-authority',
      'freeze-wallets',
      'unfreeze-wallets',
      'liquidity-provider',
      'token-creator',
      'token-auditor',
      'transaction-multisender',
      'all',
      'default',
    ]

    for (const toolType of toolTypes) {
      const response = await POST(makeRequest({ ...VALID_BODY, toolType }))
      expect(response.status).toBe(200)
    }
  })

  it('should accepts all valid commitment values', async () => {
    for (const commitment of ['finalized', 'confirmed', 'processed']) {
      const response = await POST(makeRequest({ ...VALID_BODY, commitment }))
      expect(response.status).toBe(200)
    }
  })

  // ---------------------------------------------------------------------------
  // Validation failures
  // ---------------------------------------------------------------------------

  it('should returns 400 for an invalid wallet address', async () => {
    const response = await POST(makeRequest({ walletAddress: 'not-valid' }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should returns 400 for an invalid toolType', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, toolType: 'invalid-tool' }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  it('should returns 400 for an invalid commitment level', async () => {
    const response = await POST(makeRequest({ ...VALID_BODY, commitment: 'fast' }))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  // ---------------------------------------------------------------------------
  // Handler errors
  // ---------------------------------------------------------------------------

  it('should returns 500 when getWalletTokensWithMetadataServer throws', async () => {
    const { getWalletTokensWithMetadataServer } = await import('@/lib/solana/server-side/getWalletTokensServer')
    vi.mocked(getWalletTokensWithMetadataServer).mockRejectedValueOnce(new Error('RPC error'))

    const response = await POST(makeRequest(VALID_BODY))
    const json = await response.json()
    void json

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
  })
})
