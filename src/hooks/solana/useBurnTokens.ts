/**
 * useBurnTokens Hook
 *
 * Client-side hook for burning SPL tokens via server API.
 * Uses server-side API route for transaction preparation and validation.
 * Provides consistent error handling, loading states, and user feedback.
 *
 * Follows the established Token Creator architecture pattern with comprehensive error handling.
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { toast } from 'sonner'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { apiClient } from '@/lib/utils/apiClient'
import { validateBalance } from '@/lib/solana/validateBalance'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana/utils'
import { useToolConfig } from '@/stores/toolConfigStore'
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
  /** Transaction confirmation status */
  confirmed: boolean
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
  const { config } = useToolConfig('burn-tokens')

  // Execution function that will be called by useToolBase
  const executeBurnTokens = useCallback(
    async (context: ToolExecutionContext, params: BurnTokensParams): Promise<BurnTokensResult> => {
      const { tokenAccountAddress, amount, mintAddress, decimals, tokenSymbol = 'tokens', tokenName } = params

      const logger = getLogger({
        context: 'burn-tokens',
        hook: 'useBurnTokens',
        wallet: context.walletAddress,
      })

      // Basic parameter validation (Zod schema already validated at form level)
      if (!tokenAccountAddress || amount <= 0 || !mintAddress || decimals < 0) {
        throw new SolanaError('Invalid burn parameters provided', SOLANA_ERROR_CODES.INVALID_INPUT)
      }

      // Client-side balance validation (fast check before API call)
      const walletPublicKey = new PublicKey(context.walletAddress)

      const balanceValidation = await validateBalance({
        walletPublicKey,
        connection,
        serviceId: 'burn-tokens',
        formData: {
          burnAll: amount === 0, // Assuming 0 means burn all
        },
        serviceFee: config?.baseFee ?? 0.01,
        networkFee: config?.networkFee ?? 0.0005,
      })

      if (!balanceValidation.hasSufficientBalance) {
        const errorMessage = `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL (including ${config?.baseFee?.toFixed(4) ?? '0.0100'} SOL service fee), but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`

        logger.warn('Insufficient wallet balance detected client-side', {
          currentBalance: balanceValidation.currentBalance,
          requiredAmount: balanceValidation.estimatedCost,
        })

        throw new SolanaError(errorMessage, SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS)
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

      let burnResponse: UnsignedBurnTransactionResponse
      try {
        burnResponse = await apiClient<BurnTokensRequest, UnsignedBurnTransactionResponse>('/api/solana/burn-tokens', requestBody)
      } catch (error) {
        logger.error('API call failed', error)

        // Enhanced error handling for API failures
        if (error instanceof Error) {
          if (error.message.includes('Token account not found')) {
            throw new SolanaError('Token account not found. Please verify the token address.', SOLANA_ERROR_CODES.TOKEN_ACCOUNT_NOT_FOUND)
          }
          if (error.message.includes('Insufficient token balance')) {
            throw new SolanaError(`Insufficient ${tokenSymbol} balance for burn operation`, SOLANA_ERROR_CODES.INSUFFICIENT_TOKEN_BALANCE)
          }
          if (error.message.includes('Unauthorized')) {
            throw new SolanaError('You do not have permission to burn from this token account', SOLANA_ERROR_CODES.UNAUTHORIZED_OPERATION)
          }
          if (error.message.includes('network') || error.message.includes('fetch')) {
            throw new SolanaError('Network connection failed. Please check your internet connection.', SOLANA_ERROR_CODES.NETWORK_ERROR)
          }
        }

        throw new SolanaError(
          `Failed to prepare burn transaction. ${error instanceof Error ? error.message : 'Unknown error'}`,
          SOLANA_ERROR_CODES.TRANSACTION_FAILED
        )
      }

      logger.info('Received unsigned burn transaction', {
        rawAmount: burnResponse.rawAmount,
        uiAmount: burnResponse.uiAmount,
        tokenAccount: burnResponse.tokenAccount,
        mint: burnResponse.mint,
      })

      // Deserialize and sign the transaction
      let transaction: Transaction
      try {
        transaction = Transaction.from(Buffer.from(burnResponse.serializedTransaction, 'base64'))
      } catch {
        throw new SolanaError('Failed to deserialize transaction from server', SOLANA_ERROR_CODES.TRANSACTION_FAILED)
      }

      let signedTransaction: Transaction
      try {
        signedTransaction = await context.signTransaction(transaction)
      } catch (error) {
        logger.error('Transaction signing failed', error)
        throw new SolanaError('Transaction signing was cancelled or failed', SOLANA_ERROR_CODES.TRANSACTION_FAILED)
      }

      // Submit transaction to network
      let signature: string
      try {
        signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })
      } catch (error) {
        logger.error('Transaction submission failed', error)
        throw new SolanaError('Failed to submit transaction to network. Please try again.', SOLANA_ERROR_CODES.TRANSACTION_FAILED)
      }

      // Ultra-fast parallel confirmation strategy
      const { kitRpc } = createConnectionPair()
      const priorityFeeMicroLamports = 50000 // Default reasonable priority fee for burn operations

      const confirmationResult = await confirmTransactionWithParallelStrategy(
        signature,
        priorityFeeMicroLamports,
        kitRpc,
        connection,
        logger
      )

      if (!confirmationResult.confirmed) {
        // Transaction failed or timed out
        logger.warn('Transaction confirmation failed or timed out - transaction may still be processing', {
          signature,
          confirmationTime: confirmationResult.confirmationTime,
          method: confirmationResult.method,
        })

        // One final check using legacy connection before failing
        const finalCheck = await connection.getSignatureStatus(signature, {
          searchTransactionHistory: true,
        })

        if (finalCheck?.value?.confirmationStatus === 'confirmed' || finalCheck?.value?.confirmationStatus === 'finalized') {
          // Transaction confirmed successfully
        } else if (finalCheck?.value?.err) {
          throw new Error(`Transaction failed: ${String(finalCheck?.value?.err)}`)
        } else {
          throw new SolanaError(
            'Transaction confirmation timed out - it may still be processing. Check the signature on Solana Explorer.',
            SOLANA_ERROR_CODES.FINALIZATION_TIMEOUT
          )
        }
      }

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
        confirmed: true,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
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
      const result = await toolBase.execute(params)

      if (result) {
        // Show enhanced success toast with transaction link
        toast.success(result.message, {
          description: `Transaction: ${result.signature.slice(0, 8)}...`,
          id: 'burn-tokens-success',
          duration: 10000, // Show longer for success
        })
      }

      return result
    },
    [toolBase]
  )

  return {
    burnTokens,
    ...toolBase,
  }
}
