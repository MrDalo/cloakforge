import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { createSolanaApiRoute } from '@/lib/api'
import { transactionMultisenderRequestSchema } from '@/lib/schemas/apiSchemas'
import { createMultisenderTransaction } from '@/lib/solana/server-side/createMultisenderTransaction'

interface UnsignedMultisenderResponse {
  serializedTransactions: string[]
  /** Recipients paid by each transaction, aligned with `serializedTransactions` (request order is kept) */
  recipientCounts: number[]
  message: string
  totalServiceFee: number
  estimatedNetworkFee: number
  blockhash: string
  lastValidBlockHeight: number
}

/**
 * POST /api/solana/transaction-multisender
 *
 * Prepares unsigned multisender transaction
 */
export const POST = createSolanaApiRoute({
  name: 'solana/transaction-multisender',
  schema: transactionMultisenderRequestSchema,
  additionalAddressFields: ['tokenMintAddress'],
  handler: async (data) => {
    // Create transaction
    const result = await createMultisenderTransaction({
      walletPublicKey: data.walletPublicKey,
      tokenMintAddress: data.tokenMintAddress ? new PublicKey(data.tokenMintAddress) : undefined,
      recipients: data.recipients,
      decimals: data.decimals,
      couponCode: data.couponCode,
    })

    // Return response (the builder packs every transaction within the packet size limit, so serialize() cannot overflow)
    const response: UnsignedMultisenderResponse = {
      serializedTransactions: result.transactions.map((tx) => Buffer.from(tx.serialize()).toString('base64')),
      recipientCounts: result.recipientCounts,
      message: `Multisender transaction prepared successfully for ${data.recipients.length} recipients in ${result.transactions.length} transaction(s)`,
      totalServiceFee: result.totalServiceFee,
      estimatedNetworkFee: result.estimatedNetworkFee,
      blockhash: result.blockhash,
      lastValidBlockHeight: result.lastValidBlockHeight,
    }

    return response
  },
})
