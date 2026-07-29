import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  TransactionMessage,
  type TransactionInstruction,
} from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token'
import { address, createNoopSigner } from '@solana/kit'
import { getTransferInstruction, getCreateAssociatedTokenIdempotentInstruction } from '@solana-program/token'
import {
  addComputeBudgetInstructionsVersioned,
  calculateDynamicPriorityFee,
  createConnectionPair,
  kitInstructionToWeb3Instruction,
} from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import { applyCouponToServiceFee } from './discountedServiceFee'
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
  /** Optional discount coupon code to apply to the service fee */
  couponCode?: string
}

export interface CreateMultisenderTransactionResult {
  transactions: VersionedTransaction[]
  totalServiceFee: number
  estimatedNetworkFee: number
  blockhash: string
  lastValidBlockHeight: number
}

/**
 * Builds one or more unsigned multisender transactions for SOL or SPL transfers.
 *
 * @param params - Wallet, recipients, token context, and decimal precision.
 * @returns Prepared versioned transactions with fee estimates.
 */
export async function createMultisenderTransaction(
  params: CreateMultisenderTransactionParams
): Promise<CreateMultisenderTransactionResult> {
  const { walletPublicKey, tokenMintAddress, recipients, decimals, couponCode } = params

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
      logger.error('Failed to get tool config', { error: String(error) })
      serviceFeePerRecipient = 0.001 // Default fallback
    }

    // Apply discount coupon to the per-recipient service fee (validates the coupon server-side)
    const { feeSOL: discountedFeePerRecipient, couponMemoInstruction } = await applyCouponToServiceFee(serviceFeePerRecipient, couponCode)
    serviceFeePerRecipient = discountedFeePerRecipient

    // 3. Calculate Priority Fees
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch {
      dynamicPriorityFee = 1000
    }

    // 4. Get Blockhash (with lastValidBlockHeight for client-side expiry-aware confirmation)
    const { blockhash, lastValidBlockHeight } = await legacyConnection.getLatestBlockhash('confirmed')

    // 5. Process Batches
    const transactions: VersionedTransaction[] = []
    let totalServiceFeeSOL = 0

    // Split recipients into chunks
    for (let i = 0; i < recipients.length; i += MAX_RECIPIENTS_PER_TRANSACTION) {
      const chunk = recipients.slice(i, i + MAX_RECIPIENTS_PER_TRANSACTION)
      const instructions: TransactionInstruction[] = []

      // Add Compute Budget
      // Token-2022 can consume significantly more CUs due to transfer hooks, interest-bearing extensions, etc.
      // SPL Token (standard): ~60K CU per recipient (CreateATA + Transfer)
      // Token-2022: ~150K CU per recipient (CreateATA + Transfer + potential hooks)
      // SOL: ~10K CU per recipient (simple SystemProgram transfer)
      const cuPerRecipient = tokenMintAddress
        ? tokenProgramId === TOKEN_2022_PROGRAM_ID
          ? 150_000 // Token-2022 (with potential transfer hooks)
          : 60_000 // Standard SPL Token
        : 10_000 // SOL

      const computeUnitLimit = tokenMintAddress
        ? chunk.length * cuPerRecipient + 50_000 // SPL/Token-2022 + overhead
        : chunk.length * cuPerRecipient + 20_000 // SOL + overhead

      addComputeBudgetInstructionsVersioned(instructions, Math.min(computeUnitLimit, 1_400_000), dynamicPriorityFee)

      // Add Service Memo
      instructions.push(createServiceMemoInstruction(SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER))

      // Coupon memo so the redeem endpoint can verify the coupon was used in this transaction
      if (couponMemoInstruction) {
        instructions.push(couponMemoInstruction)
      }

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
      // NoopSigner marks the wallet as a required signer on kit-built instructions, matching
      // @solana/spl-token's builders (real signing stays client-side) — see kitInstructionToWeb3Instruction.
      const payerSigner = createNoopSigner(address(walletPublicKey.toString()))

      for (const recipient of chunk) {
        const recipientPubkey = new PublicKey(recipient.address)

        if (tokenMintAddress) {
          // SPL Token Transfer
          const amountBigInt = BigInt(Math.round(recipient.amount * Math.pow(10, decimals)))

          // Derive ATAs
          const sourceATA = await getAssociatedTokenAddress(tokenMintAddress, walletPublicKey, false, tokenProgramId)
          const destATA = await getAssociatedTokenAddress(tokenMintAddress, recipientPubkey, false, tokenProgramId)

          // Add Idempotent Create ATA instruction (creates if not exists) — kit-native builder
          instructions.push(
            kitInstructionToWeb3Instruction(
              getCreateAssociatedTokenIdempotentInstruction({
                payer: payerSigner,
                ata: address(destATA.toString()),
                owner: address(recipientPubkey.toString()),
                mint: address(tokenMintAddress.toString()),
                tokenProgram: address(tokenProgramId.toString()),
              })
            )
          )

          // Add Transfer instruction — kit-native builder
          instructions.push(
            kitInstructionToWeb3Instruction(
              getTransferInstruction(
                {
                  source: address(sourceATA.toString()),
                  destination: address(destATA.toString()),
                  authority: payerSigner,
                  amount: amountBigInt,
                },
                { programAddress: address(tokenProgramId.toString()) }
              )
            )
          )
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
      blockhash,
      lastValidBlockHeight,
    }
  } catch (error: unknown) {
    logger.error('Failed to create multisender transaction', error)
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare multisender transaction')
  }
}
