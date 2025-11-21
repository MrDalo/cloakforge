import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { createSolanaApiRoute } from '@/lib/api'
import { revokeFreezeAuthorityRequestSchema } from '@/lib/schemas/apiSchemas'
import { createRevokeFreezeAuthorityTransaction } from '@/lib/solana/server-side/createRevokeFreezeAuthorityTransaction'

interface UnsignedRevokeFreezeAuthorityResponse {
  serializedTransaction: string
  message: string
}

/**
 * POST /api/solana/revoke-freeze-authority
 *
 * Prepares unsigned revoke freeze authority transaction
 */
export const POST = createSolanaApiRoute({
  name: 'solana/revoke-freeze-authority',
  schema: revokeFreezeAuthorityRequestSchema,
  additionalAddressFields: ['tokenAddress'],
  handler: async (data) => {
    // Create transaction
    const result = await createRevokeFreezeAuthorityTransaction({
      walletPublicKey: data.walletPublicKey,
      tokenPublicKey: new PublicKey(data.tokenAddress),
    })

    // Return response
    const response: UnsignedRevokeFreezeAuthorityResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize({ requireAllSignatures: false })).toString('base64'),
      message: `Freeze authority revocation transaction prepared successfully for token: ${data.tokenAddress}`,
    }

    return response
  },
})
