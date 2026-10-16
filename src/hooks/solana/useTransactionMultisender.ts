/**
 * useTransactionMultisender Hook
 *
 * Client-side hook for sending tokens to multiple recipients.
 * The server packs recipients into as many transactions as the packet size limit requires
 * (batches are uneven) and returns how many recipients each transaction pays.
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useToolConfig } from '@/stores/toolConfigStore'
import { apiClient } from '@/lib/utils/apiClient'
import { useToolBase, type UseToolBaseReturn, type ToolExecutionContext } from './useToolBase'
import { AppError, isUserRejectionError } from '@/lib/errors'
import { toast } from 'sonner'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { getLogger } from '@/lib/logger/logger'
import { getAppliedCouponCode } from '@/stores/discountCouponStore'

// Request type for API call
interface MultisenderRequest {
  walletAddress: string
  tokenMintAddress?: string
  recipients: { address: string; amount: number }[]
  /** Deprecated and ignored by the server (decimals are read from the mint on-chain) */
  decimals?: number
  couponCode?: string
}

// Response type from API
interface UnsignedMultisenderResponse {
  serializedTransactions: string[]
  /** Recipients paid by each transaction, aligned with `serializedTransactions` */
  recipientCounts: number[]
  message: string
  totalServiceFee: number
  estimatedNetworkFee: number
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
  /** Optional: informational only — the server always uses the mint's on-chain decimals */
  decimals?: number
}

// Result type
export interface MultisenderResult {
  signatures: string[]
  successfulRecipients: number
  failedRecipients: number
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

/**
 * Checks that the server's per-transaction recipient counts line up with the transactions and the request,
 * so success accounting is exact (and a malformed response is rejected before anything is signed).
 */
const hasConsistentRecipientCounts = (recipientCounts: unknown, transactionCount: number, recipientCount: number): boolean =>
  Array.isArray(recipientCounts) &&
  recipientCounts.length === transactionCount &&
  recipientCounts.every((count) => Number.isInteger(count) && count > 0) &&
  recipientCounts.reduce((sum: number, count: number) => sum + count, 0) === recipientCount

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

    const signatures: string[] = []
    let successfulRecipients = 0

    try {
      toast.loading('Preparing transactions...', { id: 'multisender-progress' })

      // 1. Prepare transactions via API
      const response = await apiClient<MultisenderRequest, UnsignedMultisenderResponse>('/api/solana/transaction-multisender', {
        couponCode: getAppliedCouponCode(),
        walletAddress: context.walletAddress,
        tokenMintAddress: params.tokenMintAddress,
        recipients: params.recipients,
        decimals: params.decimals,
      })

      // 2. Deserialize transactions
      const transactions = response.serializedTransactions.map((txStr) => VersionedTransaction.deserialize(Buffer.from(txStr, 'base64')))

      if (transactions.length === 0) {
        throw new AppError('TRANSACTION_FAILED', 'No transactions returned from server')
      }

      const { recipientCounts } = response
      if (!hasConsistentRecipientCounts(recipientCounts, transactions.length, params.recipients.length)) {
        throw new AppError('TRANSACTION_FAILED', 'The server returned inconsistent batch information. Please try again.')
      }

      // Validate the SOL balance for the TOTAL cost: the real number of transactions and the
      // server-computed (coupon-aware) service fee. SOL sends also need the amounts themselves.
      const totalNetworkFee = (config?.networkFee ?? 0.0005) * transactions.length
      const totalTokenAmount = params.recipients.reduce((sum, r) => sum + r.amount, 0)
      const totalSolNeeded = params.tokenMintAddress
        ? response.totalServiceFee + totalNetworkFee
        : response.totalServiceFee + totalNetworkFee + totalTokenAmount

      const balance = await connection.getBalance(new PublicKey(context.walletAddress))
      if (balance < totalSolNeeded * 1e9) {
        throw new AppError('INSUFFICIENT_FUNDS', `Insufficient SOL balance. Need approx ${totalSolNeeded.toFixed(4)} SOL`)
      }

      toast.loading(`Signing ${transactions.length} transaction(s)...`, { id: 'multisender-progress' })

      // 3. Sign transactions
      let signedTransactions: VersionedTransaction[]
      if (transactions.length === 1 && signTransaction) {
        signedTransactions = [await signTransaction(transactions[0])]
      } else if (transactions.length > 1 && signAllTransactions) {
        signedTransactions = await signAllTransactions(transactions)
      } else {
        throw new AppError('WALLET_CONNECTION_FAILED', 'Wallet does not support signing transactions')
      }

      // 4. Send and Confirm — all in parallel so every transaction lands within
      // milliseconds of each other, well within the shared blockhash's expiry window.
      // Use allSettled to continue collecting results even if individual batches fail.
      toast.loading(`Sending ${signedTransactions.length} transaction(s)...`, { id: 'multisender-progress' })

      const sendResults = await Promise.allSettled(
        signedTransactions.map(async (signedTx, i) => {
          const signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          })
          const confirmation = await connection.confirmTransaction(
            { signature, blockhash: response.blockhash, lastValidBlockHeight: response.lastValidBlockHeight },
            'confirmed'
          )
          // A landed-but-failed transaction paid nobody: count it as failed
          if (confirmation.value.err) {
            throw new AppError('TRANSACTION_FAILED', `Batch ${i + 1} failed on-chain`)
          }
          return { signature, index: i }
        })
      )

      for (let i = 0; i < sendResults.length; i++) {
        const result = sendResults[i]
        const batchIndex = i + 1
        if (result.status === 'fulfilled') {
          signatures.push(result.value.signature)
          successfulRecipients += recipientCounts[i]
          showTransactionToast(
            result.value.signature,
            `Batch ${batchIndex}/${signedTransactions.length} sent (${recipientCounts[i]} recipient${recipientCounts[i] === 1 ? '' : 's'})`
          )
        } else {
          // Best-effort per-batch send — other independent batches may have succeeded
          logger.warn(`Batch ${batchIndex} failed`, result.reason)
          toast.error(`Batch ${batchIndex} failed.`)
        }
      }
    } catch (error) {
      const isExpected = isUserRejectionError(error) || (error instanceof AppError && error.code === 'INSUFFICIENT_FUNDS')
      const logFn = isExpected ? logger.warn : logger.error
      logFn('Multisender execution failed', error)
      throw error
    } finally {
      toast.dismiss('multisender-progress')
    }

    return { signatures, successfulRecipients, failedRecipients: params.recipients.length - successfulRecipients }
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
