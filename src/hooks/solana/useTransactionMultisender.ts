/**
 * useTransactionMultisender Hook
 *
 * Client-side hook for sending tokens to multiple recipients.
 * Handles batching of recipients into multiple transactions if needed.
 */

import { useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, VersionedTransaction } from '@solana/web3.js'
import { useToolConfig } from '@/stores/toolConfigStore'
import { apiClient } from '@/lib/utils/apiClient'
import { useToolBase, type UseToolBaseReturn, type ToolExecutionContext } from './useToolBase'
import { AppError } from '@/lib/errors'
import { toast } from 'sonner'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { getLogger } from '@/lib/logger/logger'

// Request type for API call
interface MultisenderRequest {
  walletAddress: string
  tokenMintAddress?: string
  recipients: { address: string; amount: number }[]
  decimals: number
}

// Response type from API
interface UnsignedMultisenderResponse {
  serializedTransactions: string[]
  message: string
  totalServiceFee: number
  estimatedNetworkFee: number
}

export interface Recipient {
  address: string
  amount: number
}

// Parameters for the hook
export interface MultisenderParams {
  tokenMintAddress?: string
  recipients: Recipient[]
  decimals: number
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

  // Define execution logic
  const executeMultisender = useCallback(
    async (context: ToolExecutionContext, params: MultisenderParams): Promise<MultisenderResult> => {
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
      const totalSolNeeded =
        params.tokenMintAddress ? totalServiceFee + totalNetworkFee : totalServiceFee + totalNetworkFee + totalTokenAmount

      // Basic SOL check
      const balance = await connection.getBalance(new PublicKey(context.walletAddress))
      if (balance < totalSolNeeded * 1e9) {
        throw new AppError('INSUFFICIENT_FUNDS', `Insufficient SOL balance. Need approx ${totalSolNeeded.toFixed(4)} SOL`)
      }

      try {
        toast.loading('Preparing transactions...', { id: 'multisender-progress' })

        // 1. Prepare transactions via API
        const response = await apiClient<MultisenderRequest, UnsignedMultisenderResponse>('/api/solana/transaction-multisender', {
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

        // 4. Send and Confirm
        toast.loading(`Sending ${signedTransactions.length} transaction(s)...`, { id: 'multisender-progress' })

        for (let i = 0; i < signedTransactions.length; i++) {
          const signedTx = signedTransactions[i]
          const batchIndex = i + 1

          try {
            const signature = await connection.sendRawTransaction(signedTx.serialize())
            await connection.confirmTransaction(signature, 'confirmed')

            signatures.push(signature)
            // We don't know exactly how many recipients were in this batch without parsing,
            // but we can assume BATCH_SIZE for all except last.
            // Or just count total at the end.
            const recipientsInBatch =
              i === signedTransactions.length - 1 ? params.recipients.length - (signedTransactions.length - 1) * BATCH_SIZE : BATCH_SIZE
            successfulRecipients += recipientsInBatch

            showTransactionToast(signature, `Batch ${batchIndex}/${signedTransactions.length} sent`)
          } catch (error) {
            logger.error(`Batch ${batchIndex} failed`, error)
            toast.error(`Batch ${batchIndex} failed.`)
            // Continue or stop?
            // If one fails, others might still succeed.
            // But if it's a sequence, maybe stop?
            // Let's continue to try sending others.
          }
        }
      } catch (error) {
        logger.error('Multisender execution failed', error)
        throw error
      } finally {
        toast.dismiss('multisender-progress')
      }

      return { signatures, successfulRecipients, failedRecipients: params.recipients.length - successfulRecipients }
    },
    [connection, config?.baseFee, config?.networkFee, signAllTransactions, signTransaction]
  )

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
