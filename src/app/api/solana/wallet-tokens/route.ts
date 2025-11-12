/**
 * API Route: Wallet Tokens
 *
 * Server-side endpoint to fetch wallet tokens with metadata using private RPC.
 * Supports tool-specific filtering to minimize data transfer and improve performance.
 */

import { z } from 'zod'
import { createSolanaApiRoute } from '@/lib/api'
import { shouldIncludeAuthorities } from '@/lib/utils/toolHelpers'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'
import {
  getWalletTokensWithMetadataServer,
  type ServerWalletTokensResult,
  type ServerToolType,
} from '@/lib/solana/server-side/getWalletTokensServer'

// Request/Response schemas
const walletTokensRequestSchema = z.object({
  walletAddress: solanaAddressSchema,
  toolType: z
    .enum([
      'burn-tokens',
      'revoke-mint-authority',
      'revoke-freeze-authority',
      'freeze-accounts',
      'unfreeze-accounts',
      'create-liquidity',
      'token-creator',
      'token-auditor',
      'transaction-multisender',
      'all',
      'default',
    ])
    .optional()
    .default('all'),
  nonZeroOnly: z.boolean().optional().default(true),
  includeToken2022: z.boolean().optional().default(true),
  includeAuthorities: z.boolean().optional().default(false),
  includeImages: z.boolean().optional().default(false),
  commitment: z.enum(['finalized', 'confirmed', 'processed']).optional().default('confirmed'),
})

export type WalletTokensRequest = z.infer<typeof walletTokensRequestSchema>

export interface WalletTokensResponse {
  tokens: ServerWalletTokensResult
}

/**
 * POST /api/solana/wallet-tokens
 *
 * Fetches wallet tokens with metadata using server-side private RPC
 */
export const POST = createSolanaApiRoute({
  name: 'solana/wallet-tokens',
  schema: walletTokensRequestSchema,
  handler: async (data) => {
    const { toolType, nonZeroOnly, includeToken2022, includeAuthorities, includeImages, commitment } = data

    // Determine if we need authorities based on tool type
    const needsAuthorities = includeAuthorities || shouldIncludeAuthorities(toolType)

    // Fetch wallet tokens using server-side utility
    const tokens = await getWalletTokensWithMetadataServer(data.walletAddress, {
      toolType: toolType as ServerToolType,
      nonZeroOnly,
      includeToken2022,
      includeAuthorities: needsAuthorities,
      includeImages,
      commitment,
    })

    return { tokens }
  },
})
