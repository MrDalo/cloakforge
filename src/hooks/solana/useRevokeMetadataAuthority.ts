/**
 * useRevokeMetadataAuthority Hook
 *
 * Client-side hook for revoking Token-2022 metadata update authority via server API.
 * Uses useToolBase for wallet validation and error handling.
 *
 * Mirrors useRevokeMintAuthority.ts.
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
import { resolveFeeWalletForVerification, getMaxServiceFeeLamports, verifyBeforeSigning } from '@/lib/solana/client'
import { useToolConfig } from '@/stores/toolConfigStore'
import { getAppliedCoupon } from '@/stores/discountCouponStore'

// Request type for API call
type RevokeMetadataAuthorityRequest = { walletAddress: string; tokenAddress: string; couponCode?: string }

// Response type from API
type UnsignedRevokeMetadataAuthorityResponse = { serializedTransaction: string; message: string }

// Parameters for the hook
export interface RevokeMetadataAuthorityParams {
  tokenAddress: string
}

// Result type
export interface RevokeMetadataAuthorityResult {
  signature: string
  tokenAddress: string
  message: string
}

/**
 * Return type for useRevokeMetadataAuthority hook
 * Renames 'execute' from UseToolBaseReturn to 'revokeMetadataAuthority' for clarity
 */
export type UseRevokeMetadataAuthorityReturn = Omit<
  UseToolBaseReturn<RevokeMetadataAuthorityParams, RevokeMetadataAuthorityResult>,
  'execute' | 'validateRequirements'
> & {
  revokeMetadataAuthority: UseToolBaseReturn<RevokeMetadataAuthorityParams, RevokeMetadataAuthorityResult>['execute']
}

/**
 * Custom hook for revoking Token-2022 metadata update authority
 */
export function useRevokeMetadataAuthority(): UseRevokeMetadataAuthorityReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('revoke-metadata-authority')

  // Define execution logic
  const executeRevokeMetadataAuthority = useCallback(
    async (context: ToolExecutionContext, params: RevokeMetadataAuthorityParams): Promise<RevokeMetadataAuthorityResult> => {
      const { tokenAddress } = params

      // Validate token address
      if (!tokenAddress) throw new AppError('INVALID_INPUT', 'Token address is required')
      try {
        new PublicKey(tokenAddress)
      } catch {
        throw new AppError('INVALID_TOKEN_ADDRESS', 'Invalid token address format')
      }

      // Fail closed before any wallet prompt when the fee wallet cannot be pinned (production)
      const feeWallet = resolveFeeWalletForVerification()
      const serviceFeeSol = config?.baseFee ?? 0.1

      // Client-side balance validation
      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'revoke-metadata-authority',
        formData: {},
        serviceFee: serviceFeeSol,
        networkFee: config?.networkFee ?? 0.0005,
      })

      if (!balanceValidation.hasSufficientBalance) {
        throw new AppError(
          'INSUFFICIENT_FUNDS',
          `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL, but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
        )
      }

      // Snapshot the coupon once: the code sent to the API and the fee limit below must come from the same coupon
      const appliedCoupon = getAppliedCoupon()
      // Call server API
      const revokeResponse = await apiClient<RevokeMetadataAuthorityRequest, UnsignedRevokeMetadataAuthorityResponse>(
        '/api/solana/revoke-metadata-authority',
        { walletAddress: context.walletAddress, tokenAddress, couponCode: appliedCoupon?.code }
      )

      // Deserialize and refresh blockhash
      const transaction = Transaction.from(Buffer.from(revokeResponse.serializedTransaction, 'base64'))
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      // Never sign what the user did not ask for (WEB3-07): verify, then simulate, before the wallet prompt
      await verifyBeforeSigning(
        { connection, transactions: [transaction], toolId: 'revoke-metadata-authority' },
        {
          wallet: context.walletAddress,
          feeWallet,
          maxServiceFeeLamports: getMaxServiceFeeLamports({
            toolId: 'revoke-metadata-authority',
            baseFeeSol: serviceFeeSol,
            discountPercentage: appliedCoupon?.discountPercentage,
          }),
          operation: { kind: 'revoke-metadata-authority', mint: tokenAddress },
        }
      )

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
        message: `Successfully revoked metadata authority for token: ${tokenAddress}`,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  // Use useToolBase for wallet validation and error handling
  const toolBase = useToolBase<RevokeMetadataAuthorityParams, RevokeMetadataAuthorityResult>(
    {
      toolId: 'revoke-metadata-authority',
      toolName: 'Revoke Metadata Authority',
      requiresWallet: true,
    },
    executeRevokeMetadataAuthority
  )

  // Wrapper function that shows success toast after execution
  const revokeMetadataAuthority: UseToolBaseReturn<RevokeMetadataAuthorityParams, RevokeMetadataAuthorityResult>['execute'] = useCallback(
    async (params: RevokeMetadataAuthorityParams) => {
      const result = await toolBase.execute(params)

      if (result) {
        showTransactionToast(result.signature, `Metadata authority revoked for ${result.tokenAddress.slice(0, 8)}...`)
      }

      return result
    },
    [toolBase]
  )

  // Return toolBase properties with 'execute' renamed to 'revokeMetadataAuthority'
  return {
    revokeMetadataAuthority,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}

export default useRevokeMetadataAuthority
