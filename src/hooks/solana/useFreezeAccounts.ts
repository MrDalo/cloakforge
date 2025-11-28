/**
 * useFreezeAccounts Hook
 *
 * Client-side hook for freezing token accounts via server API.
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
type FreezeAccountRequest = { walletAddress: string; tokenAccount: string; mintAddress: string }

// Response type from API
type UnsignedFreezeAccountResponse = { serializedTransaction: string; message: string }

// Parameters for the hook
export interface FreezeAccountParams {
  tokenAccount: string
  mintAddress: string
}

// Result type
export interface FreezeAccountResult {
  signature: string
  tokenAccount: string
  message: string
}

/**
 * Return type for useFreezeAccounts hook
 * Renames 'execute' from UseToolBaseReturn to 'freezeAccount' for clarity
 */
export type UseFreezeAccountsReturn = Omit<
  UseToolBaseReturn<FreezeAccountParams, FreezeAccountResult>,
  'execute' | 'validateRequirements'
> & {
  freezeAccount: UseToolBaseReturn<FreezeAccountParams, FreezeAccountResult>['execute']
}

/**
 * Custom hook for freezing token accounts
 */
export function useFreezeAccounts(): UseFreezeAccountsReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('freeze-accounts')

  // Define execution logic
  const executeFreezeAccount = async (context: ToolExecutionContext, params: FreezeAccountParams): Promise<FreezeAccountResult> => {
    const { tokenAccount, mintAddress } = params

    const logger = getLogger({
      context: 'freeze-accounts',
      hook: 'useFreezeAccounts',
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
      serviceId: 'freeze-accounts',
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
    const freezeResponse = await apiClient<FreezeAccountRequest, UnsignedFreezeAccountResponse>('/api/solana/freeze-accounts', {
      walletAddress: context.walletAddress,
      tokenAccount,
      mintAddress,
    })

    // Deserialize and refresh blockhash
    const transaction = Transaction.from(Buffer.from(freezeResponse.serializedTransaction, 'base64'))
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
      message: `Successfully frozen account: ${tokenAccount}`,
    }
  }

  // Use useToolBase for wallet validation and error handling
  const toolBase = useToolBase<FreezeAccountParams, FreezeAccountResult>(
    {
      toolId: 'freeze-accounts',
      toolName: 'Freeze Accounts',
      requiresWallet: true,
    },
    executeFreezeAccount
  )

  // Wrapper function that shows success toast after execution
  const freezeAccount: UseToolBaseReturn<FreezeAccountParams, FreezeAccountResult>['execute'] = async (params: FreezeAccountParams) => {
    const result = await toolBase.execute(params)

    if (result) {
      showTransactionToast(result.signature, `Account frozen: ${result.tokenAccount.slice(0, 8)}...`)
    }

    return result
  }

  return {
    freezeAccount,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}

export default useFreezeAccounts
