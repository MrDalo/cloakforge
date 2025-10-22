import { NextRequest } from 'next/server'
import { z } from 'zod'
import { PublicKey } from '@solana/web3.js'
import { AppError } from '@/lib/errors'
import { createApiRoute } from './createApiRoute'

/**
 * Configuration for Solana-specific API routes
 */
interface SolanaApiRouteConfig<TInput, TOutput> {
  /** Route name for logging (e.g., 'burn-tokens', 'token-creator') */
  name: string

  /** Zod schema for input validation */
  schema: z.ZodSchema<TInput>

  /** Handler function with validated Solana addresses */
  handler: (data: TInput & { walletPublicKey: PublicKey }, request: NextRequest) => Promise<TOutput>

  /** Additional address fields to validate (besides walletAddress) */
  additionalAddressFields?: (keyof TInput)[]
}

/**
 * Creates a Solana-specific API route with automatic PublicKey validation
 *
 * This wrapper extends createApiRoute with Solana-specific validation:
 * - Validates wallet address format
 * - Converts string addresses to PublicKey instances
 * - Validates additional Solana addresses if specified
 *
 * @example
 * ```typescript
 * export const POST = createSolanaApiRoute({
 *   name: 'burn-tokens',
 *   schema: burnTokensRequestSchema,
 *   additionalAddressFields: ['tokenAccountAddress', 'mintAddress'],
 *   handler: async (data) => {
 *     // data.walletPublicKey is already a PublicKey instance
 *     return await burnToken(data)
 *   }
 * })
 * ```
 */
export function createSolanaApiRoute<TInput extends { walletAddress: string }, TOutput>(
  config: SolanaApiRouteConfig<TInput, TOutput>
): ReturnType<typeof createApiRoute<TInput, TOutput>> {
  const { name, schema, handler, additionalAddressFields = [] } = config

  return createApiRoute<TInput, TOutput>({
    name,
    schema,
    handler: async (data, request) => {
      // Validate wallet address
      let walletPublicKey: PublicKey
      try {
        walletPublicKey = new PublicKey(data.walletAddress)
      } catch {
        throw new AppError('INVALID_WALLET_ADDRESS', 'Invalid wallet address format', 400)
      }

      // Validate additional address fields
      for (const field of additionalAddressFields) {
        const address = data[field]
        if (typeof address === 'string') {
          try {
            new PublicKey(address)
          } catch {
            throw new AppError('INVALID_WALLET_ADDRESS', `Invalid address format for ${String(field)}`, 400)
          }
        }
      }

      // Call handler with validated PublicKey
      return await handler({ ...data, walletPublicKey }, request)
    },
  })
}
