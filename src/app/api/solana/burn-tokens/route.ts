import 'server-only'

import { createSolanaApiRoute } from '@/lib/api'
import { createBurnTokenTransaction } from '@/lib/solana/server-side/createBurnTokenTransaction'
import { burnTokensRequestSchema } from '@/lib/schemas/apiSchemas'
import type { UnsignedBurnTransactionResponse } from '@/types'

/**
 * POST /api/solana/burn-tokens
 *
 * Prepares unsigned burn transaction for client-side signing
 */
export const POST = createSolanaApiRoute({
  name: 'solana/burn-tokens',
  schema: burnTokensRequestSchema,
  additionalAddressFields: ['tokenAccountAddress', 'mintAddress'],
  handler: async (data) => {
    // Create burn transaction
    const result = await createBurnTokenTransaction({
      walletPublicKey: data.walletPublicKey,
      tokenAccountAddress: data.tokenAccountAddress,
      amount: data.amount,
      mintAddress: data.mintAddress,
      couponCode: data.couponCode,
    })

    // Return response
    const response: UnsignedBurnTransactionResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize({ requireAllSignatures: false })).toString('base64'),
      rawAmount: result.rawAmount,
      uiAmount: result.uiAmount,
      tokenAccount: result.tokenAccount,
      mint: result.mint,
      message: `Ready to burn ${result.uiAmount} ${data.tokenSymbol || 'tokens'}`,
    }

    return response
  },
})
