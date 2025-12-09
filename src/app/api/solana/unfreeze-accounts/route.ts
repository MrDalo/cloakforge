import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { createSolanaApiRoute } from '@/lib/api'
import { unfreezeAccountRequestSchema } from '@/lib/schemas/apiSchemas'
import { createBatchUnfreezeTransaction } from '@/lib/solana/server-side/createUnfreezeAccountTransaction'

interface BatchUnfreezeResponse {
  serializedTransaction: string
  message: string
  unfrozenWallets: string[]
  derivedTokenAccounts: string[]
}

/**
 * POST /api/solana/unfreeze-accounts
 *
 * Prepares unsigned batch unfreeze transaction
 * Accepts wallet addresses and derives ATAs server-side
 */
export const POST = createSolanaApiRoute({
  name: 'solana/unfreeze-accounts',
  schema: unfreezeAccountRequestSchema,
  additionalAddressFields: ['targetWallets', 'mintAddress'],
  handler: async (data) => {
    // Create batch transaction
    const result = await createBatchUnfreezeTransaction({
      walletPublicKey: data.walletPublicKey,
      targetWallets: data.targetWallets.map((addr: string) => new PublicKey(addr)),
      mintAddress: new PublicKey(data.mintAddress),
    })

    // Return response
    const response: BatchUnfreezeResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize()).toString('base64'),
      message: `Batch unfreeze transaction prepared for ${result.unfrozenWallets.length} wallet(s)`,
      unfrozenWallets: result.unfrozenWallets,
      derivedTokenAccounts: result.derivedTokenAccounts,
    }

    return response
  },
})
