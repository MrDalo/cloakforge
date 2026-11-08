import { createSolanaApiRoute } from '@/lib/api'
import { liquidityProviderRequestSchema } from '@/lib/schemas/apiSchemas'
import { createRaydiumPoolTransaction } from '@/lib/solana/server-side/createRaydiumPool'
import type { LiquidityProviderResponse } from '@/types/liquidityProvider'

/**
 * POST /api/solana/liquidity-provider
 *
 * Prepares the unsigned pool-creation transaction (CPMM or CLMM) for client-side
 * signing. It also carries the platform fee transfer and, with a coupon, the coupon
 * memo + marker transfer, so the fee is paid only if the pool is created. CPMM
 * deposits liquidity in the same transaction; CLMM deposits it in a follow-up
 * position transaction (POST /api/solana/liquidity-provider/open-position).
 *
 * Request body: { walletAddress, couponCode?, poolConfig: { poolType, tokenA, tokenB,
 *   feeTier, initialLiquidity, priceRange?, initialPrice? } } — priceRange and
 *   initialPrice are required for CLMM.
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
      couponCode: data.couponCode,
    })

    return {
      serializedTransaction: result.serializedTransaction,
      poolPublicKey: result.poolPublicKey,
      estimatedCosts: result.estimatedCosts,
      message: result.message,
    }
  },
})
