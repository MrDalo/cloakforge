import { describe, it, expect } from 'vitest'
import {
  liquidityProviderRequestSchema,
  solanaAddressSchema,
  SOLANA_ADDRESS_REGEX,
} from '../apiSchemas'

// Real base58 Solana addresses (no forbidden characters like 0, O, I, l)
// These pass the /^[1-9A-HJ-NP-Za-km-z]{32,44}$/ regex
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const WSOL_MINT = 'So11111111111111111111111111111111111111112'
const USDT_MINT = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

// Reusable base CPMM pool config built from valid addresses
const VALID_CPMM_POOL_CONFIG = {
  poolType: 'CPMM' as const,
  tokenA: USDC_MINT,
  tokenB: WSOL_MINT,
  feeTier: '0.05' as const,
  initialLiquidity: {
    amountA: '1000',
    amountB: '0.5',
  },
}

// Minimal valid CPMM request
const VALID_CPMM_REQUEST = {
  walletAddress: USDC_MINT,
  poolConfig: VALID_CPMM_POOL_CONFIG,
}

// ---------------------------------------------------------------------------
// solanaAddressSchema
// ---------------------------------------------------------------------------

describe('solanaAddressSchema', () => {
  it('should accept a valid base58 Solana address', () => {
    expect(() => solanaAddressSchema.parse(USDC_MINT)).not.toThrow()
  })

  it('should accept wrapped SOL address', () => {
    const result = solanaAddressSchema.safeParse(WSOL_MINT)
    expect(result.success).toBe(true)
  })

  it('should reject an empty string', () => {
    const result = solanaAddressSchema.safeParse('')
    expect(result.success).toBe(false)
  })

  it('should reject an address with invalid base58 characters (contains 0)', () => {
    // '0' (zero) is not in the base58 alphabet
    const result = solanaAddressSchema.safeParse('invalid0Address000000000000000000000000000')
    expect(result.success).toBe(false)
  })

  it('should reject an address that is too short', () => {
    const result = solanaAddressSchema.safeParse('short')
    expect(result.success).toBe(false)
  })

  it('SOLANA_ADDRESS_REGEX should match a real USDC mint address', () => {
    expect(SOLANA_ADDRESS_REGEX.test(USDC_MINT)).toBe(true)
  })

  it('SOLANA_ADDRESS_REGEX should match a real wSOL mint address', () => {
    expect(SOLANA_ADDRESS_REGEX.test(WSOL_MINT)).toBe(true)
  })

  it('SOLANA_ADDRESS_REGEX should not match a plaintext string with dashes', () => {
    expect(SOLANA_ADDRESS_REGEX.test('not-a-real-address')).toBe(false)
  })

  it('SOLANA_ADDRESS_REGEX should not match an empty string', () => {
    expect(SOLANA_ADDRESS_REGEX.test('')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// liquidityProviderRequestSchema — valid requests
// ---------------------------------------------------------------------------

describe('liquidityProviderRequestSchema', () => {
  it('should validate valid CPMM request', () => {
    const result = liquidityProviderRequestSchema.safeParse(VALID_CPMM_REQUEST)
    expect(result.success).toBe(true)
  })

  it('should validate valid CLMM request with price range', () => {
    const validCLMMRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        poolType: 'CLMM' as const,
        tokenA: USDC_MINT,
        tokenB: USDT_MINT,
        feeTier: '0.01' as const,
        initialLiquidity: {
          amountA: '1000',
          amountB: '500',
        },
        priceRange: {
          minPrice: '0.01',
          maxPrice: '10.0',
        },
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(validCLMMRequest)
    expect(result.success).toBe(true)
  })

  it('should accept optional platformFee', () => {
    const request = {
      ...VALID_CPMM_REQUEST,
      platformFee: '0.25',
    }

    const result = liquidityProviderRequestSchema.safeParse(request)
    expect(result.success).toBe(true)
  })

  it('should accept request without platformFee', () => {
    const result = liquidityProviderRequestSchema.safeParse(VALID_CPMM_REQUEST)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.platformFee).toBeUndefined()
    }
  })

  it('should accept all valid fee tiers for CPMM', () => {
    const feeTiers = ['0.01', '0.05', '0.25', '1.00'] as const

    feeTiers.forEach((feeTier) => {
      const request = {
        walletAddress: USDC_MINT,
        poolConfig: {
          ...VALID_CPMM_POOL_CONFIG,
          feeTier,
        },
      }
      const result = liquidityProviderRequestSchema.safeParse(request)
      expect(result.success, `fee tier ${feeTier} should be valid`).toBe(true)
    })
  })

  it('should return parsed data with correct shape on success', () => {
    const result = liquidityProviderRequestSchema.safeParse(VALID_CPMM_REQUEST)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.walletAddress).toBe(USDC_MINT)
      expect(result.data.poolConfig.poolType).toBe('CPMM')
      expect(result.data.poolConfig.feeTier).toBe('0.05')
    }
  })

  // -------------------------------------------------------------------------
  // Invalid requests — wallet / token addresses
  // -------------------------------------------------------------------------

  it('should reject invalid wallet address', () => {
    const invalidRequest = {
      ...VALID_CPMM_REQUEST,
      walletAddress: 'invalid-address',
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject empty wallet address', () => {
    const invalidRequest = {
      ...VALID_CPMM_REQUEST,
      walletAddress: '',
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject wallet address with invalid base58 characters', () => {
    const invalidRequest = {
      ...VALID_CPMM_REQUEST,
      walletAddress: 'invalid0Address000000000000000000000000000',
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject invalid tokenA address', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        ...VALID_CPMM_POOL_CONFIG,
        tokenA: 'not-a-valid-token',
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject invalid tokenB address', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        ...VALID_CPMM_POOL_CONFIG,
        tokenB: 'not-a-valid-token',
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Invalid requests — pool type
  // -------------------------------------------------------------------------

  it('should reject invalid pool type', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        ...VALID_CPMM_POOL_CONFIG,
        poolType: 'INVALID_POOL_TYPE',
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject lowercase pool type', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        ...VALID_CPMM_POOL_CONFIG,
        poolType: 'cpmm',
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Invalid requests — CLMM without priceRange (superRefine)
  // -------------------------------------------------------------------------

  it('should reject CLMM without price range', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        poolType: 'CLMM',
        tokenA: USDC_MINT,
        tokenB: USDT_MINT,
        feeTier: '0.01',
        initialLiquidity: {
          amountA: '1000',
          amountB: '500',
        },
        // priceRange intentionally omitted
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject CLMM with zero minPrice in priceRange', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        poolType: 'CLMM',
        tokenA: USDC_MINT,
        tokenB: USDT_MINT,
        feeTier: '0.01',
        initialLiquidity: {
          amountA: '1000',
          amountB: '500',
        },
        priceRange: {
          minPrice: '0',
          maxPrice: '10.0',
        },
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject CLMM with negative minPrice in priceRange', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        poolType: 'CLMM',
        tokenA: USDC_MINT,
        tokenB: USDT_MINT,
        feeTier: '0.01',
        initialLiquidity: {
          amountA: '1000',
          amountB: '500',
        },
        priceRange: {
          minPrice: '-1',
          maxPrice: '10.0',
        },
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Invalid requests — fee tier
  // -------------------------------------------------------------------------

  it('should reject an unsupported fee tier', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        ...VALID_CPMM_POOL_CONFIG,
        feeTier: '0.03',
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject a numeric fee tier value', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        ...VALID_CPMM_POOL_CONFIG,
        feeTier: 0.05,
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  // -------------------------------------------------------------------------
  // Invalid requests — liquidity amounts
  // -------------------------------------------------------------------------

  it('should reject zero amountA', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        ...VALID_CPMM_POOL_CONFIG,
        initialLiquidity: {
          amountA: '0',
          amountB: '0.5',
        },
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject negative amountB', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        ...VALID_CPMM_POOL_CONFIG,
        initialLiquidity: {
          amountA: '1000',
          amountB: '-5',
        },
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject non-numeric amountA string', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        ...VALID_CPMM_POOL_CONFIG,
        initialLiquidity: {
          amountA: 'abc',
          amountB: '0.5',
        },
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject empty amountA string', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        ...VALID_CPMM_POOL_CONFIG,
        initialLiquidity: {
          amountA: '',
          amountB: '0.5',
        },
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })

  it('should reject missing initialLiquidity entirely', () => {
    const invalidRequest = {
      walletAddress: USDC_MINT,
      poolConfig: {
        poolType: 'CPMM',
        tokenA: USDC_MINT,
        tokenB: WSOL_MINT,
        feeTier: '0.05',
        // initialLiquidity intentionally omitted
      },
    }

    const result = liquidityProviderRequestSchema.safeParse(invalidRequest)
    expect(result.success).toBe(false)
  })
})
