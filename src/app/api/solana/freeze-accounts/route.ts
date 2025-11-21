import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { createSolanaApiRoute } from '@/lib/api'
import { freezeAccountRequestSchema } from '@/lib/schemas/apiSchemas'
import { createFreezeAccountTransaction } from '@/lib/solana/server-side/createFreezeAccountTransaction'

interface UnsignedFreezeAccountResponse {
  serializedTransaction: string
  message: string
}

/**
 * POST /api/solana/freeze-accounts
 *
 * Prepares unsigned freeze account transaction
 */
export const POST = createSolanaApiRoute({
  name: 'solana/freeze-accounts',
  schema: freezeAccountRequestSchema,
  additionalAddressFields: ['tokenAccount', 'mintAddress'],
  handler: async (data) => {
    // Create transaction
    const result = await createFreezeAccountTransaction({
      walletPublicKey: data.walletPublicKey,
      tokenAccount: new PublicKey(data.tokenAccount),
      mintAddress: new PublicKey(data.mintAddress),
    })

    // Return response
    const response: UnsignedFreezeAccountResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize({ requireAllSignatures: false })).toString('base64'),
      message: `Freeze account transaction prepared successfully for account: ${data.tokenAccount}`,
    }

    return response
  },
})
