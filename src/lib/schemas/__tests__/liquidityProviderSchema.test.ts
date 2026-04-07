import { describe, it, expect } from 'vitest'
import { liquidityProviderRequestSchema } from '../apiSchemas'

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
