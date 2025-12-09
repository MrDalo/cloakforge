/**
 * useUnfreezeAccounts Hook
 *
 * Client-side hook for unfreezing token accounts via server API.
 * Accepts wallet addresses, derives ATAs server-side, and batches unfreeze instructions.
 * Uses useToolBase for wallet validation and error handling.
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { VersionedTransaction, PublicKey } from '@solana/web3.js'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { validateBalance } from '@/lib/solana/validateBalance'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana'
import { useToolConfig } from '@/stores/toolConfigStore'

// Request type for API call - accepts array of wallet addresses
type UnfreezeWalletsRequest = {
  walletAddress: string
  targetWallets: string[]
  mintAddress: string
}

// Response type from API
type BatchUnfreezeResponse = {
  serializedTransaction: string
  message: string
  unfrozenWallets: string[]
  derivedTokenAccounts: string[]
}

// Parameters for the hook - accepts array of wallet addresses
export interface UnfreezeWalletsParams {
  walletAddresses: string[]
  mintAddress: string
}

// Result type
export interface UnfreezeWalletsResult {
  signature: string
  unfrozenWallets: string[]
  message: string
}

/**
 * Return type for useUnfreezeAccounts hook
 */
export type UseUnfreezeAccountsReturn = Omit<
  UseToolBaseReturn<UnfreezeWalletsParams, UnfreezeWalletsResult>,
  'execute' | 'validateRequirements'
> & {
  unfreezeWallets: UseToolBaseReturn<UnfreezeWalletsParams, UnfreezeWalletsResult>['execute']
}

/**
 * Custom hook for unfreezing token accounts by wallet addresses
 * Server derives ATAs and batches unfreeze instructions
 */
export function useUnfreezeAccounts(): UseUnfreezeAccountsReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('unfreeze-accounts')

  // Define execution logic
  const executeUnfreezeWallets = useCallback(
    async (context: ToolExecutionContext, params: UnfreezeWalletsParams): Promise<UnfreezeWalletsResult> => {
      const { walletAddresses, mintAddress } = params

      const logger = getLogger({
        context: 'unfreeze-accounts',
        hook: 'useUnfreezeAccounts',
        wallet: context.walletAddress,
        targetWallets: walletAddresses.length,
        mint: mintAddress,
      })

      // Validate inputs
      if (!walletAddresses || walletAddresses.length === 0) {
        throw new AppError('INVALID_INPUT', 'At least one wallet address is required')
      }
      if (!mintAddress) {
        throw new AppError('INVALID_INPUT', 'Mint address is required')
      }

      // Validate all addresses
      try {
        new PublicKey(mintAddress)
        for (const addr of walletAddresses) {
          new PublicKey(addr)
        }
      } catch {
        throw new AppError('INVALID_INPUT', 'One or more addresses have invalid format')
      }

      // Client-side balance validation - fee is per wallet
      const serviceFeePerWallet = config?.baseFee ?? 0.01
      const totalServiceFee = serviceFeePerWallet * walletAddresses.length
      const networkFee = config?.networkFee ?? 0.0005

      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'unfreeze-accounts',
        formData: {},
        serviceFee: totalServiceFee,
        networkFee,
      })

      if (!balanceValidation.hasSufficientBalance) {
        throw new AppError(
          'INSUFFICIENT_FUNDS',
          `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL for ${walletAddresses.length} wallet(s), but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
        )
      }

      logger.info('Requesting batch unfreeze transaction', {
        walletCount: walletAddresses.length,
      })

      // Call server API with all wallet addresses
      const unfreezeResponse = await apiClient<UnfreezeWalletsRequest, BatchUnfreezeResponse>('/api/solana/unfreeze-accounts', {
        walletAddress: context.walletAddress,
        targetWallets: walletAddresses,
        mintAddress,
      })

      // Deserialize VersionedTransaction and refresh blockhash
      const transactionBuffer = Buffer.from(unfreezeResponse.serializedTransaction, 'base64')
      const transaction = VersionedTransaction.deserialize(transactionBuffer)

      // Get fresh blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')

      // Update the blockhash in the transaction message
      transaction.message.recentBlockhash = blockhash

      // Sign with wallet adapter
      const signedTransaction = await context.signTransaction(transaction)

      // Submit transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      })

      logger.info('Transaction submitted', { signature })

      // Confirm with parallel strategy
      const { kitRpc } = createConnectionPair()
      const confirmationResult = await confirmTransactionWithParallelStrategy(signature, lastValidBlockHeight, kitRpc, connection, logger)

      if (!confirmationResult.confirmed) {
        const finalCheck = await connection.getSignatureStatus(signature, { searchTransactionHistory: true })
        if (finalCheck?.value?.err) {
          throw new AppError('TRANSACTION_FAILED', `Transaction failed: ${String(finalCheck?.value?.err)}`)
        }
        if (!finalCheck?.value?.confirmationStatus) {
          throw new AppError('FINALIZATION_TIMEOUT', 'Transaction confirmation timed out')
        }
      }

      logger.info('Batch unfreeze completed successfully', {
        unfrozenWallets: unfreezeResponse.unfrozenWallets.length,
        signature,
      })

      return {
        signature,
        unfrozenWallets: unfreezeResponse.unfrozenWallets,
        message: `Successfully unfrozen ${unfreezeResponse.unfrozenWallets.length} wallet(s)`,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  // Use useToolBase for wallet validation and error handling
  const toolBase = useToolBase<UnfreezeWalletsParams, UnfreezeWalletsResult>(
    {
      toolId: 'unfreeze-accounts',
      toolName: 'Unfreeze Wallets',
      requiresWallet: true,
    },
    executeUnfreezeWallets
  )

  // Wrapper function that shows success toast after execution
  const unfreezeWallets: UseToolBaseReturn<UnfreezeWalletsParams, UnfreezeWalletsResult>['execute'] = useCallback(
    async (params: UnfreezeWalletsParams) => {
      const result = await toolBase.execute(params)

      if (result) {
        showTransactionToast(result.signature, result.message)
      }

      return result
    },
    [toolBase]
  )

  return {
    unfreezeWallets,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}

export default useUnfreezeAccounts
