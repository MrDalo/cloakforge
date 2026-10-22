import { createSolanaApiRoute } from '@/lib/api'
import { openPositionRequestSchema } from '@/lib/schemas/apiSchemas'
import { createRaydiumPositionTransaction } from '@/lib/solana/server-side/createRaydiumPool'
import type { OpenPositionResponse } from '@/types/liquidityProvider'

/**
 * POST /api/solana/liquidity-provider/open-position
 *
 * Opens a CLMM position — mints the position NFT and deposits liquidity into
 * the requested price range. Must be called AFTER the pool-creation
 * transaction from POST /api/solana/liquidity-provider has been confirmed
 * on-chain; the pool referenced by `poolId` must already exist.
 *
 * Request body: { walletAddress, poolId, poolConfig: { poolType: 'CLMM', tokenA,
 *   tokenB, feeTier, initialLiquidity, priceRange } }
 *
 * Response: OpenPositionResponse wrapped in ApiResponseBase envelope
 */
export const POST = createSolanaApiRoute({
  name: 'solana/liquidity-provider/open-position',
  toolId: 'liquidity-provider', // Follow-up step of the liquidity-provider tool (shares its kill switch)
  schema: openPositionRequestSchema,
  handler: async (data): Promise<OpenPositionResponse> => {
    const result = await createRaydiumPositionTransaction({
      walletPublicKey: data.walletPublicKey,
      poolId: data.poolId,
      poolConfig: data.poolConfig,
    })

    return {
      serializedTransaction: result.serializedTransaction,
      positionNftMint: result.positionNftMint,
      estimatedCosts: result.estimatedCosts,
      message: result.message,
    }
  },
})
