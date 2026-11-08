import { describe, it, expect } from 'vitest'
import { liquidityProviderRequestSchema, openPositionRequestSchema } from '../apiSchemas'

const VALID_ADDRESS_A = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const VALID_ADDRESS_B = 'So11111111111111111111111111111111111111112'

describe('liquidityProviderRequestSchema', () => {
  it('should validate valid CPMM request', () => {
    const validRequest = {
      walletAddress: VALID_ADDRESS_B,
      poolConfig: {
        poolType: 'CPMM',
        tokenA: VALID_ADDRESS_A,
        tokenB: VALID_ADDRESS_B,
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    expect(() => liquidityProviderRequestSchema.parse(validRequest)).not.toThrow()
  })

  it('should validate valid CLMM request with price range', () => {
    const validRequest = {
      walletAddress: VALID_ADDRESS_B,
      poolConfig: {
        poolType: 'CLMM',
        tokenA: VALID_ADDRESS_A,
        tokenB: VALID_ADDRESS_B,
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
        priceRange: {
          minPrice: '1.5',
          maxPrice: '2.5',
        },
        initialPrice: '2',
      },
    }

    expect(() => liquidityProviderRequestSchema.parse(validRequest)).not.toThrow()
  })

  it('should reject invalid pool type', () => {
    const invalidRequest = {
      walletAddress: VALID_ADDRESS_B,
      poolConfig: {
        poolType: 'INVALID',
        tokenA: VALID_ADDRESS_A,
        tokenB: VALID_ADDRESS_B,
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    expect(() => liquidityProviderRequestSchema.parse(invalidRequest)).toThrow()
  })

  it('should reject CLMM pool without price range', () => {
    const invalidRequest = {
      walletAddress: VALID_ADDRESS_B,
      poolConfig: {
        poolType: 'CLMM',
        tokenA: VALID_ADDRESS_A,
        tokenB: VALID_ADDRESS_B,
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    expect(() => liquidityProviderRequestSchema.parse(invalidRequest)).toThrow()
  })

  it('should reject zero amount', () => {
    const invalidRequest = {
      walletAddress: VALID_ADDRESS_B,
      poolConfig: {
        poolType: 'CPMM',
        tokenA: VALID_ADDRESS_A,
        tokenB: VALID_ADDRESS_B,
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '0',
          amountB: '0.5',
        },
      },
    }

    expect(() => liquidityProviderRequestSchema.parse(invalidRequest)).toThrow()
  })

  it('should reject negative amount', () => {
    const invalidRequest = {
      walletAddress: VALID_ADDRESS_B,
      poolConfig: {
        poolType: 'CPMM',
        tokenA: VALID_ADDRESS_A,
        tokenB: VALID_ADDRESS_B,
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '-5',
        },
      },
    }

    expect(() => liquidityProviderRequestSchema.parse(invalidRequest)).toThrow()
  })

  it('should reject non-numeric amount string', () => {
    const invalidRequest = {
      walletAddress: VALID_ADDRESS_B,
      poolConfig: {
        poolType: 'CPMM',
        tokenA: VALID_ADDRESS_A,
        tokenB: VALID_ADDRESS_B,
        feeTier: '0.05',
        initialLiquidity: {
          amountA: 'abc',
          amountB: '0.5',
        },
      },
    }

    expect(() => liquidityProviderRequestSchema.parse(invalidRequest)).toThrow()
  })

  it('should reject invalid wallet address format', () => {
    const invalidRequest = {
      walletAddress: 'not-a-valid-address',
      poolConfig: {
        poolType: 'CPMM',
        tokenA: VALID_ADDRESS_A,
        tokenB: VALID_ADDRESS_B,
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    expect(() => liquidityProviderRequestSchema.parse(invalidRequest)).toThrow()
  })

  it('should reject invalid token address format', () => {
    const invalidRequest = {
      walletAddress: VALID_ADDRESS_B,
      poolConfig: {
        poolType: 'CPMM',
        tokenA: 'not-valid-0000',
        tokenB: VALID_ADDRESS_B,
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
      },
    }

    expect(() => liquidityProviderRequestSchema.parse(invalidRequest)).toThrow()
  })

  it('should reject CLMM price range with zero min price', () => {
    const invalidRequest = {
      walletAddress: VALID_ADDRESS_B,
      poolConfig: {
        poolType: 'CLMM',
        tokenA: VALID_ADDRESS_A,
        tokenB: VALID_ADDRESS_B,
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5',
        },
        priceRange: {
          minPrice: '0',
          maxPrice: '2.5',
        },
      },
    }

    expect(() => liquidityProviderRequestSchema.parse(invalidRequest)).toThrow()
  })
})

describe('liquidityProviderRequestSchema — CLMM initial price, coupons and strict amounts', () => {
  const clmmRequest = (poolConfig: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) => ({
    walletAddress: VALID_ADDRESS_B,
    ...extra,
    poolConfig: {
      poolType: 'CLMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: VALID_ADDRESS_B,
      feeTier: '0.05',
      initialLiquidity: { amountA: '1000', amountB: '0.5' },
      priceRange: { minPrice: '1', maxPrice: '3' },
      initialPrice: '2',
      ...poolConfig,
    },
  })

  it('should require an initial price for CLMM pools', () => {
    const result = liquidityProviderRequestSchema.safeParse(clmmRequest({ initialPrice: undefined }))
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toEqual(['poolConfig', 'initialPrice'])
  })

  it.each([
    ['below the range', '0.5', false],
    ['above the range', '3.01', false],
    ['at the lower bound', '1', true],
    ['at the upper bound', '3', true],
  ])('should check an initial price %s', (_label, initialPrice, valid) => {
    expect(liquidityProviderRequestSchema.safeParse(clmmRequest({ initialPrice })).success).toBe(valid)
  })

  it('should reject a range whose max price is not above its min price', () => {
    expect(liquidityProviderRequestSchema.safeParse(clmmRequest({ priceRange: { minPrice: '3', maxPrice: '3' } })).success).toBe(false)
  })

  it('should reject a pool of one token with itself', () => {
    expect(liquidityProviderRequestSchema.safeParse(clmmRequest({ tokenB: VALID_ADDRESS_A })).success).toBe(false)
  })

  it.each(['1e3', '0x10', ' 1 0', 'Infinity', '1.', '.5', '0.000'])(
    'should reject amount %j that is not a positive plain decimal',
    (amountA) => {
      expect(liquidityProviderRequestSchema.safeParse(clmmRequest({ initialLiquidity: { amountA, amountB: '1' } })).success).toBe(false)
    }
  )

  it('should accept an optional coupon code and reject malformed ones', () => {
    expect(liquidityProviderRequestSchema.safeParse(clmmRequest({}, { couponCode: 'SAVE10' })).success).toBe(true)
    expect(liquidityProviderRequestSchema.safeParse(clmmRequest({}, { couponCode: 'X' })).success).toBe(false)
  })
})

describe('openPositionRequestSchema', () => {
  const request = (overrides: Record<string, unknown> = {}) => ({
    walletAddress: VALID_ADDRESS_B,
    poolId: VALID_ADDRESS_A,
    slippageTolerance: 0.5,
    poolConfig: {
      poolType: 'CLMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: VALID_ADDRESS_B,
      feeTier: '0.05',
      initialLiquidity: { amountA: '1000', amountB: '0.5' },
      priceRange: { minPrice: '1', maxPrice: '3' },
      initialPrice: '2',
    },
    ...overrides,
  })

  it('should accept a complete request', () => {
    expect(openPositionRequestSchema.safeParse(request()).success).toBe(true)
  })

  it.each([0, 0.09, 50.01, Number.NaN])('should reject slippage tolerance %s outside 0.1%–50%', (slippageTolerance) => {
    expect(openPositionRequestSchema.safeParse(request({ slippageTolerance })).success).toBe(false)
  })

  it('should require a numeric slippage tolerance', () => {
    expect(openPositionRequestSchema.safeParse(request({ slippageTolerance: '0.5' })).success).toBe(false)
    expect(openPositionRequestSchema.safeParse(request({ slippageTolerance: undefined })).success).toBe(false)
  })

  it('should only accept CLMM pools with an initial price inside the range', () => {
    const base = request().poolConfig
    expect(openPositionRequestSchema.safeParse(request({ poolConfig: { ...base, poolType: 'CPMM' } })).success).toBe(false)
    expect(openPositionRequestSchema.safeParse(request({ poolConfig: { ...base, initialPrice: undefined } })).success).toBe(false)
    expect(openPositionRequestSchema.safeParse(request({ poolConfig: { ...base, initialPrice: '4' } })).success).toBe(false)
  })

  it('should reject an invalid pool address', () => {
    expect(openPositionRequestSchema.safeParse(request({ poolId: 'not-a-pool' })).success).toBe(false)
  })
})
