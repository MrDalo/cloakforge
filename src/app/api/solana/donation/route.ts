import 'server-only'

import { PublicKey } from '@solana/web3.js'
import { createSolanaApiRoute } from '@/lib/api'
import { donationRequestSchema } from '@/lib/schemas/apiSchemas'
import { createDonationTransaction } from '@/lib/solana/server-side/createDonationTransaction'

interface UnsignedDonationResponse {
  serializedTransaction: string
  message: string
  blockhash: string
  lastValidBlockHeight: number
}

/**
 * POST /api/solana/donation
 *
 * Prepares an unsigned donation transaction (SOL or SPL token) to the platform treasury wallet.
 */
export const POST = createSolanaApiRoute({
  name: 'solana/donation',
  schema: donationRequestSchema,
  additionalAddressFields: ['tokenMintAddress'],
  handler: async (data) => {
    const result = await createDonationTransaction({
      walletPublicKey: data.walletPublicKey,
      tokenMintAddress: data.tokenMintAddress ? new PublicKey(data.tokenMintAddress) : undefined,
      amount: data.amount,
    })

    const response: UnsignedDonationResponse = {
      serializedTransaction: Buffer.from(result.transaction.serialize()).toString('base64'),
      message: 'Donation transaction prepared successfully',
      blockhash: result.blockhash,
      lastValidBlockHeight: result.lastValidBlockHeight,
    }

    return response
  },
})
