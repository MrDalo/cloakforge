import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { z } from 'zod'

vi.mock('server-only', () => ({}))

// Server-side kill switch lookup (default: no Contentful config → tool enabled)
const mockGetCachedToolConfig = vi.hoisted(() => vi.fn())
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: (...args: unknown[]) => mockGetCachedToolConfig(...args),
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

// Valid Solana addresses for testing
const VALID_WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const VALID_MINT = 'So11111111111111111111111111111111111111112'
const VALID_TOKEN_ACCOUNT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

const testSchema = z.object({
  walletAddress: z.string().min(1),
  amount: z.number().optional(),
  mintAddress: z.string().optional(),
})

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('createSolanaApiRoute', () => {
  let createSolanaApiRoute: typeof import('../createSolanaApiRoute').createSolanaApiRoute

  beforeEach(async () => {
    vi.resetModules()
    mockGetCachedToolConfig.mockReset()
    mockGetCachedToolConfig.mockResolvedValue(null)
    const mod = await import('../createSolanaApiRoute')
    createSolanaApiRoute = mod.createSolanaApiRoute
  })

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('should returns 200 with data for a valid wallet address', async () => {
    const handler = createSolanaApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async (data) => ({
        walletAddress: data.walletAddress,
        hasPublicKey: !!data.walletPublicKey,
      }),
    })

    const response = await handler(makeRequest({ walletAddress: VALID_WALLET }))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data.hasPublicKey).toBe(true)
    expect(json.data.walletAddress).toBe(VALID_WALLET)
  })

  it('should passes a valid PublicKey instance to the handler', async () => {
    const handlerFn = vi.fn().mockResolvedValue({ ok: true })
    const { PublicKey } = await import('@solana/web3.js')

    const handler = createSolanaApiRoute({
      name: 'test',
      schema: testSchema,
      handler: handlerFn,
    })

    await handler(makeRequest({ walletAddress: VALID_WALLET }))

    const callArg = handlerFn.mock.calls[0][0]
    expect(callArg.walletPublicKey).toBeInstanceOf(PublicKey)
    expect(callArg.walletPublicKey.toBase58()).toBe(VALID_WALLET)
  })

  // ---------------------------------------------------------------------------
  // Invalid wallet address
  // ---------------------------------------------------------------------------

  it('should returns 400 for an invalid wallet address', async () => {
    const handler = createSolanaApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makeRequest({ walletAddress: 'not-a-valid-address' }))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_message).toContain('Invalid wallet address')
  })

  it('should returns 400 for an empty wallet address', async () => {
    const handler = createSolanaApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makeRequest({ walletAddress: '' }))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  // ---------------------------------------------------------------------------
  // Additional address fields validation
  // ---------------------------------------------------------------------------

  it('should validates additional address fields successfully', async () => {
    const schemaWithMint = z.object({
      walletAddress: z.string().min(1),
      mintAddress: z.string().min(1),
    })

    const handler = createSolanaApiRoute({
      name: 'test',
      schema: schemaWithMint,
      additionalAddressFields: ['mintAddress'],
      handler: async (data) => ({ wallet: data.walletAddress, mint: data.mintAddress }),
    })

    const response = await handler(makeRequest({ walletAddress: VALID_WALLET, mintAddress: VALID_MINT }))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
  })

  it('should returns 400 when an additional address field has invalid format', async () => {
    const schemaWithMint = z.object({
      walletAddress: z.string().min(1),
      mintAddress: z.string().min(1),
    })

    const handler = createSolanaApiRoute({
      name: 'test',
      schema: schemaWithMint,
      additionalAddressFields: ['mintAddress'],
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makeRequest({ walletAddress: VALID_WALLET, mintAddress: 'invalid-mint' }))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_message).toContain('mintAddress')
  })

  it('should validates multiple additional address fields', async () => {
    const schemaWithAddresses = z.object({
      walletAddress: z.string().min(1),
      mintAddress: z.string().min(1),
      tokenAccount: z.string().min(1),
    })

    const handler = createSolanaApiRoute({
      name: 'test',
      schema: schemaWithAddresses,
      additionalAddressFields: ['mintAddress', 'tokenAccount'],
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makeRequest({ walletAddress: VALID_WALLET, mintAddress: VALID_MINT, tokenAccount: VALID_TOKEN_ACCOUNT }))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
  })

  it('should returns 400 when the second of multiple additional address fields is invalid', async () => {
    const schemaWithAddresses = z.object({
      walletAddress: z.string().min(1),
      mintAddress: z.string().min(1),
      tokenAccount: z.string().min(1),
    })

    const handler = createSolanaApiRoute({
      name: 'test',
      schema: schemaWithAddresses,
      additionalAddressFields: ['mintAddress', 'tokenAccount'],
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makeRequest({ walletAddress: VALID_WALLET, mintAddress: VALID_MINT, tokenAccount: 'bad-address' }))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.error_message).toContain('tokenAccount')
  })

  // ---------------------------------------------------------------------------
  // Handler errors propagate
  // ---------------------------------------------------------------------------

  it('should returns 500 when the handler throws a generic error', async () => {
    const handler = createSolanaApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => {
        throw new Error('Handler error')
      },
    })

    const response = await handler(makeRequest({ walletAddress: VALID_WALLET }))
    const json = await response.json()
    void json

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
  })

  // ---------------------------------------------------------------------------
  // Server-side kill switch (Contentful isEnabled)
  // ---------------------------------------------------------------------------

  describe('tool kill switch', () => {
    const makeToolConfig = (isEnabled: boolean, disabledMessage?: string) => ({
      toolId: 'burn-tokens',
      isEnabled,
      disabledMessage,
      baseFee: 0.009,
      networkFee: 0.01,
    })

    it('should return 503 with the disabledMessage and skip the handler when the tool is disabled', async () => {
      mockGetCachedToolConfig.mockResolvedValue(makeToolConfig(false, 'Burning is paused for maintenance'))
      const handlerFn = vi.fn().mockResolvedValue({ ok: true })

      const handler = createSolanaApiRoute({ name: 'solana/burn-tokens', schema: testSchema, handler: handlerFn })
      const response = await handler(makeRequest({ walletAddress: VALID_WALLET }))
      const json = await response.json()

      expect(response.status).toBe(503)
      expect(json.status).toBe('error')
      expect(json.error_message).toBe('Burning is paused for maintenance')
      expect(json.error_code).toBe('TOOL_DISABLED')
      expect(handlerFn).not.toHaveBeenCalled()
      expect(mockGetCachedToolConfig).toHaveBeenCalledWith('burn-tokens')
    })

    it('should return 503 with a default message when the disabled tool has no disabledMessage', async () => {
      mockGetCachedToolConfig.mockResolvedValue(makeToolConfig(false))

      const handler = createSolanaApiRoute({ name: 'solana/burn-tokens', schema: testSchema, handler: async () => ({ ok: true }) })
      const response = await handler(makeRequest({ walletAddress: VALID_WALLET }))
      const json = await response.json()

      expect(response.status).toBe(503)
      expect(json.error_message).toContain('temporarily disabled')
    })

    it('should allow the request when the tool is enabled', async () => {
      mockGetCachedToolConfig.mockResolvedValue(makeToolConfig(true))

      const handler = createSolanaApiRoute({ name: 'solana/burn-tokens', schema: testSchema, handler: async () => ({ ok: true }) })
      const response = await handler(makeRequest({ walletAddress: VALID_WALLET }))

      expect(response.status).toBe(200)
    })

    it('should keep the tool enabled when no config exists for it', async () => {
      mockGetCachedToolConfig.mockResolvedValue(null)

      const handler = createSolanaApiRoute({ name: 'solana/burn-tokens', schema: testSchema, handler: async () => ({ ok: true }) })
      const response = await handler(makeRequest({ walletAddress: VALID_WALLET }))

      expect(response.status).toBe(200)
    })

    it('should keep the tool enabled when the config lookup fails (availability over strictness)', async () => {
      mockGetCachedToolConfig.mockRejectedValue(new Error('Contentful down'))

      const handler = createSolanaApiRoute({ name: 'solana/burn-tokens', schema: testSchema, handler: async () => ({ ok: true }) })
      const response = await handler(makeRequest({ walletAddress: VALID_WALLET }))

      expect(response.status).toBe(200)
    })

    it('should check an explicit toolId instead of the one derived from the route name', async () => {
      mockGetCachedToolConfig.mockResolvedValue(makeToolConfig(false))

      const handler = createSolanaApiRoute({
        name: 'solana/liquidity-provider/open-position',
        toolId: 'liquidity-provider',
        schema: testSchema,
        handler: async () => ({ ok: true }),
      })
      const response = await handler(makeRequest({ walletAddress: VALID_WALLET }))

      expect(response.status).toBe(503)
      expect(mockGetCachedToolConfig).toHaveBeenCalledWith('liquidity-provider')
    })

    it('should never gate read-only routes configured with toolId null', async () => {
      mockGetCachedToolConfig.mockResolvedValue(makeToolConfig(false))

      const handler = createSolanaApiRoute({
        name: 'solana/wallet-tokens',
        toolId: null,
        schema: testSchema,
        handler: async () => ({ ok: true }),
      })
      const response = await handler(makeRequest({ walletAddress: VALID_WALLET }))

      expect(response.status).toBe(200)
      expect(mockGetCachedToolConfig).not.toHaveBeenCalled()
    })
  })
})
