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
import { useQueryClient } from '@tanstack/react-query'
import { PublicKey, Transaction } from '@solana/web3.js'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { AppError, SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { apiClient } from '@/lib/utils/apiClient'
import { validateBalance } from '@/lib/solana/validateBalance'
import { refreshForPhantom } from '@/lib/solana/phantomFix'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana/utils'
import { useToolConfig } from '@/stores/toolConfigStore'
import { walletTokensQueryKeys } from '@/hooks/queries/useWalletTokensForTool'
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
  const queryClient = useQueryClient()

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

      // CRITICAL: Validate token account balance before proceeding
      // This prevents wasting transaction fees on failed burn attempts
      try {
        const tokenAccountInfo = await connection.getParsedAccountInfo(new PublicKey(tokenAccountAddress), 'confirmed')

        if (!tokenAccountInfo.value) {
          throw new SolanaError('Token account not found or does not exist', SOLANA_ERROR_CODES.INVALID_INPUT)
        }

        if (!tokenAccountInfo.value.data || typeof tokenAccountInfo.value.data === 'string') {
          throw new SolanaError('Invalid token account data', SOLANA_ERROR_CODES.INVALID_INPUT)
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
          throw new SolanaError(
            `Insufficient token balance. You have ${formatTokenAmount(currentBalance, decimals)} ${tokenSymbol} but are trying to burn ${formatTokenAmount(amount, decimals)} ${tokenSymbol}. You need ${formatTokenAmount(shortfall, decimals)} more tokens.`,
            SOLANA_ERROR_CODES.BURN_AMOUNT_EXCEEDS_BALANCE
          )
        }
      } catch (error) {
        if (error instanceof AppError || error instanceof SolanaError) {
          throw error
        }
        logger.error('Failed to validate token account balance', error)
        throw new SolanaError('Failed to validate token balance. Please check the token account address.', SOLANA_ERROR_CODES.RPC_ERROR)
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
      } catch (error: unknown) {
        if (error instanceof AppError || error instanceof SolanaError) {
          throw error
        }
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
            throw new SolanaError('Unauthorized: You do not have permission to burn these tokens', SOLANA_ERROR_CODES.UNAUTHORIZED)
          }
          if ((error as Error).message.includes('network') || (error as Error).message.includes('fetch')) {
            throw new SolanaError('Network error occurred. Please check your connection and try again.', SOLANA_ERROR_CODES.NETWORK_ERROR)
          }
        }

        throw new SolanaError(
          `Failed to prepare burn transaction. ${(error as Error)?.message ?? 'Unknown error'}`,
          SOLANA_ERROR_CODES.TRANSACTION_FAILED
        )
      }

      // CRITICAL PHANTOM FIX: Use the Phantom compatibility utility
      // This refreshes the transaction with ultra-fresh blockhash to eliminate simulation warnings
      logger.info('Applying Phantom compatibility fix to prevent simulation warnings')
      const phantomFixResult = await refreshForPhantom(burnResponse.serializedTransaction, new PublicKey(context.walletAddress), connection)

      if (!phantomFixResult.success) {
        logger.warn('Phantom fix failed, using original transaction', {
          error: phantomFixResult.error,
        })
      }

      // Use the phantom-fixed transaction or fallback to original
      const finalTransactionBase64 = phantomFixResult.success ? phantomFixResult.transaction! : burnResponse.serializedTransaction

      // Deserialize the refreshed transaction
      let transaction: Transaction
      try {
        transaction = Transaction.from(Buffer.from(finalTransactionBase64, 'base64'))
      } catch (error) {
        if (error instanceof AppError || error instanceof SolanaError) {
          throw error
        }
        throw new SolanaError('Failed to deserialize transaction from server', SOLANA_ERROR_CODES.TRANSACTION_FAILED)
      }

      let signedTransaction: Transaction
      try {
        signedTransaction = await context.signTransaction(transaction)
      } catch (error) {
        if (error instanceof AppError || error instanceof SolanaError) {
          throw error
        }
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
        if (error instanceof AppError || error instanceof SolanaError) {
          throw error
        }
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

      const successMessage = `Successfully burned ${amount} ${tokenSymbol} ${tokenName ? ` (${tokenName})` : ''}`

      // Invalidate wallet tokens queries to refresh token balances
      await queryClient.invalidateQueries({
        queryKey: walletTokensQueryKeys.wallet(context.walletAddress),
      })

      return {
        signature,
        burnedAmount: amount,
        tokenSymbol,
        message: successMessage,
        confirmed: true,
      }
    },
    [connection, config?.baseFee, config?.networkFee, queryClient]
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
