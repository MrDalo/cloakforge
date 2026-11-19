import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  TransactionMessage,
  PACKET_DATA_SIZE,
  type TransactionInstruction,
} from '@solana/web3.js'
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token'
import { address, createNoopSigner } from '@solana/kit'
import { getTransferCheckedInstruction, getCreateAssociatedTokenIdempotentInstruction } from '@solana-program/token'
import {
  addComputeBudgetInstructionsVersioned,
  calculateDynamicPriorityFee,
  createConnectionPair,
  kitInstructionToWeb3Instruction,
} from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { getToolServiceFee } from '@/lib/config/getToolServiceFee'
import type { MultisenderBatch, MultisenderRecipient } from '@/types/api'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import { applyCouponToServiceFee } from './discountedServiceFee'
import 'server-only'

/**
 * Hard upper bound of recipients per transaction. The effective limit is the serialized
 * transaction size (PACKET_DATA_SIZE = 1232 bytes): batches are packed until the next recipient
 * would no longer fit, so SOL sends fit ~18 recipients and SPL/Token-2022 sends ~8.
 */
export const MAX_RECIPIENTS_PER_TRANSACTION = 20

/** Protocol maximum compute units per transaction */
const MAX_COMPUTE_UNITS = 1_400_000

/** Base network fee per signature in lamports */
const BASE_TX_FEE_LAMPORTS = 5_000

const FALLBACK_PRIORITY_FEE_MICRO_LAMPORTS = 1_000

// Compute unit estimates per recipient.
// Token-2022 can consume significantly more CUs due to transfer hooks, interest-bearing extensions, etc.
const CU_PER_SOL_RECIPIENT = 10_000 // simple SystemProgram transfer
const CU_PER_SPL_RECIPIENT = 60_000 // CreateATA + TransferChecked
const CU_PER_TOKEN_2022_RECIPIENT = 150_000 // CreateATA + TransferChecked + potential hooks
const CU_OVERHEAD_SOL = 20_000
const CU_OVERHEAD_SPL = 50_000

export type Recipient = MultisenderRecipient

export interface CreateMultisenderTransactionParams {
  walletPublicKey: PublicKey
  tokenMintAddress?: PublicKey // Optional, if undefined it's SOL
  recipients: Recipient[]
  /**
   * Decimals the client assumed when entering the amounts. Informational only: the on-chain mint
   * decimals are always used to scale SPL amounts, a mismatch is logged as a warning.
   */
  decimals?: number
  /** Optional discount coupon code to apply to the service fee */
  couponCode?: string
}

export interface CreateMultisenderTransactionResult {
  /** Unsigned v0 transactions, one per batch — a single transaction whenever all recipients fit */
  transactions: VersionedTransaction[]
  /** Which recipients are in which transaction (same order as `transactions`) */
  batches: MultisenderBatch[]
  /** Decimals used to scale the amounts (on-chain mint decimals, 9 for SOL) */
  decimals: number
  totalServiceFee: number
  estimatedNetworkFee: number
  blockhash: string
  lastValidBlockHeight: number
}

interface TokenContext {
  mint: PublicKey
  programId: PublicKey
  decimals: number
  sourceATA: PublicKey
}

/**
 * Resolves the token program and on-chain decimals of a mint (Token-2022 first, then classic Token).
 */
const resolveTokenContext = async (
  connection: ReturnType<typeof createConnectionPair>['legacyConnection'],
  mint: PublicKey,
  wallet: PublicKey,
  logger: ReturnType<typeof getLogger>
): Promise<TokenContext> => {
  for (const programId of [TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID]) {
    try {
      const mintInfo = await getMint(connection, mint, 'confirmed', programId)
      return { mint, programId, decimals: mintInfo.decimals, sourceATA: getAssociatedTokenAddressSync(mint, wallet, false, programId) }
    } catch {
      // try the next program
    }
  }
  logger.error('Failed to get mint info', undefined, { mint: mint.toString() })
  throw new AppError('TOKEN_NOT_FOUND', 'Token mint not found')
}

/** Serialized size of an unsigned transaction, or Infinity when it does not even fit the encoder. */
const serializedSize = (transaction: VersionedTransaction): number => {
  try {
    return transaction.serialize().length
  } catch {
    return Number.POSITIVE_INFINITY
  }
}

/**
 * Builds one or more unsigned multisender transactions for SOL or SPL transfers.
 *
 * Recipients are packed greedily: a transaction takes as many recipients as fit within the
 * 1232-byte packet limit (and MAX_RECIPIENTS_PER_TRANSACTION), so most sends need a single
 * transaction and larger ones need as few as possible. All transactions share one blockhash so
 * the client can sign them in a single wallet approval and broadcast them together.
 *
 * @param params - Wallet, recipients, token context and optional coupon.
 * @returns Prepared versioned transactions, batch metadata and fee estimates.
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
    if (recipients.length === 0) {
      throw new AppError('INVALID_INPUT', 'At least one recipient is required')
    }

    // 1. Resolve token program and decimals (on-chain decimals are authoritative)
    const token = tokenMintAddress ? await resolveTokenContext(legacyConnection, tokenMintAddress, walletPublicKey, logger) : null
    const decimals = token ? token.decimals : 9

    if (clientDecimals !== undefined && clientDecimals !== decimals) {
      logger.warn('Client decimals differ from on-chain decimals — using on-chain value', undefined, { clientDecimals, decimals })
    }

    // 2. Service fee per recipient (Contentful, or the tool's fallback fee when Contentful is unavailable)
    let serviceFeePerRecipient = await getToolServiceFee('transaction-multisender')

    // Apply discount coupon to the per-recipient service fee (validates the coupon server-side)
    const { feeSOL: discountedFeePerRecipient, couponMemoInstruction } = await applyCouponToServiceFee(serviceFeePerRecipient, couponCode)
    serviceFeePerRecipient = discountedFeePerRecipient

    // 3. Priority fee
    let priorityFeeMicroLamports: number
    try {
      priorityFeeMicroLamports = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch {
      priorityFeeMicroLamports = FALLBACK_PRIORITY_FEE_MICRO_LAMPORTS
    }

    // 4. Blockhash (shared by every batch; lastValidBlockHeight lets the client confirm with expiry awareness)
    const { blockhash, lastValidBlockHeight } = await legacyConnection.getLatestBlockhash('confirmed')

    // 5. Per-recipient transfer instructions
    // NoopSigner marks the wallet as a required signer on kit-built instructions, matching
    // @solana/spl-token's builders (real signing stays client-side) — see kitInstructionToWeb3Instruction.
    const payerSigner = createNoopSigner(address(walletPublicKey.toString()))
    const serviceFeeWallet = new PublicKey(serverConfig.feeWalletAddress)

    const recipientInstructions: TransactionInstruction[][] = recipients.map((recipient) => {
      let recipientPubkey: PublicKey
      try {
        recipientPubkey = new PublicKey(recipient.address)
      } catch {
        throw new AppError('INVALID_INPUT', `Invalid recipient address: ${recipient.address}`)
      }

      if (!token) {
        return [
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: recipientPubkey,
            lamports: Math.floor(recipient.amount * LAMPORTS_PER_SOL),
          }),
        ]
      }

      let destATA: PublicKey
      try {
        destATA = getAssociatedTokenAddressSync(token.mint, recipientPubkey, false, token.programId)
      } catch {
        throw new AppError('INVALID_INPUT', `Recipient ${recipient.address} is a program-derived address and cannot receive tokens`)
      }

      const amountBigInt = BigInt(Math.round(recipient.amount * Math.pow(10, decimals)))

      return [
        // Idempotent ATA creation — creates the recipient token account only if it does not exist yet
        kitInstructionToWeb3Instruction(
          getCreateAssociatedTokenIdempotentInstruction({
            payer: payerSigner,
            ata: address(destATA.toString()),
            owner: address(recipientPubkey.toString()),
            mint: address(token.mint.toString()),
            tokenProgram: address(token.programId.toString()),
          })
        ),
        // TransferChecked enforces the mint decimals on-chain — a wrong decimals assumption can never overspend
        kitInstructionToWeb3Instruction(
          getTransferCheckedInstruction(
            {
              source: address(token.sourceATA.toString()),
              mint: address(token.mint.toString()),
              destination: address(destATA.toString()),
              authority: payerSigner,
              amount: amountBigInt,
              decimals,
            },
            { programAddress: address(token.programId.toString()) }
          )
        ),
      ]
    })

    // 6. Batch assembly
    const cuPerRecipient = token
      ? token.programId.equals(TOKEN_2022_PROGRAM_ID)
        ? CU_PER_TOKEN_2022_RECIPIENT
        : CU_PER_SPL_RECIPIENT
      : CU_PER_SOL_RECIPIENT
    const cuOverhead = token ? CU_OVERHEAD_SPL : CU_OVERHEAD_SOL

    const computeUnitsFor = (recipientCount: number): number => Math.min(recipientCount * cuPerRecipient + cuOverhead, MAX_COMPUTE_UNITS)

    const buildBatch = (startIndex: number, recipientCount: number): VersionedTransaction => {
      const instructions: TransactionInstruction[] = []
      addComputeBudgetInstructionsVersioned(instructions, computeUnitsFor(recipientCount), priorityFeeMicroLamports)
      instructions.push(createServiceMemoInstruction(SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER))
      // Coupon memo so the redeem endpoint can verify the coupon was used in this transaction
      if (couponMemoInstruction) {
        instructions.push(couponMemoInstruction)
      }
      // Service fee for the recipients in this batch
      if (serviceFeePerRecipient > 0) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: serviceFeeWallet,
            lamports: Math.floor(serviceFeePerRecipient * recipientCount * LAMPORTS_PER_SOL),
          })
        )
      }
      for (let i = startIndex; i < startIndex + recipientCount; i++) {
        instructions.push(...recipientInstructions[i])
      }

      return new VersionedTransaction(
        new TransactionMessage({ payerKey: walletPublicKey, recentBlockhash: blockhash, instructions }).compileToV0Message()
      )
    }

    // Packing: each batch takes the largest recipient count that still fits the packet size.
    // Size grows monotonically with the recipient count, so probe from the previous batch size
    // (batches are almost always equal) and adjust — typically two builds per batch.
    const transactions: VersionedTransaction[] = []
    const batches: MultisenderBatch[] = []
    let startIndex = 0
    let guess = MAX_RECIPIENTS_PER_TRANSACTION

    while (startIndex < recipients.length) {
      const maxCount = Math.min(MAX_RECIPIENTS_PER_TRANSACTION, recipients.length - startIndex)
      let recipientCount = Math.min(guess, maxCount)
      let transaction = buildBatch(startIndex, recipientCount)
      let size = serializedSize(transaction)

      // Shrink until it fits
      while (size > PACKET_DATA_SIZE && recipientCount > 1) {
        recipientCount--
        transaction = buildBatch(startIndex, recipientCount)
        size = serializedSize(transaction)
      }
      if (size > PACKET_DATA_SIZE) {
        throw new AppError('INVALID_INPUT', `Transfer to ${recipients[startIndex].address} does not fit into a single transaction`)
      }

      // Grow while the next recipient still fits
      while (recipientCount < maxCount) {
        const candidate = buildBatch(startIndex, recipientCount + 1)
        const candidateSize = serializedSize(candidate)
        if (candidateSize > PACKET_DATA_SIZE) break
        transaction = candidate
        size = candidateSize
        recipientCount++
      }

      transactions.push(transaction)
      batches.push({ startIndex, recipientCount, sizeBytes: size })
      startIndex += recipientCount
      guess = recipientCount
    }

    // 7. Fee totals
    const totalServiceFee = serviceFeePerRecipient * recipients.length
    const estimatedNetworkFeeLamports = batches.reduce(
      (sum, batch) =>
        sum + BASE_TX_FEE_LAMPORTS + Math.ceil((computeUnitsFor(batch.recipientCount) * priorityFeeMicroLamports) / 1_000_000),
      0
    )

    logger.info('Multisender transactions prepared', {
      transactionCount: transactions.length,
      batches: batches.map((batch) => `${batch.recipientCount}@${batch.sizeBytes}B`).join(','),
    })

    return {
      transactions,
      batches,
      decimals,
      totalServiceFee,
      estimatedNetworkFee: estimatedNetworkFeeLamports / LAMPORTS_PER_SOL,
      blockhash,
      lastValidBlockHeight,
    }
  } catch (error: unknown) {
    logger.error('Failed to create multisender transaction', error)
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare multisender transaction')
  }
}
