import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, type NextResponse } from 'next/server'

// Mock server-only to allow importing server-side modules in test environment
vi.mock('server-only', () => ({}))

// Mock next/headers (required by createApiRoute)
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

// Mock security validation (bypass for tests)
vi.mock('@/lib/security/originValidator', () => ({
  validateSecurity: vi.fn().mockResolvedValue(undefined),
}))

// Mock server utility
vi.mock('@/lib/solana/server-side/createRaydiumPool', () => ({
  createRaydiumPoolTransaction: vi.fn().mockResolvedValue({
    serializedTransaction: 'mock-base64-transaction',
    poolPublicKey: 'mock-pool-address',
    estimatedCosts: {
      poolCreation: 0.19,
      platformFee: 0.01,
      networkFee: 0.0005,
    },
    message: 'Pool created successfully',
  }),
}))

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost:3001/api/solana/liquidity-provider', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('/api/solana/liquidity-provider', () => {
  // POST is imported dynamically after each vi.resetModules() call so that
  // top-level vi.mock() factories are re-evaluated with fresh mock state per test.
  let POST: (req: NextRequest) => Promise<NextResponse>

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../route')
    POST = mod.POST
  })

  it('should handle valid CPMM pool creation request', async () => {
    const requestBody = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      poolConfig: {
        poolType: 'CPMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    const response = await POST(makeRequest(requestBody))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toHaveProperty('serializedTransaction')
    expect(json.data).toHaveProperty('poolPublicKey')
    expect(json.data).toHaveProperty('estimatedCosts')
    expect(json.data.serializedTransaction).toBe('mock-base64-transaction')
  })

  it('should handle valid CLMM pool creation request', async () => {
    const { createRaydiumPoolTransaction } = await import('@/lib/solana/server-side/createRaydiumPool')

    const requestBody = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      poolConfig: {
        poolType: 'CLMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
        priceRange: {
          minPrice: '1.5',
          maxPrice: '2.5',
        },
      },
    }

    const response = await POST(makeRequest(requestBody))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data.poolPublicKey).toBe('mock-pool-address')
    expect(json.data.estimatedCosts.poolCreation).toBe(0.19)
    expect(createRaydiumPoolTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        poolConfig: expect.objectContaining({
          poolType: 'CLMM',
          priceRange: { minPrice: '1.5', maxPrice: '2.5' },
        }),
      })
    )
  })

  it('should reject request missing poolType', async () => {
    const invalidRequestBody = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      poolConfig: {
        // Missing poolType
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    const response = await POST(makeRequest(invalidRequestBody))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should reject CLMM request missing priceRange', async () => {
    const requestBody = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      poolConfig: {
        poolType: 'CLMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
        // No priceRange — required for CLMM
      },
    }

    const response = await POST(makeRequest(requestBody))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should reject request with invalid wallet address', async () => {
    const requestBody = {
      walletAddress: 'not-a-valid-address',
      poolConfig: {
        poolType: 'CPMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    const response = await POST(makeRequest(requestBody))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should return 500 when createRaydiumPoolTransaction throws', async () => {
    const { createRaydiumPoolTransaction } = await import('@/lib/solana/server-side/createRaydiumPool')
    vi.mocked(createRaydiumPoolTransaction).mockRejectedValueOnce(new Error('Pool creation failed'))

    const requestBody = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      poolConfig: {
        poolType: 'CPMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    const response = await POST(makeRequest(requestBody))
    const json = await response.json()
    void json

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
  })
})
