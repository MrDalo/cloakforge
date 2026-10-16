/**
 * useBurnTokens Hook
 *
 * Client-side hook for burning SPL tokens via server API.
 * Uses useToolBase for wallet validation and error handling.
 *
 * Simplified from 348 lines to ~120 lines (65% reduction).
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { AppError, isUserRejectionError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { validateBalance } from '@/lib/solana/validateBalance'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana'
import { useToolConfig } from '@/stores/toolConfigStore'
import type { UnsignedBurnTransactionResponse } from '@/types/api'
import { formatTokenAmount } from '@/lib/utils/transactionUtils'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { getAppliedCouponCode } from '@/stores/discountCouponStore'
import { isCouponErrorMessage } from '@/lib/utils/discountCouponMessages'

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

interface BurnTokensRequest {
  walletAddress: string
  tokenAccountAddress: string
  mintAddress: string
  amount: number // In token units (not raw amount)
  decimals: number
  tokenSymbol?: string
  tokenName?: string
  /** Optional discount coupon code applied to the service fee */
  couponCode?: string
}

/**
 * Return type for useBurnTokens hook
 * Renames 'execute' from UseToolBaseReturn to 'burnTokens' for clarity
 */
export type UseBurnTokensReturn = Omit<UseToolBaseReturn<BurnTokensParams, BurnTokensResult>, 'execute' | 'validateRequirements'> & {
  burnTokens: UseToolBaseReturn<BurnTokensParams, BurnTokensResult>['execute']
}

/**
 * Custom hook for burning SPL tokens
 *
 * @returns Hook with burnTokens function, loading state, and error handling
 */
export function useBurnTokens(): UseBurnTokensReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('burn-tokens')

  // Define burn execution logic
  const executeBurnTokens = useCallback(
    async (context: ToolExecutionContext, params: BurnTokensParams): Promise<BurnTokensResult> => {
      const { tokenAccountAddress, amount, mintAddress, decimals, tokenSymbol = 'tokens', tokenName } = params

      const logger = getLogger({
        context: 'burn-tokens',
        hook: 'useBurnTokens',
      })

      // Basic parameter validation
      if (!tokenAccountAddress || amount <= 0 || !mintAddress || decimals < 0) {
        throw new AppError('INVALID_INPUT', 'Invalid burn parameters provided')
      }

      // CRITICAL: Validate token account balance before proceeding
      try {
        const tokenAccountInfo = await connection.getParsedAccountInfo(new PublicKey(tokenAccountAddress), 'confirmed')

        if (!tokenAccountInfo.value || !tokenAccountInfo.value.data || typeof tokenAccountInfo.value.data === 'string') {
          throw new AppError('INVALID_INPUT', 'Token account not found or invalid')
        }

        const parsedData = tokenAccountInfo.value.data as {
          parsed: { info: { tokenAmount: { uiAmount: number } } }
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
        if (error instanceof AppError) throw error
        logger.error('Failed to validate token account balance', error)
        throw new AppError('RPC_CONNECTION_FAILED', 'Failed to validate token balance. Please check the token account address.')
      }

      // Client-side SOL balance validation
      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'burn-tokens',
        formData: {},
        serviceFee: config?.baseFee ?? 0.009,
        networkFee: config?.networkFee ?? 0.0005,
      })

      if (!balanceValidation.hasSufficientBalance) {
        throw new AppError(
          'INSUFFICIENT_FUNDS',
          `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL (including ${config?.baseFee?.toFixed(4) ?? '0.009'} SOL service fee), but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
        )
      }

      // Call server API to prepare burn transaction
      const requestBody: BurnTokensRequest = {
        walletAddress: context.walletAddress,
        tokenAccountAddress,
        amount,
        mintAddress,
        decimals,
        tokenSymbol,
        tokenName,
        couponCode: getAppliedCouponCode(),
      }

      let burnResponse: UnsignedBurnTransactionResponse
      try {
        burnResponse = await apiClient<BurnTokensRequest, UnsignedBurnTransactionResponse>('/api/solana/burn-tokens', requestBody)
      } catch (error: unknown) {
        // AppErrors and the server's coupon errors pass through unchanged: useToolBase recognises the
        // coupon messages (isCouponErrorMessage) to update the coupon UI, which a wrapped message defeats
        if (error instanceof AppError || (error instanceof Error && isCouponErrorMessage(error.message))) {
          throw error
        }
        logger.error('API call failed', error)
        throw new AppError('TRANSACTION_FAILED', `Failed to prepare burn transaction. ${(error as Error)?.message ?? 'Unknown error'}`)
      }

      // Deserialize transaction and refresh blockhash
      const transaction = Transaction.from(Buffer.from(burnResponse.serializedTransaction, 'base64'))
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      // Sign the transaction
      let signedTransaction: Transaction
      try {
        signedTransaction = await context.signTransaction(transaction)
      } catch (error) {
        if (error instanceof AppError) {
          throw error
        }

        if (isUserRejectionError(error)) {
          logger.warn('Transaction signing cancelled by user', error)
          throw new AppError('WALLET_SIGNATURE_REJECTED', 'Transaction signing was cancelled by user')
        }

        logger.error('Transaction signing failed', error)
        throw new AppError('TRANSACTION_FAILED', 'Transaction signing failed. Please try again.')
      }

      // Submit transaction
      let signature: string
      try {
        signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })
      } catch (error) {
        if (error instanceof AppError) {
          throw error
        }

        logger.error('Transaction submission failed', error)

        if (error instanceof Error) {
          throw new AppError('TRANSACTION_FAILED', `Failed to submit transaction. ${error.message.toLowerCase()} Please try again.`)
        }

        throw new AppError('TRANSACTION_FAILED', 'Failed to submit transaction. Please try again.')
      }

      // Ultra-fast parallel confirmation strategy
      const { kitRpc } = createConnectionPair()
      const priorityFeeMicroLamports = 50000

      const confirmationResult = await confirmTransactionWithParallelStrategy(signature, priorityFeeMicroLamports, kitRpc, connection)

      if (!confirmationResult.confirmed) {
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

      return {
        signature,
        burnedAmount: amount,
        tokenSymbol,
        message: `Successfully burned ${amount} ${tokenSymbol} ${tokenName ? ` (${tokenName})` : ''}`,
        confirmed: true,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  // Use useToolBase for wallet validation and error handling
  const toolBase = useToolBase<BurnTokensParams, BurnTokensResult>(
    {
      toolId: 'burn-tokens',
      toolName: 'Burn Tokens',
      requiresWallet: true,
    },
    executeBurnTokens
  )

  // Wrapper function that shows success toast after execution
  const burnTokens: UseToolBaseReturn<BurnTokensParams, BurnTokensResult>['execute'] = useCallback(
    async (params: BurnTokensParams) => {
      const result = await toolBase.execute(params)

      if (result) {
        showTransactionToast(result.signature, result.message)
      }

      return result
    },
    [toolBase]
  )

  // Return toolBase properties with 'execute' renamed to 'burnTokens'
  return {
    burnTokens,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}
