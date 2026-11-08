import type { LiquidityProviderParams, LiquidityProviderRequest, LiquidityProviderResponse } from '@/types/liquidityProvider'

// Realistic Solana mint addresses used across tests
export const MOCK_ADDRESSES = {
  wallet: 'TestWallet111111111111111111111111111111111',
  tokenA_USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokenB_SOL: 'So11111111111111111111111111111111111111112',
  tokenB_USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  tokenB_USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  pool: 'PoolKey111111111111111111111111111111111111',
} as const

/**
 * Valid CPMM form parameters matching LiquidityProviderParams shape.
 */
export const mockLiquidityProviderParams: LiquidityProviderParams = {
  poolType: 'CPMM',
  tokenA: MOCK_ADDRESSES.tokenA_USDC,
  tokenB: 'SOL',
  amountA: '1000',
  amountB: '0.5',
  feeTier: '0.25',
  slippageTolerance: '0.5',
}

/**
 * Valid CLMM form parameters with price range and initial price.
 */
export const mockLiquidityProviderParamsCLMM: LiquidityProviderParams = {
  poolType: 'CLMM',
  tokenA: MOCK_ADDRESSES.tokenA_USDC,
  tokenB: 'USDT',
  amountA: '1000',
  amountB: '500',
  feeTier: '0.01',
  slippageTolerance: '0.5',
  minPrice: '0.01',
  maxPrice: '10.00',
  initialPrice: '1.00',
}

/**
 * Valid CPMM API request body matching LiquidityProviderRequest shape.
 */
export const mockLiquidityProviderRequest: LiquidityProviderRequest = {
  walletAddress: MOCK_ADDRESSES.wallet,
  poolConfig: {
    poolType: 'CPMM',
    tokenA: MOCK_ADDRESSES.tokenA_USDC,
    tokenB: MOCK_ADDRESSES.tokenB_SOL,
    feeTier: '0.25',
    initialLiquidity: {
      amountA: '1000',
      amountB: '0.5',
    },
  },
}

/**
 * Valid CLMM API request body with price range.
 */
export const mockLiquidityProviderRequestCLMM: LiquidityProviderRequest = {
  walletAddress: MOCK_ADDRESSES.wallet,
  poolConfig: {
    poolType: 'CLMM',
    tokenA: MOCK_ADDRESSES.tokenA_USDC,
    tokenB: MOCK_ADDRESSES.tokenB_USDT,
    feeTier: '0.01',
    initialLiquidity: {
      amountA: '1000',
      amountB: '500',
    },
    priceRange: {
      minPrice: '0.01',
      maxPrice: '10.00',
    },
    initialPrice: '1.00',
  },
}

/**
 * Mock successful API response matching LiquidityProviderResponse shape.
 * Uses a minimal but valid base64-encoded transaction placeholder.
 */
export const mockLiquidityProviderResponse: LiquidityProviderResponse = {
  serializedTransaction:
    'AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQABAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==',
  poolPublicKey: MOCK_ADDRESSES.pool,
  estimatedCosts: {
    poolCreation: 0.02039,
    platformFee: 0.1,
    networkFee: 0.000005,
  },
  message: 'Pool creation transaction prepared successfully',
}

/**
 * Pre-built form data objects keyed by pool type for use in form tests.
 */
export const mockFormData = {
  cpmm: {
    poolType: 'CPMM' as const,
    tokenA: MOCK_ADDRESSES.tokenA_USDC,
    tokenB: 'SOL' as const,
    amountA: '1000',
    amountB: '0.5',
    feeTier: '0.25' as const,
    slippageTolerance: '0.5',
  },
  clmm: {
    poolType: 'CLMM' as const,
    tokenA: MOCK_ADDRESSES.tokenA_USDC,
    tokenB: 'USDT' as const,
    amountA: '1000',
    amountB: '500',
    feeTier: '0.01' as const,
    slippageTolerance: '0.5',
    minPrice: '0.01',
    maxPrice: '10.00',
    initialPrice: '1.00',
  },
  customToken: {
    poolType: 'CPMM' as const,
    tokenA: MOCK_ADDRESSES.tokenA_USDC,
    tokenB: 'custom' as const,
    customTokenB: MOCK_ADDRESSES.tokenB_USDT,
    amountA: '1000',
    amountB: '500',
    feeTier: '0.25' as const,
    slippageTolerance: '0.5',
  },
}
