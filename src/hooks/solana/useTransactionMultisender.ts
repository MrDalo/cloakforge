/**
 * useTransactionMultisender Hook
 *
 * Client-side hook for sending tokens to multiple recipients.
 * Handles batching of recipients into multiple transactions if needed.
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'
import { useToolConfig } from '@/stores/toolConfigStore'
import { apiClient } from '@/lib/utils/apiClient'
import { useToolBase, type UseToolBaseReturn, type ToolExecutionContext } from './useToolBase'
import { AppError } from '@/lib/errors'
import { toast } from 'sonner'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'

// Request type for API call
interface MultisenderRequest {
  walletAddress: string
  tokenMintAddress?: string
  recipients: { address: string; amount: number }[]
  decimals: number
}

// Response type from API
interface UnsignedMultisenderResponse {
  serializedTransaction: string
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
  const { config } = useToolConfig('transaction-multisender')

  // Define execution logic
  const executeMultisender = useCallback(
    async (context: ToolExecutionContext, params: MultisenderParams): Promise<MultisenderResult> => {
      // Batch size of 10 is safe for SPL tokens (CreateATA + Transfer) within 1232 byte limit
      const BATCH_SIZE = 10
      const signatures: string[] = []
      let successfulRecipients = 0
      let failedRecipients = 0

      // Split recipients into chunks
      const chunks = []
      for (let i = 0; i < params.recipients.length; i += BATCH_SIZE) {
        chunks.push(params.recipients.slice(i, i + BATCH_SIZE))
      }

      // Validate balance for the TOTAL amount first (optimization)
      // This is an approximation. Exact fees depend on number of chunks.
      // We'll do a rough check here.
      const totalServiceFee = (config?.baseFee ?? 0.01) * chunks.length
      const totalNetworkFee = (config?.networkFee ?? 0.0005) * chunks.length

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

      // Process chunks sequentially
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const chunkIndex = i + 1

        try {
          toast.loading(`Processing batch ${chunkIndex} of ${chunks.length}...`, { id: 'multisender-progress' })

          // 1. Prepare transaction via API
          const response = await apiClient<MultisenderRequest, UnsignedMultisenderResponse>('/api/solana/transaction-multisender', {
            walletAddress: context.walletAddress,
            tokenMintAddress: params.tokenMintAddress,
            recipients: chunk,
            decimals: params.decimals,
          })

          // 2. Sign transaction
          const transaction = Transaction.from(Buffer.from(response.serializedTransaction, 'base64'))
          const signedTransaction = await context.signTransaction(transaction)

          // 3. Send and Confirm
          const signature = await connection.sendRawTransaction(signedTransaction.serialize())
          await connection.confirmTransaction(signature, 'confirmed')

          signatures.push(signature)
          successfulRecipients += chunk.length

          showTransactionToast(signature, `Batch ${chunkIndex} sent successfully`)
        } catch (error) {
          // console.error(`Batch ${chunkIndex} failed`, error)
          failedRecipients += chunk.length
          toast.error(`Batch ${chunkIndex} failed. Some transfers may not have been sent.`)
          // We continue to next batch? Or stop?
          // Usually better to stop to prevent partial state confusion, or ask user.
          // For now, we throw to stop execution.
          throw error
        }
      }

      toast.dismiss('multisender-progress')
      return { signatures, successfulRecipients, failedRecipients }
    },
    [connection, config?.baseFee, config?.networkFee]
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
