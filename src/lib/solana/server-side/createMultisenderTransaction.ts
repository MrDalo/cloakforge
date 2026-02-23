import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  TransactionMessage,
  type TransactionInstruction,
} from '@solana/web3.js'
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
} from '@solana/spl-token'
import { addComputeBudgetInstructionsVersioned, calculateDynamicPriorityFee, createConnectionPair } from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import 'server-only'

// Maximum recipients per transaction to stay within size limits
// 10 is safe for SPL tokens (CreateATA + Transfer + Fee + Memo + ComputeBudget)
const MAX_RECIPIENTS_PER_TRANSACTION = 10

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
  transactions: VersionedTransaction[]
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
    let serviceFeePerRecipient = 0
    try {
      const toolConfig = await getCachedToolConfig('transaction-multisender')
      if (toolConfig) {
        // Fee per recipient
        serviceFeePerRecipient = toolConfig.baseFee
      }
    } catch (error) {
      logger.warn('Failed to get tool config', { error: String(error) })
      serviceFeePerRecipient = 0.001 // Default fallback
    }

    // 3. Calculate Priority Fees
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch {
      dynamicPriorityFee = 1000
    }

    // 4. Get Blockhash
    const { blockhash } = await legacyConnection.getLatestBlockhash('confirmed')

    // 5. Process Batches
    const transactions: VersionedTransaction[] = []
    let totalServiceFeeSOL = 0

    // Split recipients into chunks
    for (let i = 0; i < recipients.length; i += MAX_RECIPIENTS_PER_TRANSACTION) {
      const chunk = recipients.slice(i, i + MAX_RECIPIENTS_PER_TRANSACTION)
      const instructions: TransactionInstruction[] = []

      // Add Compute Budget
      // Estimate: 5000 per SOL transfer, 50000 per SPL transfer (create ATA + transfer)
      const computeUnitLimit =
        tokenMintAddress ?
          chunk.length * 60000 + 50000 // SPL
        : chunk.length * 10000 + 20000 // SOL

      addComputeBudgetInstructionsVersioned(instructions, Math.min(computeUnitLimit, 1_400_000), dynamicPriorityFee)

      // Add Service Memo
      instructions.push(createServiceMemoInstruction(SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER))

      // Add Service Fee Transfer (per batch based on recipients in this chunk)
      if (serviceFeePerRecipient > 0) {
        const serviceFeeWallet = new PublicKey(serverConfig.feeWalletAddress)
        const batchFee = serviceFeePerRecipient * chunk.length
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: serviceFeeWallet,
            lamports: Math.floor(batchFee * LAMPORTS_PER_SOL),
          })
        )
        totalServiceFeeSOL += batchFee
      }

      // Add Transfer Instructions for this chunk
      for (const recipient of chunk) {
        const recipientPubkey = new PublicKey(recipient.address)

        if (tokenMintAddress) {
          // SPL Token Transfer
          const amountBigInt = BigInt(Math.round(recipient.amount * Math.pow(10, decimals)))

          // Derive ATAs
          const sourceATA = await getAssociatedTokenAddress(tokenMintAddress, walletPublicKey, false, tokenProgramId)
          const destATA = await getAssociatedTokenAddress(tokenMintAddress, recipientPubkey, false, tokenProgramId)

          // Add Idempotent Create ATA instruction (creates if not exists)
          instructions.push(
            createAssociatedTokenAccountIdempotentInstruction(
              walletPublicKey, // Payer
              destATA,
              recipientPubkey, // Owner
              tokenMintAddress,
              tokenProgramId
            )
          )

          // Add Transfer instruction
          instructions.push(createTransferInstruction(sourceATA, destATA, walletPublicKey, amountBigInt, [], tokenProgramId))
        } else {
          // SOL Transfer
          const amountLamports = Math.floor(recipient.amount * LAMPORTS_PER_SOL)
          instructions.push(
            SystemProgram.transfer({
              fromPubkey: walletPublicKey,
              toPubkey: recipientPubkey,
              lamports: amountLamports,
            })
          )
        }
      }

      // Create Versioned Transaction
      const messageV0 = new TransactionMessage({
        payerKey: walletPublicKey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message()

      const transaction = new VersionedTransaction(messageV0)
      transactions.push(transaction)
    }

    if (transactions.length === 0) {
      throw new AppError('INVALID_INPUT', 'No transactions created')
    }

    return {
      transactions,
      totalServiceFee: totalServiceFeeSOL,
      estimatedNetworkFee: 0.000005 * transactions.length, // Rough estimate
    }
  } catch (error: unknown) {
    logger.error('Failed to create multisender transaction', error)
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare multisender transaction')
  }
}
