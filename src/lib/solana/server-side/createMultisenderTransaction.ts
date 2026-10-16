import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  TransactionMessage,
  type TransactionInstruction,
} from '@solana/web3.js'
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { address, createNoopSigner } from '@solana/kit'
import { getTransferCheckedInstruction, getCreateAssociatedTokenIdempotentInstruction } from '@solana-program/token'
import {
  addComputeBudgetInstructionsVersioned,
  calculateDynamicPriorityFee,
  createConnectionPair,
  kitInstructionToWeb3Instruction,
  parseTokenAmount,
} from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import { applyCouponToServiceFee } from './discountedServiceFee'
import { resolveToolBaseFee } from './defaultToolFees'
import { getMintAccountInfo } from './getMintAccountInfo'
import 'server-only'

// Maximum recipients per transaction to stay within size limits
// 10 is safe for SPL tokens (CreateATA + TransferChecked + Fee + Memo + ComputeBudget)
const MAX_RECIPIENTS_PER_TRANSACTION = 10

/** SOL amounts are expressed in lamports (9 decimals). */
const SOL_DECIMALS = 9

export interface Recipient {
  address: string
  /** UI amount (number or decimal string). Converted to base units with exact decimal math. */
  amount: number | string
}

export interface CreateMultisenderTransactionParams {
  walletPublicKey: PublicKey
  tokenMintAddress?: PublicKey // Optional, if undefined it's SOL
  recipients: Recipient[]
  /**
   * @deprecated Ignored. Kept for backward compatibility with older clients — the mint's
   * decimals are always read on-chain (client-supplied decimals scaled transfers 1000x, WEB3-01).
   */
  decimals?: number
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

interface PreparedRecipient {
  publicKey: PublicKey
  rawAmount: bigint
}

/**
 * Parses recipient addresses and rejects duplicates (a duplicated line would silently pay twice).
 *
 * @param recipients - Recipients from the request.
 * @returns Parsed public keys, in request order.
 */
const parseRecipientAddresses = (recipients: Recipient[]): PublicKey[] => {
  const seen = new Set<string>()

  return recipients.map((recipient, index) => {
    let publicKey: PublicKey
    try {
      publicKey = new PublicKey(recipient.address)
    } catch {
      throw new AppError('INVALID_WALLET_ADDRESS', `Invalid address for recipient #${index + 1}`)
    }

    const canonical = publicKey.toBase58()
    if (seen.has(canonical)) {
      throw new AppError(
        'INVALID_INPUT',
        `Duplicate recipient address ${canonical} (recipient #${index + 1}). Combine the amounts into a single entry and try again.`
      )
    }
    seen.add(canonical)

    return publicKey
  })
}

/**
 * Builds one or more unsigned multisender transactions for SOL or SPL transfers.
 *
 * SPL transfers use `TransferChecked` with the mint's on-chain decimals for both the classic
 * Token program and Token-2022. Amounts are converted to u64 base units with exact decimal math.
 *
 * @param params - Wallet, recipients, and optional token mint.
 * @returns Prepared versioned transactions with fee estimates.
 */
export async function createMultisenderTransaction(
  params: CreateMultisenderTransactionParams
): Promise<CreateMultisenderTransactionResult> {
  const { walletPublicKey, tokenMintAddress, recipients, decimals: clientDecimals, couponCode } = params

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
    // 1. Validate recipients before any RPC call (invalid or duplicate addresses)
    const recipientKeys = parseRecipientAddresses(recipients)

    // 2. Resolve token program and decimals from the mint account on-chain (never from the client)
    let tokenProgramId = TOKEN_PROGRAM_ID
    let amountDecimals = SOL_DECIMALS
    if (tokenMintAddress) {
      const mintInfo = await getMintAccountInfo(legacyConnection, tokenMintAddress)
      tokenProgramId = mintInfo.programId
      amountDecimals = mintInfo.decimals

      if (clientDecimals !== undefined && clientDecimals !== mintInfo.decimals) {
        logger.warn('Ignoring client-supplied decimals that differ from the on-chain mint', undefined, {
          clientDecimals,
          onChainDecimals: mintInfo.decimals,
        })
      }
    }

    // 3. Convert every amount to base units up front, so one bad line rejects the whole request
    const preparedRecipients: PreparedRecipient[] = recipients.map((recipient, index) => {
      try {
        return { publicKey: recipientKeys[index], rawAmount: parseTokenAmount(recipient.amount, amountDecimals) }
      } catch (error) {
        if (error instanceof AppError) {
          throw new AppError(error.code, `Recipient #${index + 1}: ${error.message}`, error.status)
        }
        throw error
      }
    })

    // 4. Calculate Service Fees (per recipient; falls back to the hard-coded minimum if config is unavailable)
    const baseFeePerRecipient = await resolveToolBaseFee('transaction-multisender')

    // Apply discount coupon to the per-recipient service fee (validates the coupon server-side)
    const { feeSOL: serviceFeePerRecipient, couponMemoInstruction } = await applyCouponToServiceFee(baseFeePerRecipient, couponCode)

    // 5. Calculate Priority Fees
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch {
      dynamicPriorityFee = 1000
    }

    // 6. Get Blockhash (with lastValidBlockHeight for client-side expiry-aware confirmation)
    const { blockhash, lastValidBlockHeight } = await legacyConnection.getLatestBlockhash('confirmed')

    // 7. Process Batches
    const transactions: VersionedTransaction[] = []
    let totalServiceFeeSOL = 0

    // NoopSigner marks the wallet as a required signer on kit-built instructions, matching
    // @solana/spl-token's builders (real signing stays client-side) — see kitInstructionToWeb3Instruction.
    const payerSigner = createNoopSigner(address(walletPublicKey.toString()))
    const sourceATA = tokenMintAddress
      ? await getAssociatedTokenAddress(tokenMintAddress, walletPublicKey, false, tokenProgramId)
      : undefined

    // Split recipients into chunks
    for (let i = 0; i < preparedRecipients.length; i += MAX_RECIPIENTS_PER_TRANSACTION) {
      const chunk = preparedRecipients.slice(i, i + MAX_RECIPIENTS_PER_TRANSACTION)
      const instructions: TransactionInstruction[] = []

      // Add Compute Budget
      // Token-2022 can consume significantly more CUs due to transfer hooks, interest-bearing extensions, etc.
      // SPL Token (standard): ~60K CU per recipient (CreateATA + TransferChecked)
      // Token-2022: ~150K CU per recipient (CreateATA + TransferChecked + potential hooks)
      // SOL: ~10K CU per recipient (simple SystemProgram transfer)
      const cuPerRecipient = tokenMintAddress
        ? tokenProgramId.equals(TOKEN_2022_PROGRAM_ID)
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
      for (const recipient of chunk) {
        if (tokenMintAddress && sourceATA) {
          const destATA = await getAssociatedTokenAddress(tokenMintAddress, recipient.publicKey, false, tokenProgramId)

          // Add Idempotent Create ATA instruction (creates if not exists) — kit-native builder
          instructions.push(
            kitInstructionToWeb3Instruction(
              getCreateAssociatedTokenIdempotentInstruction({
                payer: payerSigner,
                ata: address(destATA.toString()),
                owner: address(recipient.publicKey.toString()),
                mint: address(tokenMintAddress.toString()),
                tokenProgram: address(tokenProgramId.toString()),
              })
            )
          )

          // TransferChecked: the token program verifies mint + decimals on-chain, so a decimals
          // mismatch fails the transaction instead of moving the wrong amount
          instructions.push(
            kitInstructionToWeb3Instruction(
              getTransferCheckedInstruction(
                {
                  source: address(sourceATA.toString()),
                  mint: address(tokenMintAddress.toString()),
                  destination: address(destATA.toString()),
                  authority: payerSigner,
                  amount: recipient.rawAmount,
                  decimals: amountDecimals,
                },
                { programAddress: address(tokenProgramId.toString()) }
              )
            )
          )
        } else {
          // SOL Transfer (raw amount is in lamports)
          instructions.push(
            SystemProgram.transfer({
              fromPubkey: walletPublicKey,
              toPubkey: recipient.publicKey,
              lamports: recipient.rawAmount,
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
    if (error instanceof AppError && error.status < 500) {
      logger.warn('Rejected multisender request', error)
    } else {
      logger.error('Failed to create multisender transaction', error)
    }
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare multisender transaction')
  }
}
