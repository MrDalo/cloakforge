/** Preset token options for Token B selection in the UI form */
export type TokenBOption = 'SOL' | 'USDC' | 'USDT' | 'custom'

/** Pool type — CPMM (constant-product) or CLMM (concentrated liquidity) */
export type PoolType = 'CPMM' | 'CLMM'

/** Fee tier options expressed as percentage strings */
export type FeeTier = '0.01' | '0.05' | '0.25' | '1.00'

/**
 * Client-side form params for the liquidity provider tool.
 * `tokenB` uses a constrained union; when set to `'custom'`, the resolved
 * mint address must be supplied via `customTokenB`.
 */
export interface LiquidityProviderParams {
  // Pool Type
  poolType: PoolType

  // Token Configuration
  tokenA: string
  tokenB: TokenBOption
  customTokenB?: string

  // Liquidity Amounts
  amountA: string
  amountB: string

  // Pool Configuration
  feeTier: FeeTier
  slippageTolerance: string

  // CLMM-specific
  minPrice?: string
  maxPrice?: string

  // Advanced
  deadline: string
}

/** Result returned to the client after a successful liquidity provision */
export interface LiquidityProviderResult {
  poolAddress: string
  signature: string
  /** CLMM only: signature of the second (position-opening) transaction */
  positionSignature?: string
  /** CLMM only: mint address of the NFT representing the LP position */
  positionNftMint?: string
  poolType: PoolType
  tokenPair: string
  message: string
}

/**
 * API request body sent to the server for transaction preparation.
 * Both `tokenA` and `tokenB` are fully-resolved Solana mint addresses —
 * the `custom` / preset selection from the form is resolved on the client
 * before this request is constructed.
 */
export interface LiquidityProviderRequest {
  walletAddress: string
  poolConfig: {
    poolType: PoolType
    /** Resolved mint address of Token A */
    tokenA: string
    /** Resolved mint address of Token B (SOL, USDC, USDT, or a custom mint) */
    tokenB: string
    feeTier: FeeTier
    initialLiquidity: {
      amountA: string
      amountB: string
    }
    priceRange?: {
      minPrice: string
      maxPrice: string
    }
  }
}

/** API response payload containing the unsigned pool-creation transaction */
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

/**
 * Request body for opening a CLMM position (POST /api/solana/liquidity-provider/open-position).
 * Only used for CLMM — CPMM deposits liquidity atomically during pool creation
 * and never needs this second step. Called only after the pool-creation
 * transaction from the main endpoint has been confirmed on-chain, since a
 * position can't be opened in a pool that doesn't exist yet.
 */
export interface OpenPositionRequest {
  walletAddress: string
  /** The CLMM pool's on-chain address, confirmed by the caller before this request */
  poolId: string
  poolConfig: LiquidityProviderRequest['poolConfig']
}

/** API response payload for the position-opening transaction */
export interface OpenPositionResponse {
  serializedTransaction: string
  /** Mint address of the position NFT, pre-derived server-side */
  positionNftMint: string
  estimatedCosts: {
    /** Cost of opening the LP position (NFT mint + tick arrays) */
    positionOpening: number
  }
  message: string
}
