import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { createSolanaApiRoute } from '@/lib/api'
import { freezeWalletRequestSchema } from '@/lib/schemas/apiSchemas'
import { createBatchFreezeTransaction } from '@/lib/solana/server-side/createFreezeWalletTransaction'

interface BatchFreezeResponse {
  serializedTransaction: string
  message: string
  frozenWallets: string[]
  derivedTokenAccounts: string[]
}

/**
 * POST /api/solana/freeze-wallets
 *
 * Prepares unsigned batch freeze transaction
 * Accepts wallet addresses and derives ATAs server-side
 */
export const POST = createSolanaApiRoute({
  name: 'solana/freeze-wallets',
  schema: freezeWalletRequestSchema,
  additionalAddressFields: ['targetWallets', 'mintAddress'],
  handler: async (data) => {
    // Create batch transaction
    const result = await createBatchFreezeTransaction({
      walletPublicKey: data.walletPublicKey,
      targetWallets: data.targetWallets.map((addr: string) => new PublicKey(addr)),
      mintAddress: new PublicKey(data.mintAddress),
    })

    // Return response
    const response: BatchFreezeResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize()).toString('base64'),
      message: `Batch freeze transaction prepared for ${result.frozenWallets.length} wallet(s)`,
      frozenWallets: result.frozenWallets,
      derivedTokenAccounts: result.derivedTokenAccounts,
    }

    return response
  },
})
