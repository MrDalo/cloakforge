import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { createSolanaApiRoute } from '@/lib/api'
import { unfreezeWalletRequestSchema } from '@/lib/schemas/apiSchemas'
import { createBatchUnfreezeTransaction } from '@/lib/solana/server-side/createUnfreezeWalletTransaction'

interface BatchUnfreezeResponse {
  serializedTransactions: string[]
  message: string
  unfrozenWallets: string[]
  derivedTokenAccounts: string[]
  blockhash: string
  lastValidBlockHeight: number
}

/**
 * POST /api/solana/unfreeze-wallets
 *
 * Prepares unsigned batch unfreeze transactions
 * Accepts wallet addresses and derives ATAs server-side
 */
export const POST = createSolanaApiRoute({
  name: 'solana/unfreeze-wallets',
  schema: unfreezeWalletRequestSchema,
  additionalAddressFields: ['targetWallets', 'mintAddress'],
  handler: async (data) => {
    // Create batch transactions
    const result = await createBatchUnfreezeTransaction({
      walletPublicKey: data.walletPublicKey,
      targetWallets: data.targetWallets.map((addr: string) => new PublicKey(addr)),
      mintAddress: new PublicKey(data.mintAddress),
    })

    // Return response
    const response: BatchUnfreezeResponse = {
      serializedTransactions: result.transactions.map((tx) => Buffer.from(tx.serialize()).toString('base64')),
      message: `Batch unfreeze transactions prepared for ${result.unfrozenWallets.length} wallet(s)`,
      unfrozenWallets: result.unfrozenWallets,
      derivedTokenAccounts: result.derivedTokenAccounts,
      blockhash: result.blockhash,
      lastValidBlockHeight: result.lastValidBlockHeight,
    }

    return response
  },
})
