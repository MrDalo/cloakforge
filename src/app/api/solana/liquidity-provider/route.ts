import { createSolanaApiRoute } from '@/lib/api'
import { liquidityProviderRequestSchema } from '@/lib/schemas/apiSchemas'
import { createRaydiumPoolTransaction } from '@/lib/solana/server-side/createRaydiumPool'
import type { LiquidityProviderResponse } from '@/types/liquidityProvider'

/**
 * POST /api/solana/liquidity-provider
 *
 * Creates a Raydium liquidity pool (CPMM or CLMM) and returns an unsigned
 * serialized transaction for client-side signing.
 *
 * Request body: { walletAddress, poolConfig: { poolType, tokenA, tokenB, feeTier,
 *   initialLiquidity, priceRange? } }
 *
 * Response: LiquidityProviderResponse wrapped in ApiResponseBase envelope
 */
export const POST = createSolanaApiRoute({
  name: 'solana/liquidity-provider',
  schema: liquidityProviderRequestSchema,
  handler: async (data): Promise<LiquidityProviderResponse> => {
    const result = await createRaydiumPoolTransaction({
      walletPublicKey: data.walletPublicKey,
      poolConfig: data.poolConfig,
    })

    return {
      serializedTransaction: result.serializedTransaction,
      poolPublicKey: result.poolPublicKey,
      estimatedCosts: result.estimatedCosts,
      message: result.message,
    }
  },
})
