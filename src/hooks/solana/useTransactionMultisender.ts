/**
 * useTransactionMultisender Hook
 *
 * Client-side hook for sending tokens to multiple recipients.
 * Handles batching of recipients into multiple transactions if needed.
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

    // Estimate batches (server uses 10 per batch)
    const BATCH_SIZE = 10
    const estimatedBatches = Math.ceil(params.recipients.length / BATCH_SIZE)

    // Validate balance for the TOTAL amount first (optimization)
    // Fee is per recipient now (0.001 SOL default)
    const totalServiceFee = (config?.baseFee ?? 0.001) * params.recipients.length
    const totalNetworkFee = (config?.networkFee ?? 0.0005) * estimatedBatches

    // Calculate total token amount needed
    const totalTokenAmount = params.recipients.reduce((sum, r) => sum + r.amount, 0)

    // If sending SOL, include it in the balance check
    const totalSolNeeded = params.tokenMintAddress
      ? totalServiceFee + totalNetworkFee
      : totalServiceFee + totalNetworkFee + totalTokenAmount

    // Basic SOL check
    const balance = await connection.getBalance(new PublicKey(context.walletAddress))
    if (balance < totalSolNeeded * 1e9) {
      throw new AppError('INSUFFICIENT_FUNDS', `Insufficient SOL balance. Need approx ${totalSolNeeded.toFixed(4)} SOL`)
    }

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
          await connection.confirmTransaction(
            { signature, blockhash: response.blockhash, lastValidBlockHeight: response.lastValidBlockHeight },
            'confirmed'
          )
          return { signature, index: i }
        })
      )

      for (let i = 0; i < sendResults.length; i++) {
        const result = sendResults[i]
        const batchIndex = i + 1
        if (result.status === 'fulfilled') {
          signatures.push(result.value.signature)
          const recipientsInBatch =
            i === signedTransactions.length - 1 ? params.recipients.length - (signedTransactions.length - 1) * BATCH_SIZE : BATCH_SIZE
          successfulRecipients += recipientsInBatch
          showTransactionToast(result.value.signature, `Batch ${batchIndex}/${signedTransactions.length} sent`)
        } else {
          // Best-effort per-batch send — other independent batches may have succeeded
          logger.warn(`Batch ${batchIndex} failed`, result.reason)
          toast.error(`Batch ${batchIndex} failed.`)
        }
      }
    } catch (error) {
      const logFn = isUserRejectionError(error) ? logger.warn : logger.error
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
