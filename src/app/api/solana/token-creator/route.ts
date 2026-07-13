import 'server-only'

import { createSolanaApiRoute } from '@/lib/api'
import { tokenCreatorRequestSchema } from '@/lib/schemas/apiSchemas'
import { PublicKey } from '@solana/web3.js'
import type { UnsignedTokenCreationResponse } from '@/types/api'
import { createTokenCreationTransaction } from '@/lib/solana/server-side/createTokenCreationTransaction'

/**
 * POST /api/solana/token-creator
 *
 * Prepares unsigned token creation transaction for client-side signing.
 * Client handles IPFS uploads and metadata creation for better performance.
 */
export const POST = createSolanaApiRoute({
  name: 'solana/token-creator',
  schema: tokenCreatorRequestSchema,
  handler: async (data) => {
    // Use client-provided metadata URI
    const metadataUri = data.metadata?.metadataUri

    // Create transaction
    const result = await createTokenCreationTransaction({
      walletPublicKey: data.walletPublicKey,
      mintPublicKey: new PublicKey(data.mintPublicKey),
      tokenData: data.tokenData,
      metadataUri,
      couponCode: data.couponCode,
    })

    // Return response
    const response: UnsignedTokenCreationResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize({ requireAllSignatures: false })).toString('base64'),
      mintPublicKey: result.mintPublicKey,
      message: `Token creation transaction prepared successfully. Mint: ${result.mintPublicKey}`,
    }

    return response
  },
})
