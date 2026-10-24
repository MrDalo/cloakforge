/**
 * useTransactionMultisender Hook
 *
 * Client-side hook for sending tokens to multiple recipients.
 * The server packs recipients into as many transactions as the packet size limit requires
 * (batches are uneven). Before anything is signed, the client verifies that the transactions pay
 * exactly the entered recipients (each once) and simulates them; which recipients each transaction
 * pays comes from that verification, so a partial failure reports exactly who was not paid.
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { type Connection, PublicKey, SendTransactionError, VersionedTransaction } from '@solana/web3.js'
import { getBase58Decoder } from '@solana/kit'
import { useToolConfig } from '@/stores/toolConfigStore'
import { apiClient } from '@/lib/utils/apiClient'
import { useToolBase, type UseToolBaseReturn, type ToolExecutionContext } from './useToolBase'
import { AppError, isUserRejectionError } from '@/lib/errors'
import { toast } from 'sonner'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { getLogger } from '@/lib/logger/logger'
import { getAppliedCoupon } from '@/stores/discountCouponStore'
import {
  assertPreparedTransactionsMatch,
  assertPreparedTransactionsSimulate,
  estimateNewTokenAccountRentLamports,
  formatLamportsAsSol,
  type PreparedTransactionExpectation,
  type PreparedTransactionSummary,
  resolveFeeWalletForVerification,
  getMaxServiceFeeLamports,
} from '@/lib/solana/client'

// Request type for API call
interface MultisenderRequest {
  walletAddress: string
  tokenMintAddress?: string
  recipients: { address: string; amount: number }[]
  couponCode?: string
}

// Response type from API (only what the client uses: payments and fees come from the verified transactions)
interface UnsignedMultisenderResponse {
  serializedTransactions: string[]
  message: string
  blockhash: string
  lastValidBlockHeight: number
}

export interface Recipient {
  address: string
  amount: number
}

// Parameters for the hook
export interface MultisenderParams {
  tokenMintAddress?: string
  recipients: Recipient[]
}

// Result type
export interface MultisenderResult {
  signatures: string[]
  successfulRecipients: number
  /** Recipients whose batch definitely did not pay them (rejected, failed on-chain, or expired): safe to retry */
  failedRecipients: Recipient[]
  /** Recipients whose batch could not be confirmed either way: check the explorer before retrying them */
  unconfirmedRecipients: Recipient[]
  /** The unconfirmed batches with their transaction ids, so each can be looked up on the explorer */
  unconfirmedBatches: UnconfirmedBatch[]
}

/** A sent batch whose outcome is unknown: it may still land (or already have landed). */
export interface UnconfirmedBatch {
  /** 1-based position among the sent batches */
  batchNumber: number
  signature: string
  recipients: Recipient[]
}

/**
 * Return type for useTransactionMultisender hook
 */
export type UseTransactionMultisenderReturn = Omit<
  UseToolBaseReturn<MultisenderParams, MultisenderResult>,
  'execute' | 'validateRequirements'
> & {
  execute: UseToolBaseReturn<MultisenderParams, MultisenderResult>['execute']
}

/** How a sent batch ended: paid its recipients, definitely paid nobody, or unknown. */
type BatchStatus = 'confirmed' | 'failed' | 'unconfirmed'

/**
 * What the transactions must do: pay each entered recipient exactly once, with at most the displayed
 * per-recipient service fee.
 */
const buildMultisenderExpectation = (
  walletAddress: string,
  feeWallet: string | null,
  params: MultisenderParams,
  serviceFeePerRecipientSol: number,
  discountPercentage: number | undefined
): PreparedTransactionExpectation => {
  const payments = params.recipients.map((recipient) => ({ recipient: recipient.address, amount: recipient.amount }))
  return {
    wallet: walletAddress,
    feeWallet,
    maxServiceFeeLamports: getMaxServiceFeeLamports({
      toolId: 'transaction-multisender',
      baseFeeSol: serviceFeePerRecipientSol,
      discountPercentage,
      units: params.recipients.length,
    }),
    operation: params.tokenMintAddress
      ? { kind: 'token-transfers', mint: params.tokenMintAddress, payments }
      : { kind: 'sol-transfers', payments },
  }
}

/**
 * Checks the SOL balance covers everything the verified transactions spend: service fee, SOL amounts,
 * network fees and the rent of recipient token accounts that do not exist yet (WEB3-14).
 *
 * @throws AppError INSUFFICIENT_FUNDS when the balance is too low.
 */
const assertSufficientBalance = async (
  connection: Connection,
  walletAddress: string,
  summary: PreparedTransactionSummary
): Promise<void> => {
  const tokenAccountRentLamports = await estimateNewTokenAccountRentLamports(connection, summary.createdTokenAccounts)
  const requiredLamports = summary.serviceFeeLamports + summary.paymentLamports + summary.networkFeeLamports + tokenAccountRentLamports
  const balanceLamports = BigInt(await connection.getBalance(new PublicKey(walletAddress)))

  if (balanceLamports < requiredLamports) {
    const rentNote =
      tokenAccountRentLamports > BigInt(0)
        ? `, including ${formatLamportsAsSol(tokenAccountRentLamports)} rent for new recipient token accounts`
        : ''
    throw new AppError('INSUFFICIENT_FUNDS', `Insufficient SOL balance. Need approx ${formatLamportsAsSol(requiredLamports)}${rentNote}`)
  }
}

/** The fee payer's signature is the transaction id, known before sending. */
const getTransactionId = (transaction: VersionedTransaction): string => {
  const [signature] = transaction.signatures
  if (!signature) throw new AppError('TRANSACTION_FAILED', 'The wallet returned an unsigned transaction')
  return getBase58Decoder().decode(signature)
}

/** The most blocks a blockhash stays valid for (150 plus slack), bounding the server-provided expiry height. */
const MAX_BLOCKHASH_VALIDITY_BLOCKS = 300
/** Used when the server-provided expiry height is implausible: a blockhash lives 150 blocks at most. */
const BLOCKHASH_VALIDITY_BLOCKS = 150

/**
 * The block height the confirmation waits until. The server's value is only used when it lies within what a
 * blockhash can possibly be valid for (between the current height and +300); otherwise it is derived here.
 * It only bounds how long the client waits: whether a batch failed is decided by the blockhash itself.
 */
const resolveConfirmationHeight = async (connection: Connection, serverLastValidBlockHeight: number): Promise<number> => {
  const currentHeight = await connection.getBlockHeight('confirmed')
  const isPlausible =
    Number.isInteger(serverLastValidBlockHeight) &&
    serverLastValidBlockHeight >= currentHeight &&
    serverLastValidBlockHeight <= currentHeight + MAX_BLOCKHASH_VALIDITY_BLOCKS
  return isPlausible ? serverLastValidBlockHeight : currentHeight + BLOCKHASH_VALIDITY_BLOCKS
}

/** Reads a transaction's on-chain result; 'not-found' when the cluster has no record of it. */
const readSignatureResult = async (connection: Connection, signature: string): Promise<BatchStatus | 'not-found'> => {
  const {
    value: [status],
  } = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true })
  if (!status) return 'not-found'
  if (status.err) return 'failed'
  return status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized' ? 'confirmed' : 'unconfirmed'
}

/**
 * Settles a batch whose send or confirmation did not answer cleanly: when it landed, its on-chain result;
 * when the blockhash of the signed message is definitively expired and the signature is still unknown, failed
 * (it can never land); otherwise unconfirmed. Only the cluster decides expiry, never a server-provided height.
 */
const lookUpBatchStatus = async (connection: Connection, signature: string, recentBlockhash: string): Promise<BatchStatus> => {
  try {
    const landed = await readSignatureResult(connection, signature)
    if (landed !== 'not-found') return landed

    const { value: isBlockhashValid } = await connection.isBlockhashValid(recentBlockhash, { commitment: 'confirmed' })
    if (isBlockhashValid !== false) return 'unconfirmed'

    // Expired: look once more, in case it landed just before the blockhash expired
    const settled = await readSignatureResult(connection, signature)
    return settled === 'not-found' ? 'failed' : settled
  } catch {
    // Unknown state: never report it as failed, a retry could pay twice
    return 'unconfirmed'
  }
}

/** Sends one signed batch and classifies how it ended (never throws). */
const sendBatch = async (
  connection: Connection,
  transaction: VersionedTransaction,
  signature: string,
  lastValidBlockHeight: number
): Promise<BatchStatus> => {
  // The blockhash of the message the wallet signed, not the one the server reported
  const blockhash = transaction.message.recentBlockhash
  try {
    await connection.sendRawTransaction(transaction.serialize(), { skipPreflight: false, preflightCommitment: 'confirmed' })
  } catch (error) {
    // Rejected by the RPC (preflight): never forwarded, so it paid nobody
    if (error instanceof SendTransactionError) return 'failed'
    return lookUpBatchStatus(connection, signature, blockhash)
  }

  try {
    const confirmation = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed')
    // A landed-but-failed transaction paid nobody
    return confirmation.value.err ? 'failed' : 'confirmed'
  } catch {
    return lookUpBatchStatus(connection, signature, blockhash)
  }
}

/**
 * Custom hook for transaction multisender
 */
export function useTransactionMultisender(): UseTransactionMultisenderReturn {
  const { connection } = useConnection()
  const { signAllTransactions, signTransaction } = useWallet()
  const { config } = useToolConfig('transaction-multisender')

  // Define execution logic (React Compiler handles memoization — no manual useCallback)
  const executeMultisender = async (context: ToolExecutionContext, params: MultisenderParams): Promise<MultisenderResult> => {
    const logger = getLogger({
      context: 'transaction-multisender',
      hook: 'useTransactionMultisender',
    })

    // Fail closed before any wallet prompt when the fee wallet cannot be pinned (production)
    const feeWallet = resolveFeeWalletForVerification()
    const result: MultisenderResult = {
      signatures: [],
      successfulRecipients: 0,
      failedRecipients: [],
      unconfirmedRecipients: [],
      unconfirmedBatches: [],
    }

    try {
      toast.loading('Preparing transactions...', { id: 'multisender-progress' })

      // 1. Prepare transactions via API (one coupon read, so the code sent and the fee limit match)
      const appliedCoupon = getAppliedCoupon()
      const response = await apiClient<MultisenderRequest, UnsignedMultisenderResponse>('/api/solana/transaction-multisender', {
        couponCode: appliedCoupon?.code,
        walletAddress: context.walletAddress,
        tokenMintAddress: params.tokenMintAddress,
        recipients: params.recipients,
      })

      // 2. Deserialize transactions
      const transactions = response.serializedTransactions.map((txStr) => VersionedTransaction.deserialize(Buffer.from(txStr, 'base64')))

      if (transactions.length === 0) {
        throw new AppError('TRANSACTION_FAILED', 'No transactions returned from server')
      }

      // The reported blockhash must be the one the transactions really carry (fail closed): expiry is only ever
      // judged from the blockhash inside the signed message.
      if (transactions.some((transaction) => transaction.message.recentBlockhash !== response.blockhash)) {
        throw new AppError('TRANSACTION_VERIFICATION_FAILED', 'The prepared transactions do not match the blockhash reported by the server')
      }

      // 3. Never sign what the user did not ask for (WEB3-07): every recipient paid exactly once with the
      // entered amount, at most the displayed fee. Then check the balance against the verified costs, and
      // only then simulate (so a low balance reports as such, not as a simulation failure).
      const check = { connection, transactions, toolId: 'transaction-multisender' }
      const summary = await assertPreparedTransactionsMatch(
        check,
        buildMultisenderExpectation(context.walletAddress, feeWallet, params, config?.baseFee ?? 0.001, appliedCoupon?.discountPercentage)
      )
      await assertSufficientBalance(connection, context.walletAddress, summary)
      await assertPreparedTransactionsSimulate(check)
      const lastValidBlockHeight = await resolveConfirmationHeight(connection, response.lastValidBlockHeight)

      toast.loading(`Signing ${transactions.length} transaction(s)...`, { id: 'multisender-progress' })

      // 4. Sign transactions
      let signedTransactions: VersionedTransaction[]
      if (transactions.length === 1 && signTransaction) {
        signedTransactions = [await signTransaction(transactions[0])]
      } else if (transactions.length > 1 && signAllTransactions) {
        signedTransactions = await signAllTransactions(transactions)
      } else {
        throw new AppError('WALLET_CONNECTION_FAILED', 'Wallet does not support signing transactions')
      }
      const signatures = signedTransactions.map(getTransactionId)

      // 5. Send and Confirm — all in parallel so every transaction lands within
      // milliseconds of each other, well within the shared blockhash's expiry window.
      toast.loading(`Sending ${signedTransactions.length} transaction(s)...`, { id: 'multisender-progress' })

      const statuses = await Promise.all(signedTransactions.map((tx, i) => sendBatch(connection, tx, signatures[i], lastValidBlockHeight)))

      statuses.forEach((status, i) => {
        const batchRecipients = summary.paymentIndexesByTransaction[i].map((paymentIndex) => params.recipients[paymentIndex])
        const batchLabel = `Batch ${i + 1}/${signedTransactions.length}`
        const recipientsLabel = `${batchRecipients.length} recipient${batchRecipients.length === 1 ? '' : 's'}`

        if (status === 'confirmed') {
          result.signatures.push(signatures[i])
          result.successfulRecipients += batchRecipients.length
          showTransactionToast(signatures[i], `${batchLabel} sent (${recipientsLabel})`)
        } else if (status === 'failed') {
          // Best-effort per-batch send — other independent batches may have succeeded
          logger.warn(`${batchLabel} failed`, undefined, { recipients: batchRecipients.length })
          result.failedRecipients.push(...batchRecipients)
          toast.error(`${batchLabel} failed: its ${recipientsLabel} were not paid.`)
        } else {
          logger.warn(`${batchLabel} could not be confirmed`, undefined, { recipients: batchRecipients.length })
          result.unconfirmedRecipients.push(...batchRecipients)
          result.unconfirmedBatches.push({ batchNumber: i + 1, signature: signatures[i], recipients: batchRecipients })
          toast.warning(
            `${batchLabel} could not be confirmed (${recipientsLabel}). Check its transaction ${signatures[i]} on the explorer before sending to them again.`
          )
        }
      })
    } catch (error) {
      const isExpected = isUserRejectionError(error) || (error instanceof AppError && error.code === 'INSUFFICIENT_FUNDS')
      const logFn = isExpected ? logger.warn : logger.error
      logFn('Multisender execution failed', error)
      throw error
    } finally {
      toast.dismiss('multisender-progress')
    }

    return result
  }

  // Use useToolBase for wallet validation and error handling
  const toolBase = useToolBase<MultisenderParams, MultisenderResult>(
    {
      toolId: 'transaction-multisender',
      toolName: 'Transaction Multisender',
      requiresWallet: true,
    },
    executeMultisender
  )

  return {
    ...toolBase,
    execute: toolBase.execute,
  }
}

export default useTransactionMultisender
