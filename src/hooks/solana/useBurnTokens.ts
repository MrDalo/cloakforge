/**
 * useBurnTokens Hook
 *
 * Client-side hook for burning SPL tokens via server API.
 * Uses server-side API route for transaction preparation and validation.
 * Provides consistent error handling, loading states, and user feedback.
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { sendAndConfirmTransaction, Transaction } from '@solana/web3.js'
import { toast } from 'sonner'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { apiClient } from '@/lib/utils/apiClient'
import type { BurnTokensRequest, UnsignedBurnTransactionResponse } from '@/types/api'

export interface BurnTokensParams {
  /** Token account address to burn from */
  tokenAccountAddress: string
  /** Amount to burn (in token units, not raw amount) */
  amount: number
  /** Token mint address for validation */
  mintAddress: string
  /** Token decimals for proper calculation */
  decimals: number
  /** Token symbol for user feedback */
  tokenSymbol?: string
  /** Token name for user feedback */
  tokenName?: string
}

export interface BurnTokensResult {
  /** Transaction signature */
  signature: string
  /** Amount that was burned (in UI token units) */
  burnedAmount: number
  /** Token symbol that was burned */
  tokenSymbol: string
  /** Success message */
  message: string
}

/**
 * Custom hook for burning SPL tokens
 *
 * @returns Hook with burn function, loading state, and error handling
 */
export function useBurnTokens(): UseToolBaseReturn<BurnTokensParams, BurnTokensResult> & {
  burnTokens: (params: BurnTokensParams) => Promise<BurnTokensResult | null>
} {
  const { connection } = useConnection()

  // Execution function that will be called by useToolBase
  const executeBurnTokens = useCallback(
    async (context: ToolExecutionContext, params: BurnTokensParams): Promise<BurnTokensResult> => {
      const { tokenAccountAddress, amount, mintAddress, decimals, tokenSymbol = 'tokens', tokenName } = params

      const logger = getLogger({
        context: 'burn-tokens',
        hook: 'useBurnTokens',
        wallet: context.walletAddress,
      })

      logger.info('Starting token burn process via API', {
        tokenAccount: tokenAccountAddress,
        amount,
        mint: mintAddress,
        decimals,
        tokenSymbol,
      })

      // Basic parameter validation (Zod schema already validated at form level)
      if (!tokenAccountAddress || amount <= 0 || !mintAddress || decimals < 0) {
        throw new SolanaError('Invalid burn parameters', SOLANA_ERROR_CODES.INVALID_INPUT)
      }

      // Call the server API to prepare burn transaction using type-safe API client
      const requestBody: BurnTokensRequest = {
        walletAddress: context.walletAddress,
        tokenAccountAddress,
        amount,
        mintAddress,
        decimals,
        tokenSymbol,
        tokenName,
      }

      const burnResponse = await apiClient<BurnTokensRequest, UnsignedBurnTransactionResponse>('/api/solana/burn-tokens', requestBody)

      logger.info('Received unsigned burn transaction', {
        rawAmount: burnResponse.rawAmount,
        uiAmount: burnResponse.uiAmount,
        tokenAccount: burnResponse.tokenAccount,
        mint: burnResponse.mint,
      })

      // Deserialize the transaction
      const transaction = Transaction.from(Buffer.from(burnResponse.serializedTransaction, 'base64'))

      // Sign the transaction
      const signedTransaction = await context.signTransaction(transaction)

      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(connection, signedTransaction, [])

      logger.info('Burn transaction confirmed', {
        signature,
        tokenSymbol,
        amount,
      })

      const successMessage = `Successfully burned ${amount} ${tokenSymbol}${tokenName ? ` (${tokenName})` : ''}`

      logger.info('Token burn completed successfully', {
        signature,
        amount,
        tokenSymbol,
        tokenName,
      })

      return {
        signature,
        burnedAmount: amount,
        tokenSymbol,
        message: successMessage,
      }
    },
    [connection]
  )

  // Use the base tool hook for consistent error handling and loading states
  const toolBase = useToolBase<BurnTokensParams, BurnTokensResult>(
    {
      toolId: 'burn-tokens',
      toolName: 'Burn Tokens',
      requiresWallet: true,
    },
    executeBurnTokens
  )

  // Wrapper function that provides enhanced user feedback
  const burnTokens = useCallback(
    async (params: BurnTokensParams): Promise<BurnTokensResult | null> => {
      const { tokenSymbol = 'tokens', amount } = params

      // Show loading toast
      toast.loading(`Burning ${amount} ${tokenSymbol}...`, {
        id: 'burn-tokens-loading',
      })

      try {
        const result = await toolBase.execute(params)

        // Dismiss loading toast
        toast.dismiss('burn-tokens-loading')

        if (result) {
          // Show success toast
          toast.success(result.message, {
            description: `Transaction signature: ${result.signature.slice(0, 8)}...`,
            id: 'burn-tokens-success',
          })
        }

        return result
      } catch (error) {
        // Dismiss loading toast
        toast.dismiss('burn-tokens-loading')

        // Log error for debugging
        const logger = getLogger({
          context: 'burn-tokens',
          hook: 'useBurnTokens',
          function: 'burnTokens',
        })

        logger.error('Burn tokens execution failed', error, {
          tokenAccount: params.tokenAccountAddress,
          amount: params.amount,
          tokenSymbol,
        })

        // Show user-friendly error message
        let errorMessage = `Failed to burn ${tokenSymbol}. Please try again.`

        if (error instanceof SolanaError) {
          switch (error.code) {
            case SOLANA_ERROR_CODES.INSUFFICIENT_TOKEN_BALANCE:
              errorMessage = `Insufficient ${tokenSymbol} balance for burn operation`
              break
            case SOLANA_ERROR_CODES.TOKEN_ACCOUNT_NOT_FOUND:
              errorMessage = 'Token account not found or invalid'
              break
            case SOLANA_ERROR_CODES.UNAUTHORIZED_OPERATION:
              errorMessage = 'You do not have permission to burn these tokens'
              break
            case SOLANA_ERROR_CODES.TRANSACTION_FAILED:
              errorMessage = 'Transaction failed. Please try again'
              break
            case SOLANA_ERROR_CODES.WALLET_NOT_CONNECTED:
              errorMessage = 'Please connect your wallet to burn tokens'
              break
            default:
              errorMessage = `Failed to burn ${tokenSymbol}: ${error.message}`
          }
        }

        toast.error(errorMessage, {
          id: 'burn-tokens-error',
        })

        return null
      }
    },
    [toolBase]
  )

  return {
    burnTokens,
    ...toolBase,
  }
}
