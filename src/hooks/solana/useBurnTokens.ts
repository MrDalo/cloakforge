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

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { validateBalance } from '@/lib/solana/validateBalance'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana/utils'
import { useToolConfig } from '@/stores/toolConfigStore'
import type { BurnTokensRequest, UnsignedBurnTransactionResponse } from '@/types/api'
import { formatTokenAmount } from '@/lib/utils/transactionUtils'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'

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
        throw new AppError('INVALID_INPUT', 'Invalid burn parameters provided')
      }

      // CRITICAL: Validate token account balance before proceeding
      // This prevents wasting transaction fees on failed burn attempts
      try {
        const tokenAccountInfo = await connection.getParsedAccountInfo(new PublicKey(tokenAccountAddress), 'confirmed')

        if (!tokenAccountInfo.value) {
          throw new AppError('INVALID_INPUT', 'Token account not found or does not exist')
        }

        if (!tokenAccountInfo.value.data || typeof tokenAccountInfo.value.data === 'string') {
          throw new AppError('INVALID_INPUT', 'Invalid token account data')
        }

        const parsedData = tokenAccountInfo.value.data as {
          program: string
          parsed: {
            info: {
              tokenAmount: {
                amount: string
                decimals: number
                uiAmount: number
                uiAmountString: string
              }
            }
          }
        }

        const currentBalance = parsedData.parsed.info.tokenAmount.uiAmount

        if (currentBalance < amount) {
          const shortfall = amount - currentBalance
          throw new AppError(
            'INSUFFICIENT_TOKEN_BALANCE',
            `Insufficient token balance. You have ${formatTokenAmount(currentBalance, decimals)} ${tokenSymbol} but are trying to burn ${formatTokenAmount(amount, decimals)} ${tokenSymbol}. You need ${formatTokenAmount(shortfall, decimals)} more tokens.`
          )
        }
      } catch (error) {
        if (error instanceof AppError) {
          throw error
        }
        logger.error('Failed to validate token account balance', error)
        throw new AppError('RPC_CONNECTION_FAILED', 'Failed to validate token balance. Please check the token account address.')
      }

      // Client-side SOL balance validation (for transaction fees)
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

        throw new AppError('INSUFFICIENT_FUNDS', errorMessage)
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
      } catch (error: unknown) {
        if (error instanceof AppError) {
          throw error
        }
        logger.error('API call failed', error)

        // Enhanced error handling for API failures
        if (error instanceof Error) {
          if (error.message.includes('Token account not found')) {
            throw new AppError('TOKEN_ACCOUNT_NOT_FOUND', 'Token account not found. Please verify the token address.')
          }
          if (error.message.includes('Insufficient token balance')) {
            throw new AppError('INSUFFICIENT_TOKEN_BALANCE', `Insufficient ${tokenSymbol} balance for burn operation`)
          }
          if (error.message.includes('Unauthorized')) {
            throw new AppError('UNAUTHORIZED', 'Unauthorized: You do not have permission to burn these tokens')
          }
          if ((error as Error).message.includes('network') || (error as Error).message.includes('fetch')) {
            throw new AppError('NETWORK_ERROR', 'Network error occurred. Please check your connection and try again.')
          }
        }

        throw new AppError('TRANSACTION_FAILED', `Failed to prepare burn transaction. ${(error as Error)?.message ?? 'Unknown error'}`)
      }

      // Deserialize transaction and refresh blockhash (following Token Creator pattern)
      let transaction: Transaction
      try {
        transaction = Transaction.from(Buffer.from(burnResponse.serializedTransaction, 'base64'))

        // ✅ CRITICAL FIX: Get fresh blockhash to prevent expiration
        // This prevents "blockhash not found" errors when user takes time to approve
        const { blockhash } = await connection.getLatestBlockhash('confirmed')
        transaction.recentBlockhash = blockhash

        logger.info('Transaction deserialized with fresh blockhash', {
          blockhash,
          instructionCount: transaction.instructions.length,
        })
      } catch (error) {
        if (error instanceof AppError) {
          throw error
        }
        logger.error('Transaction deserialization failed', error)
        throw new AppError('TRANSACTION_FAILED', 'Failed to deserialize transaction from server')
      }

      // Sign the transaction
      let signedTransaction: Transaction
      try {
        logger.info('Requesting wallet signature for burn transaction')
        signedTransaction = await context.signTransaction(transaction)
        logger.info('Transaction signed successfully by wallet')
      } catch (error) {
        if (error instanceof AppError) {
          throw error
        }
        logger.error('Transaction signing failed', error, {
          errorMessage: error instanceof Error ? error.message : String(error),
        })

        // Handle user rejection specifically
        if (error instanceof Error && (error.message.includes('User rejected') || error.message.includes('cancelled'))) {
          throw new AppError('TRANSACTION_FAILED', 'Transaction signing was cancelled by user')
        }

        throw new AppError('TRANSACTION_FAILED', 'Transaction signing failed. Please try again.')
      }

      // Submit transaction with improved error handling
      let signature: string
      try {
        logger.info('Submitting burn transaction to network')

        signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })

        logger.info('Transaction submitted successfully', { signature })
      } catch (error) {
        if (error instanceof AppError) {
          throw error
        }

        logger.error('Transaction submission failed', error, {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorDetails: error,
        })

        // Parse Solana-specific errors for better user feedback
        if (error instanceof Error) {
          const errorMsg = error.message.toLowerCase()

          if (errorMsg.includes('blockhash not found') || errorMsg.includes('blockhash expired')) {
            throw new AppError('BLOCKHASH_EXPIRED', 'Transaction expired. Please try again.')
          }

          if (errorMsg.includes('insufficient funds')) {
            throw new AppError('INSUFFICIENT_FUNDS', 'Insufficient SOL for transaction fees')
          }

          if (errorMsg.includes('simulation failed')) {
            throw new AppError('SIMULATION_FAILED', 'Transaction would fail. Please check your inputs and try again.')
          }

          if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('timeout')) {
            throw new AppError('NETWORK_ERROR', 'Network error. Please check your connection and try again.')
          }
        }

        throw new AppError('TRANSACTION_FAILED', 'Failed to submit transaction. Please try again.')
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
          throw new AppError(
            'FINALIZATION_TIMEOUT',
            'Transaction confirmation timed out - it may still be processing. Check the signature on Solana Explorer.'
          )
        }
      }

      const successMessage = `Successfully burned ${amount} ${tokenSymbol} ${tokenName ? ` (${tokenName})` : ''}`

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
        showTransactionToast(result.signature, result.message)
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
