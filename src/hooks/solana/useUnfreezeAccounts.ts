/**
 * useUnfreezeAccounts Hook
 *
 * Client-side hook for unfreezing token accounts via server API.
 * Uses useToolBase for wallet validation and error handling.
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { validateBalance } from '@/lib/solana/validateBalance'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana'
import { useToolConfig } from '@/stores/toolConfigStore'

// Request type for API call
type UnfreezeAccountRequest = { walletAddress: string; tokenAccount: string; mintAddress: string }

// Response type from API
type UnsignedUnfreezeAccountResponse = { serializedTransaction: string; message: string }

// Parameters for the hook
export interface UnfreezeAccountParams {
  tokenAccount: string
  mintAddress: string
}

// Result type
export interface UnfreezeAccountResult {
  signature: string
  tokenAccount: string
  message: string
}

/**
 * Return type for useUnfreezeAccounts hook
 * Renames 'execute' from UseToolBaseReturn to 'unfreezeAccount' for clarity
 */
export type UseUnfreezeAccountsReturn = Omit<
  UseToolBaseReturn<UnfreezeAccountParams, UnfreezeAccountResult>,
  'execute' | 'validateRequirements'
> & {
  unfreezeAccount: UseToolBaseReturn<UnfreezeAccountParams, UnfreezeAccountResult>['execute']
}

/**
 * Custom hook for unfreezing token accounts
 */
export function useUnfreezeAccounts(): UseUnfreezeAccountsReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('unfreeze-accounts')

  // Define execution logic
  const executeUnfreezeAccount = useCallback(
    async (context: ToolExecutionContext, params: UnfreezeAccountParams): Promise<UnfreezeAccountResult> => {
      const { tokenAccount, mintAddress } = params

      const logger = getLogger({
        context: 'unfreeze-accounts',
        hook: 'useUnfreezeAccounts',
        wallet: context.walletAddress,
        tokenAccount,
        mint: mintAddress,
      })

      // Validate addresses
      if (!tokenAccount) throw new AppError('INVALID_INPUT', 'Token account address is required')
      if (!mintAddress) throw new AppError('INVALID_INPUT', 'Mint address is required')
      try {
        new PublicKey(tokenAccount)
        new PublicKey(mintAddress)
      } catch {
        throw new AppError('INVALID_INPUT', 'Invalid address format')
      }

      // Client-side balance validation
      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'unfreeze-accounts',
        formData: {},
        serviceFee: config?.baseFee ?? 0.01,
        networkFee: config?.networkFee ?? 0.0005,
      })

      if (!balanceValidation.hasSufficientBalance) {
        throw new AppError(
          'INSUFFICIENT_FUNDS',
          `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL, but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
        )
      }

      // Call server API
      const unfreezeResponse = await apiClient<UnfreezeAccountRequest, UnsignedUnfreezeAccountResponse>('/api/solana/unfreeze-accounts', {
        walletAddress: context.walletAddress,
        tokenAccount,
        mintAddress,
      })

      // Deserialize and refresh blockhash
      const transaction = Transaction.from(Buffer.from(unfreezeResponse.serializedTransaction, 'base64'))
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
      const confirmationResult = await confirmTransactionWithParallelStrategy(signature, 1000, kitRpc, connection, logger)

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
        tokenAccount,
        message: `Successfully unfrozen account: ${tokenAccount}`,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  // Use useToolBase for wallet validation and error handling
  const toolBase = useToolBase<UnfreezeAccountParams, UnfreezeAccountResult>(
    {
      toolId: 'unfreeze-accounts',
      toolName: 'Unfreeze Accounts',
      requiresWallet: true,
    },
    executeUnfreezeAccount
  )

  // Wrapper function that shows success toast after execution
  const unfreezeAccount: UseToolBaseReturn<UnfreezeAccountParams, UnfreezeAccountResult>['execute'] = useCallback(
    async (params: UnfreezeAccountParams) => {
      const result = await toolBase.execute(params)

      if (result) {
        showTransactionToast(result.signature, `Account unfrozen: ${result.tokenAccount.slice(0, 8)}...`)
      }

      return result
    },
    [toolBase]
  )

  return {
    unfreezeAccount,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}

export default useUnfreezeAccounts
