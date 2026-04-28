/**
 * useRevokeFreezeAuthority Hook
 *
 * Client-side hook for revoking freeze authority via server API.
 * Uses useToolBase for wallet validation and error handling.
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { validateBalance } from '@/lib/solana/validateBalance'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana'
import { useToolConfig } from '@/stores/toolConfigStore'

// Request type for API call
type RevokeFreezeAuthorityRequest = { walletAddress: string; tokenAddress: string }

// Response type from API
type UnsignedRevokeFreezeAuthorityResponse = { serializedTransaction: string; message: string }

// Parameters for the hook
export interface RevokeFreezeAuthorityParams {
  tokenAddress: string
}

// Result type
export interface RevokeFreezeAuthorityResult {
  signature: string
  tokenAddress: string
  message: string
}

/**
 * Return type for useRevokeFreezeAuthority hook
 * Renames 'execute' from UseToolBaseReturn to 'revokeFreezeAuthority' for clarity
 */
export type UseRevokeFreezeAuthorityReturn = Omit<
  UseToolBaseReturn<RevokeFreezeAuthorityParams, RevokeFreezeAuthorityResult>,
  'execute' | 'validateRequirements'
> & {
  revokeFreezeAuthority: UseToolBaseReturn<RevokeFreezeAuthorityParams, RevokeFreezeAuthorityResult>['execute']
}

/**
 * Custom hook for revoking freeze authority from SPL tokens
 */
export function useRevokeFreezeAuthority(): UseRevokeFreezeAuthorityReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('revoke-freeze-authority')

  // Define execution logic
  const executeRevokeFreezeAuthority = useCallback(
    async (context: ToolExecutionContext, params: RevokeFreezeAuthorityParams): Promise<RevokeFreezeAuthorityResult> => {
      const { tokenAddress } = params

      // Validate token address
      if (!tokenAddress) throw new AppError('INVALID_INPUT', 'Token address is required')
      try {
        new PublicKey(tokenAddress)
      } catch {
        throw new AppError('INVALID_TOKEN_ADDRESS', 'Invalid token address format')
      }

      // Client-side balance validation
      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'revoke-freeze-authority',
        formData: {},
        serviceFee: config?.baseFee ?? 0.1,
        networkFee: config?.networkFee ?? 0.0005,
      })

      if (!balanceValidation.hasSufficientBalance) {
        throw new AppError(
          'INSUFFICIENT_FUNDS',
          `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL, but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
        )
      }

      // Call server API
      const revokeResponse = await apiClient<RevokeFreezeAuthorityRequest, UnsignedRevokeFreezeAuthorityResponse>(
        '/api/solana/revoke-freeze-authority',
        { walletAddress: context.walletAddress, tokenAddress }
      )

      // Deserialize and refresh blockhash
      const transaction = Transaction.from(Buffer.from(revokeResponse.serializedTransaction, 'base64'))
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      // Sign and submit
      const signedTransaction = await context.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // Confirm
      const { kitRpc } = createConnectionPair()
      const confirmationResult = await confirmTransactionWithParallelStrategy(signature, 1000, kitRpc, connection)

      if (!confirmationResult.confirmed) {
        const finalCheck = await connection.getSignatureStatus(signature, { searchTransactionHistory: true })
        if (finalCheck?.value?.err) {
          throw new Error(`Transaction failed: ${String(finalCheck?.value?.err)}`)
        }
        if (!finalCheck?.value?.confirmationStatus) {
          throw new AppError('FINALIZATION_TIMEOUT', 'Transaction confirmation timed out')
        }
      }

      return {
        signature,
        tokenAddress,
        message: `Successfully revoked freeze authority for token: ${tokenAddress}`,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  // Use useToolBase for wallet validation and error handling
  const toolBase = useToolBase<RevokeFreezeAuthorityParams, RevokeFreezeAuthorityResult>(
    {
      toolId: 'revoke-freeze-authority',
      toolName: 'Revoke Freeze Authority',
      requiresWallet: true,
    },
    executeRevokeFreezeAuthority
  )

  // Wrapper function that shows success toast after execution
  const revokeFreezeAuthority: UseToolBaseReturn<RevokeFreezeAuthorityParams, RevokeFreezeAuthorityResult>['execute'] = useCallback(
    async (params: RevokeFreezeAuthorityParams) => {
      const result = await toolBase.execute(params)

      if (result) {
        showTransactionToast(result.signature, `Freeze authority revoked for ${result.tokenAddress.slice(0, 8)}...`)
      }

      return result
    },
    [toolBase]
  )

  // Return toolBase properties with 'execute' renamed to 'revokeFreezeAuthority'
  return {
    revokeFreezeAuthority,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}

export default useRevokeFreezeAuthority
