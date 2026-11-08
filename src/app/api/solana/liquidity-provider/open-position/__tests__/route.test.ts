import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, type NextResponse } from 'next/server'

vi.mock('server-only', () => ({}))

// Server-side kill switch lookup: no Contentful config → tool enabled
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: vi.fn().mockResolvedValue(null),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/solana/server-side/createRaydiumPool', () => ({
  createRaydiumPositionTransaction: vi.fn().mockResolvedValue({
    serializedTransaction: 'mock-position-transaction',
    positionNftMint: 'mock-nft-mint',
    estimatedCosts: { positionOpening: 0.15 },
    message: 'Position-opening transaction prepared successfully',
  }),
}))

const WALLET = 'So11111111111111111111111111111111111111112'
const POOL_ID = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

const validBody = {
  walletAddress: WALLET,
  poolId: POOL_ID,
  slippageTolerance: 1,
  poolConfig: {
    poolType: 'CLMM',
    tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    tokenB: WALLET,
    feeTier: '0.05',
    initialLiquidity: { amountA: '1000', amountB: '0.5' },
    priceRange: { minPrice: '1.5', maxPrice: '2.5' },
    initialPrice: '2',
  },
}

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost:3001/api/solana/liquidity-provider/open-position', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('/api/solana/liquidity-provider/open-position', () => {
  let POST: (req: NextRequest) => Promise<NextResponse>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    POST = (await import('../route')).POST
  })

  it('should pass the pool, price settings and slippage tolerance to the builder', async () => {
    const { createRaydiumPositionTransaction } = await import('@/lib/solana/server-side/createRaydiumPool')

    const response = await POST(makeRequest(validBody))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data).toMatchObject({ serializedTransaction: 'mock-position-transaction', positionNftMint: 'mock-nft-mint' })
    expect(createRaydiumPositionTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        poolId: POOL_ID,
        slippageTolerance: 1,
        poolConfig: expect.objectContaining({ initialPrice: '2', priceRange: { minPrice: '1.5', maxPrice: '2.5' } }),
      })
    )
  })

  it.each([
    ['a slippage tolerance above 50%', { slippageTolerance: 60 }],
    ['a missing slippage tolerance', { slippageTolerance: undefined }],
    ['a missing initial price', { poolConfig: { ...validBody.poolConfig, initialPrice: undefined } }],
    ['an invalid pool address', { poolId: 'not-a-pool' }],
  ])('should reject %s with 400 before building', async (_label, overrides) => {
    const { createRaydiumPositionTransaction } = await import('@/lib/solana/server-side/createRaydiumPool')

    const response = await POST(makeRequest({ ...validBody, ...overrides }))

    expect(response.status).toBe(400)
    expect(createRaydiumPositionTransaction).not.toHaveBeenCalled()
  })
})
