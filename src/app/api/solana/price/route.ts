import { z } from 'zod'
import { createApiRoute } from '@/lib/api'
import { getCachedSolanaPrice } from '@/lib/solana/server-side/priceCache'
import { AppError } from '@/lib/errors'

/**
 * GET /api/solana/price
 *
 * Returns cached Solana price
 */
export const GET = createApiRoute({
  name: 'solana/price',
  schema: z.object({}), // No input for GET
  method: 'GET',
  handler: async () => {
    const price = await getCachedSolanaPrice()

    if (price <= 0) {
      throw new AppError('SERVICE_UNAVAILABLE', 'Price data temporarily unavailable', 503)
    }

    return { price }
  },
})
