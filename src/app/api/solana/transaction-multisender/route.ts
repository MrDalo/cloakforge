import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { createSolanaApiRoute } from '@/lib/api'
import { transactionMultisenderRequestSchema } from '@/lib/schemas/apiSchemas'
import { createMultisenderTransaction } from '@/lib/solana/server-side/createMultisenderTransaction'
import type { UnsignedMultisenderResponse } from '@/types'

/**
 * POST /api/solana/transaction-multisender
 *
 * Prepares unsigned multisender transactions. Recipients are packed into as few v0 transactions
 * as the transaction size limit allows (one whenever they all fit); the client signs them in a
 * single wallet approval.
 */
export const POST = createSolanaApiRoute({
  name: 'solana/transaction-multisender',
  schema: transactionMultisenderRequestSchema,
  additionalAddressFields: ['tokenMintAddress'],
  handler: async (data) => {
    // Create transaction(s)
    const result = await createMultisenderTransaction({
      walletPublicKey: data.walletPublicKey,
      tokenMintAddress: data.tokenMintAddress ? new PublicKey(data.tokenMintAddress) : undefined,
      recipients: data.recipients,
      decimals: data.decimals,
      couponCode: data.couponCode,
    })

    const transactionCount = result.transactions.length

    // Return response
    const response: UnsignedMultisenderResponse = {
      serializedTransactions: result.transactions.map((tx) => Buffer.from(tx.serialize()).toString('base64')),
      batches: result.batches,
      decimals: result.decimals,
      message: `Multisender prepared: ${data.recipients.length} recipients in ${transactionCount} transaction${transactionCount === 1 ? '' : 's'}`,
      totalServiceFee: result.totalServiceFee,
      estimatedNetworkFee: result.estimatedNetworkFee,
      blockhash: result.blockhash,
      lastValidBlockHeight: result.lastValidBlockHeight,
    }

    return response
  },
})
