import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { createSolanaApiRoute } from '@/lib/api'
import { revokeMetadataAuthorityRequestSchema } from '@/lib/schemas/apiSchemas'
import { createRevokeMetadataAuthorityTransaction } from '@/lib/solana/server-side/createRevokeMetadataAuthorityTransaction'

interface UnsignedRevokeMetadataAuthorityResponse {
  serializedTransaction: string
  message: string
}

/**
 * POST /api/solana/revoke-metadata-authority
 *
 * Prepares unsigned revoke metadata authority transaction
 */
export const POST = createSolanaApiRoute({
  name: 'solana/revoke-metadata-authority',
  schema: revokeMetadataAuthorityRequestSchema,
  additionalAddressFields: ['tokenAddress'],
  handler: async (data) => {
    // Create transaction
    const result = await createRevokeMetadataAuthorityTransaction({
      walletPublicKey: data.walletPublicKey,
      tokenPublicKey: new PublicKey(data.tokenAddress),
      couponCode: data.couponCode,
    })

    // Return response
    const response: UnsignedRevokeMetadataAuthorityResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize({ requireAllSignatures: false })).toString('base64'),
      message: `Metadata authority revocation transaction prepared successfully for token: ${data.tokenAddress}`,
    }

    return response
  },
})
