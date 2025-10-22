import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { createSolanaApiRoute } from '@/lib/api'
import { revokeMintAuthorityRequestSchema } from '@/lib/schemas/apiSchemas'
import { createRevokeMintAuthorityTransaction } from '@/lib/solana/server-side/createRevokeMintAuthorityTransaction'

interface UnsignedRevokeMintAuthorityResponse {
  serializedTransaction: string
  message: string
}

/**
 * POST /api/solana/revoke-mint-authority
 *
 * Prepares unsigned revoke mint authority transaction
 */
export const POST = createSolanaApiRoute({
  name: 'solana/revoke-mint-authority',
  schema: revokeMintAuthorityRequestSchema,
  additionalAddressFields: ['tokenAddress'],
  handler: async (data) => {
    // Create transaction
    const result = await createRevokeMintAuthorityTransaction({
      walletPublicKey: data.walletPublicKey,
      tokenPublicKey: new PublicKey(data.tokenAddress),
    })

    // Return response
    const response: UnsignedRevokeMintAuthorityResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize({ requireAllSignatures: false })).toString('base64'),
      message: `Mint authority revocation transaction prepared successfully for token: ${data.tokenAddress}`,
    }

    return response
  },
})
