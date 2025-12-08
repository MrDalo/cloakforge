/**
 * useFreezeAccounts Hook
 *
 * Client-side hook for freezing token accounts via server API.
 * Accepts wallet addresses, derives ATAs server-side, and batches freeze instructions.
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

// Request type for API call - now accepts array of wallet addresses
type FreezeWalletsRequest = {
  walletAddress: string
  targetWallets: string[]
  mintAddress: string
}

// Response type from API
type BatchFreezeResponse = {
  serializedTransaction: string
  message: string
  frozenWallets: string[]
  derivedTokenAccounts: string[]
}

// Parameters for the hook - now accepts array of wallet addresses
export interface FreezeWalletsParams {
  walletAddresses: string[]
  mintAddress: string
}

// Result type
export interface FreezeWalletsResult {
  signature: string
  frozenWallets: string[]
  message: string
}

/**
 * Return type for useFreezeAccounts hook
 */
export type UseFreezeAccountsReturn = Omit<
  UseToolBaseReturn<FreezeWalletsParams, FreezeWalletsResult>,
  'execute' | 'validateRequirements'
> & {
  freezeWallets: UseToolBaseReturn<FreezeWalletsParams, FreezeWalletsResult>['execute']
}

/**
 * Custom hook for freezing token accounts by wallet addresses
 * Server derives ATAs and batches freeze instructions
 */
export function useFreezeAccounts(): UseFreezeAccountsReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('freeze-accounts')

  // Define execution logic
  const executeFreezeWallets = useCallback(
    async (context: ToolExecutionContext, params: FreezeWalletsParams): Promise<FreezeWalletsResult> => {
      const { walletAddresses, mintAddress } = params

      const logger = getLogger({
        context: 'freeze-accounts',
        hook: 'useFreezeAccounts',
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
        serviceId: 'freeze-accounts',
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

      logger.info('Requesting batch freeze transaction', {
        walletCount: walletAddresses.length,
      })

      // Call server API with all wallet addresses
      const freezeResponse = await apiClient<FreezeWalletsRequest, BatchFreezeResponse>('/api/solana/freeze-accounts', {
        walletAddress: context.walletAddress,
        targetWallets: walletAddresses,
        mintAddress,
      })

      // Deserialize VersionedTransaction and refresh blockhash
      const transactionBuffer = Buffer.from(freezeResponse.serializedTransaction, 'base64')
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

      logger.info('Batch freeze completed successfully', {
        frozenWallets: freezeResponse.frozenWallets.length,
        signature,
      })

      return {
        signature,
        frozenWallets: freezeResponse.frozenWallets,
        message: `Successfully frozen ${freezeResponse.frozenWallets.length} wallet(s)`,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  // Use useToolBase for wallet validation and error handling
  const toolBase = useToolBase<FreezeWalletsParams, FreezeWalletsResult>(
    {
      toolId: 'freeze-accounts',
      toolName: 'Freeze Wallets',
      requiresWallet: true,
    },
    executeFreezeWallets
  )

  // Wrapper function that shows success toast after execution
  const freezeWallets: UseToolBaseReturn<FreezeWalletsParams, FreezeWalletsResult>['execute'] = useCallback(
    async (params: FreezeWalletsParams) => {
      const result = await toolBase.execute(params)

      if (result) {
        showTransactionToast(result.signature, result.message)
      }

      return result
    },
    [toolBase]
  )

  return {
    freezeWallets,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}

export default useFreezeAccounts
