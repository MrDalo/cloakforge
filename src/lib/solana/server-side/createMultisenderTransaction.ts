import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  PACKET_DATA_SIZE,
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

/**
 * Upper bound on recipients per transaction. It is the effective limit for SOL transfers
 * (~50 bytes each, so far below the size limit) and keeps the blast radius of one failed batch small.
 * SPL / Token-2022 batches are limited by size first: recipients are packed by measured size.
 */
export const MAX_RECIPIENTS_PER_TRANSACTION = 10

/**
 * Headroom left below {@link PACKET_DATA_SIZE} for instructions a wallet may append after the server
 * builds the transaction. The server already sets both SetComputeUnitLimit and SetComputeUnitPrice, and
 * wallets that manage priority fees keep or rewrite a dApp-set fee in place (same size) rather than
 * append one; the client hook adds nothing. A wallet that appends both anyway adds 20 bytes (8 + 12;
 * the Compute Budget program is already in the account table), which 32 bytes covers.
 */
const WALLET_HEADROOM_BYTES = 32

/** Maximum FULL wire size of a prepared transaction (signature slots included): 1232 - 32 = 1200 bytes. */
export const MAX_TRANSACTION_SIZE = PACKET_DATA_SIZE - WALLET_HEADROOM_BYTES

/** Solana's per-transaction compute unit ceiling. */
const MAX_COMPUTE_UNITS = 1_400_000

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
  /** Optional discount coupon code to apply to the service fee */
  couponCode?: string
}

export interface CreateMultisenderTransactionResult {
  transactions: VersionedTransaction[]
  /** Number of recipients paid by each transaction, aligned with `transactions` (request order is kept). */
  recipientCounts: number[]
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

/** A recipient that cannot fit even alone next to the fixed instructions (server-side, never a raw RangeError). */
const recipientDoesNotFit = (index: number): AppError =>
  new AppError(
    'TRANSACTION_FAILED',
    `Recipient #${index + 1} does not fit in a single transaction (limit ${MAX_TRANSACTION_SIZE} bytes)`,
    500
  )

/**
 * Compiles the instructions into an unsigned v0 transaction with the real fee payer and blockhash,
 * and checks its FULL serialized size (signature slots included) against {@link MAX_TRANSACTION_SIZE}.
 *
 * @param payerKey - Fee payer (the user's wallet).
 * @param recentBlockhash - Blockhash the transaction will be sent with.
 * @param instructions - Every instruction of the transaction.
 * @returns The transaction when it fits, otherwise `undefined`.
 */
const compileIfWithinSizeLimit = (
  payerKey: PublicKey,
  recentBlockhash: string,
  instructions: TransactionInstruction[]
): VersionedTransaction | undefined => {
  try {
    const message = new TransactionMessage({ payerKey, recentBlockhash, instructions }).compileToV0Message()
    const transaction = new VersionedTransaction(message)
    return transaction.serialize().length <= MAX_TRANSACTION_SIZE ? transaction : undefined
  } catch (error) {
    // web3.js serializes the message into a PACKET_DATA_SIZE buffer and throws a RangeError
    // ("encoding overruns Uint8Array") when it does not fit: that is "too large", not a failure
    if (error instanceof RangeError) return undefined
    throw error
  }
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
  const { walletPublicKey, tokenMintAddress, recipients, couponCode } = params

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

    // Apply discount coupon to the per-recipient service fee (checks availability server-side; nothing is
    // consumed until a transaction carrying the coupon memo confirms on-chain). The discount applies to
    // every batch, but the coupon instructions go into the FIRST transaction only: one request = one use.
    const { feeSOL: serviceFeePerRecipient, couponInstructions } = await applyCouponToServiceFee(
      baseFeePerRecipient,
      couponCode,
      walletPublicKey
    )

    // 5. Calculate Priority Fees
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch {
      dynamicPriorityFee = 1000
    }

    // 6. Get Blockhash (with lastValidBlockHeight for client-side expiry-aware confirmation)
    const { blockhash, lastValidBlockHeight } = await legacyConnection.getLatestBlockhash('confirmed')

    // 7. Per-recipient instructions (built once; ATA derivation is the expensive part)
    // NoopSigner marks the wallet as a required signer on kit-built instructions, matching
    // @solana/spl-token's builders (real signing stays client-side) — see kitInstructionToWeb3Instruction.
    const payerSigner = createNoopSigner(address(walletPublicKey.toString()))
    const sourceATA = tokenMintAddress
      ? await getAssociatedTokenAddress(tokenMintAddress, walletPublicKey, false, tokenProgramId)
      : undefined

    const recipientInstructions: TransactionInstruction[][] = []
    for (const recipient of preparedRecipients) {
      if (tokenMintAddress && sourceATA) {
        const destATA = await getAssociatedTokenAddress(tokenMintAddress, recipient.publicKey, false, tokenProgramId)

        recipientInstructions.push([
          // Idempotent Create ATA (creates if not exists) — kit-native builder
          kitInstructionToWeb3Instruction(
            getCreateAssociatedTokenIdempotentInstruction({
              payer: payerSigner,
              ata: address(destATA.toString()),
              owner: address(recipient.publicKey.toString()),
              mint: address(tokenMintAddress.toString()),
              tokenProgram: address(tokenProgramId.toString()),
            })
          ),
          // TransferChecked: the token program verifies mint + decimals on-chain, so a decimals
          // mismatch fails the transaction instead of moving the wrong amount
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
          ),
        ])
      } else {
        // SOL Transfer (raw amount is in lamports)
        recipientInstructions.push([
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: recipient.publicKey,
            lamports: recipient.rawAmount,
          }),
        ])
      }
    }

    // 8. Compute budget per batch
    // Token-2022 can consume significantly more CUs due to transfer hooks, interest-bearing extensions, etc.
    // SPL Token (standard): ~60K CU per recipient (CreateATA + TransferChecked)
    // Token-2022: ~150K CU per recipient (CreateATA + TransferChecked + potential hooks)
    // SOL: ~10K CU per recipient (simple SystemProgram transfer)
    const cuPerRecipient = tokenMintAddress
      ? tokenProgramId.equals(TOKEN_2022_PROGRAM_ID)
        ? 150_000 // Token-2022 (with potential transfer hooks)
        : 60_000 // Standard SPL Token
      : 10_000 // SOL
    const cuOverhead = tokenMintAddress ? 50_000 : 20_000
    // Never pack more recipients than the compute budget can pay for (Token-2022: 9)
    const maxRecipientsPerTransaction = Math.min(
      MAX_RECIPIENTS_PER_TRANSACTION,
      Math.floor((MAX_COMPUTE_UNITS - cuOverhead) / cuPerRecipient)
    )

    const serviceFeeWallet = serviceFeePerRecipient > 0 ? new PublicKey(serverConfig.feeWalletAddress) : undefined

    /**
     * Every instruction of one batch transaction:
     * [computeLimit, computePrice, serviceMemo, (coupon instructions — first tx only), feeTransfer?, recipients...]
     */
    const buildBatchInstructions = (batchRecipients: TransactionInstruction[][], isFirstTransaction: boolean): TransactionInstruction[] => {
      const instructions: TransactionInstruction[] = []

      addComputeBudgetInstructionsVersioned(
        instructions,
        Math.min(batchRecipients.length * cuPerRecipient + cuOverhead, MAX_COMPUTE_UNITS),
        dynamicPriorityFee
      )

      instructions.push(createServiceMemoInstruction(SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER))

      // Coupon memo + 0-lamport marker transfer in the first transaction only (one request = one use)
      if (isFirstTransaction) {
        instructions.push(...couponInstructions)
      }

      // Service fee for the recipients in this batch
      if (serviceFeeWallet) {
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: serviceFeeWallet,
            lamports: Math.floor(serviceFeePerRecipient * batchRecipients.length * LAMPORTS_PER_SOL),
          })
        )
      }

      for (const recipient of batchRecipients) {
        instructions.push(...recipient)
      }

      return instructions
    }

    // 9. Pack recipients greedily, in request order: add one recipient at a time and start a new
    // transaction when the next one would exceed MAX_TRANSACTION_SIZE (measured on the compiled,
    // fully serialized transaction) or the per-transaction recipient cap
    const transactions: VersionedTransaction[] = []
    const recipientCounts: number[] = []

    let batch: TransactionInstruction[][] = []
    let batchTransaction: VersionedTransaction | undefined

    for (const [index, recipient] of recipientInstructions.entries()) {
      const isFirstTransaction = transactions.length === 0
      const candidate = [...batch, recipient]
      const candidateTransaction =
        candidate.length <= maxRecipientsPerTransaction
          ? compileIfWithinSizeLimit(walletPublicKey, blockhash, buildBatchInstructions(candidate, isFirstTransaction))
          : undefined

      if (candidateTransaction) {
        batch = candidate
        batchTransaction = candidateTransaction
        continue
      }

      // Not even one recipient fits next to the fixed instructions: never hand out an oversize transaction
      if (!batchTransaction) {
        throw recipientDoesNotFit(index)
      }

      transactions.push(batchTransaction)
      recipientCounts.push(batch.length)

      batch = [recipient]
      batchTransaction = compileIfWithinSizeLimit(walletPublicKey, blockhash, buildBatchInstructions(batch, false))
      if (!batchTransaction) {
        throw recipientDoesNotFit(index)
      }
    }

    if (batchTransaction) {
      transactions.push(batchTransaction)
      recipientCounts.push(batch.length)
    }

    if (transactions.length === 0) {
      throw new AppError('INVALID_INPUT', 'No transactions created')
    }

    const totalServiceFeeSOL = recipientCounts.reduce((sum, count) => sum + serviceFeePerRecipient * count, 0)

    logger.info('Prepared multisender transactions', { recipientCounts })

    return {
      transactions,
      recipientCounts,
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
