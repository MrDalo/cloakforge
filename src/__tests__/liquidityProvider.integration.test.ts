/**
 * Liquidity Provider Integration Tests
 *
 * Comprehensive integration tests for the liquidity provider tool,
 * covering the complete flow from form validation to API integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LiquidityProviderFormSchema } from '@/components/pages/LiquidityProviderPage/LiquidityProviderForm/liquidityProviderFormSchema'
import { liquidityProviderRequestSchema } from '@/lib/schemas/apiSchemas'
import { TOKEN_B_MINT_ADDRESSES, resolveTokenBAddress, buildLiquidityRequest } from '@/hooks/solana/useLiquidityProvider'

// Test constants
const VALID_WALLET = 'So11111111111111111111111111111111111111112'
const VALID_TOKEN_A = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

describe('Liquidity Provider Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Schema Validation', () => {
    it('should validate complete CPMM form data', () => {
      const validCPMMData = {
        poolType: 'CPMM' as const,
        tokenA: VALID_TOKEN_A,
        tokenB: 'SOL' as const,
        amountA: '1000',
        amountB: '0.5',
        feeTier: '0.05' as const,
        slippageTolerance: '0.5',
        deadline: '20',
        platformFee: '0.1',
      }

      const result = LiquidityProviderFormSchema.safeParse(validCPMMData)
      expect(result.success).toBe(true)
    })

    it('should validate complete CLMM form data with price range', () => {
      const validCLMMData = {
        poolType: 'CLMM' as const,
        tokenA: VALID_TOKEN_A,
        tokenB: 'USDC' as const,
        amountA: '1000',
        amountB: '500',
        feeTier: '0.01' as const,
        slippageTolerance: '0.5',
        minPrice: '0.01',
        maxPrice: '10.00',
        deadline: '20',
        platformFee: '0.1',
      }

      const result = LiquidityProviderFormSchema.safeParse(validCLMMData)
      expect(result.success).toBe(true)
    })

    it('should validate custom token B configuration', () => {
      const customTokenData = {
        poolType: 'CPMM' as const,
        tokenA: VALID_TOKEN_A,
        tokenB: 'custom' as const,
        customTokenB: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        amountA: '1000',
        amountB: '500',
        feeTier: '0.25' as const,
        slippageTolerance: '0.5',
        deadline: '20',
        platformFee: '0.1',
      }

      const result = LiquidityProviderFormSchema.safeParse(customTokenData)
      expect(result.success).toBe(true)
    })
  })

  describe('Token Resolution Logic', () => {
    it('should resolve all preset Token B options', () => {
      expect(resolveTokenBAddress('SOL')).toBe(TOKEN_B_MINT_ADDRESSES.SOL)
      expect(resolveTokenBAddress('USDC')).toBe(TOKEN_B_MINT_ADDRESSES.USDC)
      expect(resolveTokenBAddress('USDT')).toBe(TOKEN_B_MINT_ADDRESSES.USDT)
    })

    it('should resolve custom token B address', () => {
      const customAddress = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
      expect(resolveTokenBAddress('custom', customAddress)).toBe(customAddress)
    })

    it('should return null for custom without address', () => {
      expect(resolveTokenBAddress('custom')).toBeNull()
    })
  })

  describe('API Request Building', () => {
    it('should build correct CPMM API request', () => {
      const formData = {
        poolType: 'CPMM' as const,
        tokenA: VALID_TOKEN_A,
        tokenB: 'SOL' as const,
        amountA: '1000',
        amountB: '0.5',
        feeTier: '0.05' as const,
        slippageTolerance: '0.5',
        deadline: '20',
        platformFee: '0.1',
      }

      const request = buildLiquidityRequest(formData, VALID_WALLET, TOKEN_B_MINT_ADDRESSES.SOL)

      expect(request).toEqual({
        walletAddress: VALID_WALLET,
        poolConfig: {
          poolType: 'CPMM',
          tokenA: VALID_TOKEN_A,
          tokenB: TOKEN_B_MINT_ADDRESSES.SOL,
          feeTier: '0.05',
          initialLiquidity: {
            amountA: '1000',
            amountB: '0.5',
          },
        },
        platformFee: '0.1',
      })

      // Verify API schema validation
      const validation = liquidityProviderRequestSchema.safeParse(request)
      expect(validation.success).toBe(true)
    })

    it('should build correct CLMM API request with price range', () => {
      const formData = {
        poolType: 'CLMM' as const,
        tokenA: VALID_TOKEN_A,
        tokenB: 'USDC' as const,
        amountA: '1000',
        amountB: '500',
        feeTier: '0.01' as const,
        slippageTolerance: '0.5',
        minPrice: '0.01',
        maxPrice: '10.00',
        deadline: '20',
        platformFee: '0.1',
      }

      const request = buildLiquidityRequest(formData, VALID_WALLET, TOKEN_B_MINT_ADDRESSES.USDC)

      expect(request).toEqual({
        walletAddress: VALID_WALLET,
        poolConfig: {
          poolType: 'CLMM',
          tokenA: VALID_TOKEN_A,
          tokenB: TOKEN_B_MINT_ADDRESSES.USDC,
          feeTier: '0.01',
          initialLiquidity: {
            amountA: '1000',
            amountB: '500',
          },
          priceRange: {
            minPrice: '0.01',
            maxPrice: '10.00',
          },
        },
        platformFee: '0.1',
      })

      // Verify API schema validation
      const validation = liquidityProviderRequestSchema.safeParse(request)
      expect(validation.success).toBe(true)
    })
  })

  describe('Component Exports Integration', () => {
    it('should have all required page components available', async () => {
      const pageIndex = await import('@/components/pages/LiquidityProviderPage')

      expect(pageIndex.HeroSection).toBeDefined()
      expect(pageIndex.LiquidityProviderForm).toBeDefined()
      expect(pageIndex.FAQSection).toBeDefined()
      expect(pageIndex.liquidityProviderBenefitsConfig).toBeDefined()
      expect(pageIndex.features).toBeDefined()
      expect(pageIndex.benefits).toBeDefined()
    })

    it('should have properly configured benefits section', async () => {
      const { liquidityProviderBenefitsConfig } = await import('@/components/pages/LiquidityProviderPage')

      expect(liquidityProviderBenefitsConfig.title).toBe('Liquidity Provider')
      expect(liquidityProviderBenefitsConfig.valueProps).toHaveLength(5)
      expect(liquidityProviderBenefitsConfig.cta).toBeDefined()
      expect(liquidityProviderBenefitsConfig.colorScheme).toBeDefined()
      expect(liquidityProviderBenefitsConfig.colorScheme.primary).toBe('text-emerald-600')
    })

    it('should have comprehensive FAQ data', async () => {
      const { liquidityProviderFAQ } = await import('@/components/pages/LiquidityProviderPage/FAQSection/faqData')

      expect(liquidityProviderFAQ).toHaveLength(11)
      expect(liquidityProviderFAQ[3].question).toContain('difference between CPMM and CLMM')
      expect(liquidityProviderFAQ[4].question).toContain('fee tier')
      expect(liquidityProviderFAQ[6].question).toContain('Can I create a pool for a token that already has a pool?')
    })
  })

  describe('Data Consistency', () => {
    it('should have consistent token B addresses', () => {
      expect(TOKEN_B_MINT_ADDRESSES.SOL).toBe('So11111111111111111111111111111111111111112')
      expect(TOKEN_B_MINT_ADDRESSES.USDC).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
      expect(TOKEN_B_MINT_ADDRESSES.USDT).toBe('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')
    })

    it('should have consistent fee tier options', () => {
      const feeTiers = ['0.01', '0.05', '0.25', '1.00']

      feeTiers.forEach((tier) => {
        const formValidation = LiquidityProviderFormSchema.shape.feeTier.safeParse(tier)
        expect(formValidation.success).toBe(true)

        const apiValidation = liquidityProviderRequestSchema.shape.poolConfig.shape.feeTier.safeParse(tier)
        expect(apiValidation.success).toBe(true)
      })
    })
  })
})
