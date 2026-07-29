import 'server-only'

import { createSolanaApiRoute } from '@/lib/api'
import { updateMetadataRequestSchema } from '@/lib/schemas/apiSchemas'
import { PublicKey } from '@solana/web3.js'
import { createUpdateMetadataTransaction } from '@/lib/solana/server-side/createUpdateMetadataTransaction'

/**
 * POST /api/solana/update-metadata
 *
 * Prepares an unsigned transaction that updates the on-chain name/symbol/URI of a
 * Token-2022 mint (via the metadata-pointer extension) for client-side signing.
 */
export const POST = createSolanaApiRoute({
  name: 'solana/update-metadata',
  schema: updateMetadataRequestSchema,
  additionalAddressFields: ['tokenAddress'],
  handler: async (data) => {
    const result = await createUpdateMetadataTransaction({
      walletPublicKey: data.walletPublicKey,
      tokenPublicKey: new PublicKey(data.tokenAddress),
      tokenData: {
        name: data.tokenData.name,
        symbol: data.tokenData.symbol,
      },
      metadataUri: data.metadata?.metadataUri,
      couponCode: data.couponCode,
    })

    return {
      serializedTransaction: Buffer.from(result.transaction.serialize({ requireAllSignatures: false })).toString('base64'),
      message: 'Metadata update transaction prepared successfully.',
    }
  },
})
