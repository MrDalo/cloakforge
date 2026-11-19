/**
 * useTransactionMultisender Hook
 *
 * Client-side hook for sending tokens to multiple recipients.
 *
 * The server packs the recipients into as few v0 transactions as the transaction size limit
 * allows (usually one). All of them share a single blockhash and are signed in ONE wallet
 * approval (`signAllTransactions`), then broadcast in parallel.
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { apiClient } from '@/lib/utils/apiClient'
import { useToolBase, type UseToolBaseReturn, type ToolExecutionContext } from './useToolBase'
import { AppError, isUserRejectionError } from '@/lib/errors'
import { toast } from 'sonner'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { getLogger } from '@/lib/logger/logger'
import { getAppliedCouponCode } from '@/stores/discountCouponStore'
import type { MultisenderBatch, MultisenderRecipient, UnsignedMultisenderResponse } from '@/types/api'

// Request type for API call
interface MultisenderRequest {
  walletAddress: string
  tokenMintAddress?: string
  recipients: MultisenderRecipient[]
  decimals?: number
  couponCode?: string
}

export type Recipient = MultisenderRecipient

// Parameters for the hook
export interface MultisenderParams {
  /** Token mint to send; omit to send native SOL */
  tokenMintAddress?: string
  recipients: Recipient[]
  /** Decimals shown in the UI — a hint only, the server scales amounts with the on-chain mint decimals */
  decimals?: number
}

// Result type
export interface MultisenderResult {
  /** Signatures of the confirmed transactions */
  signatures: string[]
  /** Number of transactions the send was split into */
  transactionCount: number
  successfulRecipients: number
  failedRecipients: number
  /** Recipients whose transaction failed — can be re-submitted as-is */
  failedRecipientList: Recipient[]
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

const PROGRESS_TOAST_ID = 'multisender-progress'

/** Recipients covered by a batch, in request order. */
const recipientsOfBatch = (recipients: Recipient[], batch: MultisenderBatch): Recipient[] =>
  recipients.slice(batch.startIndex, batch.startIndex + batch.recipientCount)

/**
 * Custom hook for transaction multisender
 */
export function useTransactionMultisender(): UseTransactionMultisenderReturn {
  const { connection } = useConnection()
  const { signAllTransactions, signTransaction } = useWallet()

  /**
   * Signs every transaction with a single wallet approval whenever the wallet supports it.
   * One signature can only ever cover one transaction, so wallets without `signAllTransactions`
   * fall back to approving each transaction in turn.
   */
  const signTransactions = async (transactions: VersionedTransaction[]): Promise<VersionedTransaction[]> => {
    if (transactions.length === 1 && signTransaction) {
      return [await signTransaction(transactions[0])]
    }
    if (signAllTransactions) {
      return signAllTransactions(transactions)
    }
    if (signTransaction) {
      toast.info(`Your wallet cannot sign batches at once — please approve ${transactions.length} transactions in turn.`)
      const signed: VersionedTransaction[] = []
      for (const transaction of transactions) {
        signed.push(await signTransaction(transaction))
      }
      return signed
    }
    throw new AppError('WALLET_CONNECTION_FAILED', 'Wallet does not support signing transactions')
  }

  // Define execution logic (React Compiler handles memoization — no manual useCallback)
  const executeMultisender = async (context: ToolExecutionContext, params: MultisenderParams): Promise<MultisenderResult> => {
    const logger = getLogger({
      context: 'transaction-multisender',
      hook: 'useTransactionMultisender',
    })

    if (params.recipients.length === 0) {
      throw new AppError('INVALID_INPUT', 'At least one recipient is required')
    }

    try {
      toast.loading('Preparing transactions...', { id: PROGRESS_TOAST_ID })

      // 1. Prepare transactions via API — the server packs recipients by transaction size and
      //    resolves the real token decimals, so fees and batch layout come from the response.
      const response = await apiClient<MultisenderRequest, UnsignedMultisenderResponse>('/api/solana/transaction-multisender', {
        couponCode: getAppliedCouponCode(),
        walletAddress: context.walletAddress,
        tokenMintAddress: params.tokenMintAddress,
        recipients: params.recipients,
        decimals: params.decimals,
      })

      // 2. Deserialize transactions
      const transactions = response.serializedTransactions.map((txStr) => VersionedTransaction.deserialize(Buffer.from(txStr, 'base64')))

      if (transactions.length === 0 || response.batches.length !== transactions.length) {
        throw new AppError('TRANSACTION_FAILED', 'No transactions returned from server')
      }

      // 3. SOL balance check with the exact server-side fee figures (plus the SOL being sent for native sends)
      const totalTokenAmount = params.recipients.reduce((sum, r) => sum + r.amount, 0)
      const totalSolNeeded = response.totalServiceFee + response.estimatedNetworkFee + (params.tokenMintAddress ? 0 : totalTokenAmount)

      const balance = await connection.getBalance(new PublicKey(context.walletAddress))
      if (balance < totalSolNeeded * 1e9) {
        throw new AppError('INSUFFICIENT_FUNDS', `Insufficient SOL balance. Need approx ${totalSolNeeded.toFixed(4)} SOL`)
      }

      // 4. Sign — one wallet approval for all transactions
      toast.loading(
        transactions.length === 1
          ? 'Approve the transaction in your wallet...'
          : `Approve ${transactions.length} transactions in your wallet...`,
        { id: PROGRESS_TOAST_ID }
      )
      const signedTransactions = await signTransactions(transactions)

      // 5. Send and Confirm — all in parallel so every transaction lands within
      // milliseconds of each other, well within the shared blockhash's expiry window.
      // Use allSettled to continue collecting results even if individual batches fail.
      toast.loading(`Sending ${signedTransactions.length} transaction(s)...`, { id: PROGRESS_TOAST_ID })

      const sendResults = await Promise.allSettled(
        signedTransactions.map(async (signedTx) => {
          const signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          })
          await connection.confirmTransaction(
            { signature, blockhash: response.blockhash, lastValidBlockHeight: response.lastValidBlockHeight },
            'confirmed'
          )
          return signature
        })
      )

      // 6. Account per batch using the server's batch layout
      const signatures: string[] = []
      const failedRecipientList: Recipient[] = []
      let successfulRecipients = 0

      sendResults.forEach((result, i) => {
        const batch = response.batches[i]
        const batchIndex = i + 1
        if (result.status === 'fulfilled') {
          signatures.push(result.value)
          successfulRecipients += batch.recipientCount
          showTransactionToast(result.value, `Batch ${batchIndex}/${signedTransactions.length} sent`)
        } else {
          // Best-effort per-batch send — other independent batches may have succeeded
          failedRecipientList.push(...recipientsOfBatch(params.recipients, batch))
          logger.warn(`Batch ${batchIndex} failed`, result.reason)
          toast.error(`Batch ${batchIndex} failed.`)
        }
      })

      return {
        signatures,
        transactionCount: signedTransactions.length,
        successfulRecipients,
        failedRecipients: failedRecipientList.length,
        failedRecipientList,
      }
    } catch (error) {
      const logFn = isUserRejectionError(error) ? logger.warn : logger.error
      logFn('Multisender execution failed', error)
      throw error
    } finally {
      toast.dismiss(PROGRESS_TOAST_ID)
    }
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
