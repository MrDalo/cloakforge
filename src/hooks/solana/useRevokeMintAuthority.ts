/**
 * useRevokeMintAuthority Hook
 *
 * Client-side hook for revoking mint authority from SPL tokens via server API.
 * Uses server-side API route for transaction preparation and validation.
 * Provides consistent error handling, loading states, and user feedback.
 *
 * Follows the established architecture pattern from useTokenCreator.ts and useBurnTokens.ts.
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'
import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { apiClient } from '@/lib/utils/apiClient'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { validateBalance } from '@/lib/solana/validateBalance'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana/utils'
import { useToolConfig } from '@/stores/toolConfigStore'

// Request type for API call
type RevokeMintAuthorityRequest = {
  walletAddress: string
  tokenAddress: string
}

// Response type from API
type UnsignedRevokeMintAuthorityResponse = {
  serializedTransaction: string
  message: string
}

// Parameters for the hook
export interface RevokeMintAuthorityParams {
  tokenAddress: string
}

// Result type
export interface RevokeMintAuthorityResult {
  signature: string
  tokenAddress: string
  message: string
}

/**
 * Custom hook for revoking mint authority from SPL tokens
 *
 * @returns Hook with revokeMintAuthority function, loading state, and error handling
 */
export function useRevokeMintAuthority(): UseToolBaseReturn<RevokeMintAuthorityParams, RevokeMintAuthorityResult> & {
  revokeMintAuthority: (params: RevokeMintAuthorityParams) => Promise<RevokeMintAuthorityResult | null>
} {
  const { connection } = useConnection()
  const { config } = useToolConfig('revoke-mint-authority')

  // Execution function that will be called by useToolBase
  const executeRevokeMintAuthority = useCallback(
    async (context: ToolExecutionContext, params: RevokeMintAuthorityParams): Promise<RevokeMintAuthorityResult> => {
      const { tokenAddress } = params

      const logger = getLogger({
        context: 'revoke-mint-authority',
        hook: 'useRevokeMintAuthority',
        wallet: context.walletAddress,
        token: tokenAddress,
      })

      // Basic parameter validation
      if (!tokenAddress) {
        throw new SolanaError('Token address is required', SOLANA_ERROR_CODES.INVALID_INPUT)
      }

      // Validate token address format
      try {
        new PublicKey(tokenAddress)
      } catch {
        throw new SolanaError('Invalid token address format', SOLANA_ERROR_CODES.INVALID_MINT_ADDRESS)
      }

      // Client-side balance validation (fast check before API call)
      const walletPublicKey = new PublicKey(context.walletAddress)

      const balanceValidation = await validateBalance({
        walletPublicKey,
        connection,
        serviceId: 'revoke-mint-authority',
        formData: {},
        serviceFee: config?.baseFee ?? 0.01,
        networkFee: config?.networkFee ?? 0.0005,
      })

      if (!balanceValidation.hasSufficientBalance) {
        const errorMessage = `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL (including ${config?.baseFee?.toFixed(4) ?? '0.01'} SOL service fee), but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`

        logger.warn('Insufficient wallet balance detected client-side', {
          currentBalance: balanceValidation.currentBalance,
          requiredAmount: balanceValidation.estimatedCost,
        })

        throw new SolanaError(errorMessage, SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS)
      }

      // Call the server API to prepare revoke mint authority transaction
      const requestBody: RevokeMintAuthorityRequest = {
        walletAddress: context.walletAddress,
        tokenAddress,
      }

      const revokeResponse = await apiClient<RevokeMintAuthorityRequest, UnsignedRevokeMintAuthorityResponse>(
        '/api/solana/revoke-mint-authority',
        requestBody
      )

      // Deserialize the transaction
      const transaction = Transaction.from(Buffer.from(revokeResponse.serializedTransaction, 'base64'))

      // Get fresh blockhash since deserialization might invalidate the existing one
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      // Sign the transaction with the wallet
      const signedTransaction = await context.signTransaction(transaction)

      // Send and confirm transaction
      const rawTransaction = signedTransaction.serialize()
      const signature = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // Ultra-fast parallel confirmation strategy
      const { kitRpc } = createConnectionPair()
      const priorityFeeMicroLamports = 1000 // Default reasonable priority fee for authority operations

      const confirmationResult = await confirmTransactionWithParallelStrategy(
        signature,
        priorityFeeMicroLamports,
        kitRpc,
        connection,
        logger
      )

      if (!confirmationResult.confirmed) {
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

      const successMessage = `Successfully revoked mint authority for token: ${tokenAddress}`

      return {
        signature,
        tokenAddress,
        message: successMessage,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  // Use the base tool hook for consistent error handling and loading states
  const toolBase = useToolBase<RevokeMintAuthorityParams, RevokeMintAuthorityResult>(
    {
      toolId: 'revoke-mint-authority',
      toolName: 'Revoke Mint Authority',
      requiresWallet: true,
    },
    executeRevokeMintAuthority
  )

  // Wrapper function that provides enhanced user feedback
  const revokeMintAuthority = useCallback(
    async (params: RevokeMintAuthorityParams): Promise<RevokeMintAuthorityResult | null> => {
      // toolBase.execute() handles errors internally and shows error toasts
      // It returns null on failure, so we don't need try/catch here
      const result = await toolBase.execute(params)

      if (result) {
        // Show success toast with explorer link
        showTransactionToast(result.signature, `Mint authority revoked for ${result.tokenAddress.slice(0, 8)}...`)
      }

      return result
    },
    [toolBase]
  )

  return {
    revokeMintAuthority,
    ...toolBase,
  }
}

export default useRevokeMintAuthority
