import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { z } from 'zod'

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
    const mod = await import('../createSolanaApiRoute')
    createSolanaApiRoute = mod.createSolanaApiRoute
  })

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('returns 200 with data for a valid wallet address', async () => {
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

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data.hasPublicKey).toBe(true)
    expect(json.data.walletAddress).toBe(VALID_WALLET)
  })

  it('passes a valid PublicKey instance to the handler', async () => {
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

  it('returns 400 for an invalid wallet address', async () => {
    const handler = createSolanaApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makeRequest({ walletAddress: 'not-a-valid-address' }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_message).toContain('Invalid wallet address')
  })

  it('returns 400 for an empty wallet address', async () => {
    const handler = createSolanaApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makeRequest({ walletAddress: '' }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  // ---------------------------------------------------------------------------
  // Additional address fields validation
  // ---------------------------------------------------------------------------

  it('validates additional address fields successfully', async () => {
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

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
  })

  it('returns 400 when an additional address field has invalid format', async () => {
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

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_message).toContain('mintAddress')
  })

  it('validates multiple additional address fields', async () => {
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

    const response = await handler(
      makeRequest({ walletAddress: VALID_WALLET, mintAddress: VALID_MINT, tokenAccount: VALID_TOKEN_ACCOUNT })
    )
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
  })

  it('returns 400 when the second of multiple additional address fields is invalid', async () => {
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

    const response = await handler(
      makeRequest({ walletAddress: VALID_WALLET, mintAddress: VALID_MINT, tokenAccount: 'bad-address' })
    )
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error_message).toContain('tokenAccount')
  })

  // ---------------------------------------------------------------------------
  // Handler errors propagate
  // ---------------------------------------------------------------------------

  it('returns 500 when the handler throws a generic error', async () => {
    const handler = createSolanaApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => {
        throw new Error('Handler error')
      },
    })

    const response = await handler(makeRequest({ walletAddress: VALID_WALLET }))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
  })
})
