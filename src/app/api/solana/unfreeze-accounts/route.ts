import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { createSolanaApiRoute } from '@/lib/api'
import { unfreezeAccountRequestSchema } from '@/lib/schemas/apiSchemas'
import { createUnfreezeAccountTransaction } from '@/lib/solana/server-side/createUnfreezeAccountTransaction'

interface UnsignedUnfreezeAccountResponse {
  serializedTransaction: string
  message: string
}

/**
 * POST /api/solana/unfreeze-accounts
 *
 * Prepares unsigned unfreeze account transaction
 */
export const POST = createSolanaApiRoute({
  name: 'solana/unfreeze-accounts',
  schema: unfreezeAccountRequestSchema,
  additionalAddressFields: ['tokenAccount', 'mintAddress'],
  handler: async (data) => {
    // Create transaction
    const result = await createUnfreezeAccountTransaction({
      walletPublicKey: data.walletPublicKey,
      tokenAccount: new PublicKey(data.tokenAccount),
      mintAddress: new PublicKey(data.mintAddress),
    })

    // Return response
    const response: UnsignedUnfreezeAccountResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize({ requireAllSignatures: false })).toString('base64'),
      message: `Unfreeze account transaction prepared successfully for account: ${data.tokenAccount}`,
    }

    return response
  },
})
