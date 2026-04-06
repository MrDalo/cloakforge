export interface LiquidityProviderParams {
  // Pool Type
  poolType: 'CPMM' | 'CLMM'

  // Token Configuration
  tokenA: string
  tokenB: 'SOL' | 'USDC' | 'USDT' | 'custom'
  customTokenB?: string

  // Liquidity Amounts
  amountA: string
  amountB: string

  // Pool Configuration
  feeTier: '0.01' | '0.05' | '0.25' | '1.00'
  slippageTolerance: string

  // CLMM-specific
  minPrice?: string
  maxPrice?: string

  // Advanced
  deadline: string
  platformFee: string
}

export interface LiquidityProviderResult {
  poolAddress: string
  signature: string
  poolType: 'CPMM' | 'CLMM'
  tokenPair: string
  message: string
}

export interface LiquidityProviderRequest {
  walletAddress: string
  poolConfig: {
    poolType: 'CPMM' | 'CLMM'
    tokenA: string
    tokenB: string
    feeTier: string
    initialLiquidity: {
      amountA: string
      amountB: string
    }
    priceRange?: {
      minPrice: string
      maxPrice: string
    }
  }
  platformFee?: string
}

export interface LiquidityProviderResponse {
  serializedTransaction: string
  poolPublicKey: string
  estimatedCosts: {
    poolCreation: number
    platformFee: number
    networkFee: number
  }
  message: string
}
