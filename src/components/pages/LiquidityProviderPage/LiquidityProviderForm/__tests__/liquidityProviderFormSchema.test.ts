import { describe, it, expect } from 'vitest'
import { LiquidityProviderFormSchema } from '../liquidityProviderFormSchema'

const VALID_ADDRESS_A = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const VALID_ADDRESS_B = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

describe('LiquidityProviderFormSchema', () => {
  it('should validate complete form data', () => {
    const validData = {
      poolType: 'CPMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'SOL',
      amountA: '1000',
      amountB: '0.5',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(validData)).not.toThrow()
  })

  it('should validate CLMM with price range', () => {
    const validData = {
      poolType: 'CLMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'USDC',
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      minPrice: '1.5',
      maxPrice: '2.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(validData)).not.toThrow()
  })

  it('should validate custom token B', () => {
    const validData = {
      poolType: 'CPMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'custom',
      customTokenB: VALID_ADDRESS_B,
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(validData)).not.toThrow()
  })

  it('should require customTokenB when tokenB is custom', () => {
    const invalidData = {
      poolType: 'CPMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'custom',
      // Missing customTokenB
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  it('should reject invalid fee tier', () => {
    const invalidData = {
      poolType: 'CPMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'SOL',
      amountA: '1000',
      amountB: '0.5',
      feeTier: '0.99', // Invalid fee tier
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  // Address validation tests
  it('should reject invalid tokenA address', () => {
    const invalidData = {
      poolType: 'CPMM',
      tokenA: 'not-a-valid-solana-address',
      tokenB: 'SOL',
      amountA: '1000',
      amountB: '0.5',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  it('should reject empty tokenA address', () => {
    const invalidData = {
      poolType: 'CPMM',
      tokenA: '',
      tokenB: 'SOL',
      amountA: '1000',
      amountB: '0.5',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  it('should reject invalid customTokenB address format', () => {
    const invalidData = {
      poolType: 'CPMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'custom',
      customTokenB: 'not-a-valid-address',
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  // Amount validation tests
  it('should reject zero amountA', () => {
    const invalidData = {
      poolType: 'CPMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'SOL',
      amountA: '0',
      amountB: '0.5',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  it('should reject negative amountB', () => {
    const invalidData = {
      poolType: 'CPMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'SOL',
      amountA: '1000',
      amountB: '-5',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  it('should reject non-numeric amountA', () => {
    const invalidData = {
      poolType: 'CPMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'SOL',
      amountA: 'abc',
      amountB: '0.5',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  // CLMM price range requirement tests
  it('should reject CLMM pool without minPrice', () => {
    const invalidData = {
      poolType: 'CLMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'USDC',
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      maxPrice: '2.5',
      // Missing minPrice
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  it('should reject CLMM pool without maxPrice', () => {
    const invalidData = {
      poolType: 'CLMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'USDC',
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      minPrice: '1.5',
      // Missing maxPrice
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  it('should reject CLMM pool without any price range', () => {
    const invalidData = {
      poolType: 'CLMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'USDC',
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  it('should reject CLMM pool where minPrice is greater than maxPrice', () => {
    const invalidData = {
      poolType: 'CLMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'USDC',
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      minPrice: '3.0',
      maxPrice: '1.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  it('should allow CPMM pool without price range', () => {
    const validData = {
      poolType: 'CPMM',
      tokenA: VALID_ADDRESS_A,
      tokenB: 'SOL',
      amountA: '1000',
      amountB: '0.5',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
    }

    expect(() => LiquidityProviderFormSchema.parse(validData)).not.toThrow()
  })
})
