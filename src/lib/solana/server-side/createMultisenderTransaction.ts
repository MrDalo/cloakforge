import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
} from '@solana/spl-token'
import { addComputeBudgetInstructions, calculateDynamicPriorityFee, createConnectionPair } from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import 'server-only'

export interface Recipient {
  address: string
  amount: number
}

export interface CreateMultisenderTransactionParams {
  walletPublicKey: PublicKey
  tokenMintAddress?: PublicKey // Optional, if undefined it's SOL
  recipients: Recipient[]
  decimals: number
}

export interface CreateMultisenderTransactionResult {
  transaction: Transaction
  totalServiceFee: number
  estimatedNetworkFee: number
}

export async function createMultisenderTransaction(
  params: CreateMultisenderTransactionParams
): Promise<CreateMultisenderTransactionResult> {
  const { walletPublicKey, tokenMintAddress, recipients, decimals } = params

  const serverConfig = getServerConfig()
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'transaction-multisender',
    function: 'createMultisenderTransaction',
    wallet: walletPublicKey.toString(),
    mint: tokenMintAddress?.toString() || 'SOL',
    recipientCount: recipients.length,
    rpcEndpoint: serverConfig.rpcPrivateEndpoint,
  })

  try {
    // 1. Determine Token Program (if SPL)
    let tokenProgramId = TOKEN_PROGRAM_ID
    if (tokenMintAddress) {
      try {
        await getMint(legacyConnection, tokenMintAddress, 'confirmed', TOKEN_2022_PROGRAM_ID)
        tokenProgramId = TOKEN_2022_PROGRAM_ID
      } catch {
        try {
          await getMint(legacyConnection, tokenMintAddress, 'confirmed', TOKEN_PROGRAM_ID)
          tokenProgramId = TOKEN_PROGRAM_ID
        } catch (error) {
          logger.error('Failed to get mint info', error, { mint: tokenMintAddress.toString() })
          throw new AppError('TOKEN_NOT_FOUND', 'Token mint not found')
        }
      }
    }

    // 2. Calculate Service Fees
    let totalServiceFeeSOL = 0
    try {
      const toolConfig = await getCachedToolConfig('transaction-multisender')
      if (toolConfig) {
        // Fee per batch (transaction)
        totalServiceFeeSOL = toolConfig.baseFee
      }
    } catch (error) {
      logger.warn('Failed to get tool config', { error: String(error) })
      totalServiceFeeSOL = 0.01 // Default fallback
    }

    // 3. Calculate Priority Fees
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch {
      dynamicPriorityFee = 1000
    }

    // 4. Build Transaction
    const transaction = new Transaction()
    const { blockhash } = await legacyConnection.getLatestBlockhash('confirmed')
    transaction.recentBlockhash = blockhash
    transaction.feePayer = walletPublicKey

    // Add Compute Budget
    // Estimate: 5000 per SOL transfer, 50000 per SPL transfer (create ATA + transfer)
    const computeUnitLimit = tokenMintAddress
      ? recipients.length * 60000 + 50000 // SPL
      : recipients.length * 10000 + 20000 // SOL

    addComputeBudgetInstructions(transaction, Math.min(computeUnitLimit, 1_400_000), dynamicPriorityFee)

    // Add Service Memo
    transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER))

    // Add Service Fee Transfer
    if (totalServiceFeeSOL > 0) {
      const serviceFeeWallet = new PublicKey(serverConfig.feeWalletAddress)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: serviceFeeWallet,
          lamports: Math.floor(totalServiceFeeSOL * LAMPORTS_PER_SOL),
        })
      )
    }

    // 5. Add Transfer Instructions
    for (const recipient of recipients) {
      const recipientPubkey = new PublicKey(recipient.address)

      if (tokenMintAddress) {
        // SPL Token Transfer
        const amountBigInt = BigInt(Math.round(recipient.amount * Math.pow(10, decimals)))

        // Derive ATAs
        const sourceATA = await getAssociatedTokenAddress(tokenMintAddress, walletPublicKey, false, tokenProgramId)
        const destATA = await getAssociatedTokenAddress(tokenMintAddress, recipientPubkey, false, tokenProgramId)

        // Add Idempotent Create ATA instruction (creates if not exists)
        transaction.add(
          createAssociatedTokenAccountIdempotentInstruction(
            walletPublicKey, // Payer
            destATA,
            recipientPubkey, // Owner
            tokenMintAddress,
            tokenProgramId
          )
        )

        // Add Transfer instruction
        transaction.add(createTransferInstruction(sourceATA, destATA, walletPublicKey, amountBigInt, [], tokenProgramId))
      } else {
        // SOL Transfer
        const amountLamports = Math.floor(recipient.amount * LAMPORTS_PER_SOL)
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: recipientPubkey,
            lamports: amountLamports,
          })
        )
      }
    }

    if (transaction.instructions.length === 0) {
      throw new AppError('INVALID_INPUT', 'Transaction has no instructions')
    }

    try {
      // Verify serialization size
      const serialized = transaction.serialize({ requireAllSignatures: false })
      if (serialized.length > 1232) {
        throw new AppError('TRANSACTION_FAILED', `Transaction size ${serialized.length} exceeds 1232 bytes. Reduce batch size.`)
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('TRANSACTION_FAILED', 'Transaction preparation failed')
    }

    return {
      transaction,
      totalServiceFee: totalServiceFeeSOL,
      estimatedNetworkFee: 0.000005 * transaction.signatures.length, // Rough estimate
    }
  } catch (error: unknown) {
    logger.error('Failed to create multisender transaction', error)
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare multisender transaction')
  }
}
