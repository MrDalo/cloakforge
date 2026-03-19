/**
 * useFreezeWallets Hook
 *
 * Client-side hook for freezing token wallets via server API.
 * Accepts wallet addresses, derives ATAs server-side, and batches freeze instructions.
 * Uses useToolBase for wallet validation and error handling.
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction, PublicKey } from '@solana/web3.js'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { validateBalance } from '@/lib/solana/validateBalance'
import { useToolConfig } from '@/stores/toolConfigStore'

// Request type for API call - now accepts array of wallet addresses
type FreezeWalletsRequest = {
  walletAddress: string
  targetWallets: string[]
  mintAddress: string
}

// Response type from API
type BatchFreezeResponse = {
  serializedTransactions: string[]
  message: string
  frozenWallets: string[]
  derivedTokenAccounts: string[]
  blockhash: string
  lastValidBlockHeight: number
}

// Parameters for the hook - now accepts array of wallet addresses
export interface FreezeWalletsParams {
  walletAddresses: string[]
  mintAddress: string
}

// Result type
export interface FreezeWalletsResult {
  signatures: string[]
  frozenWallets: string[]
  message: string
}

/**
 * Return type for useFreezeWallets hook
 */
export type UseFreezeWalletsReturn = Omit<
  UseToolBaseReturn<FreezeWalletsParams, FreezeWalletsResult>,
  'execute' | 'validateRequirements'
> & {
  freezeWallets: UseToolBaseReturn<FreezeWalletsParams, FreezeWalletsResult>['execute']
}

/**
 * Custom hook for freezing token wallets by wallet addresses
 * Server derives ATAs and batches freeze instructions
 */
export function useFreezeWallets(): UseFreezeWalletsReturn {
  const { connection } = useConnection()
  const { signAllTransactions } = useWallet()
  const { config } = useToolConfig('freeze-wallets')

  // Define execution logic (React Compiler handles memoization — no manual useCallback)
  const executeFreezeWallets = async (context: ToolExecutionContext, params: FreezeWalletsParams): Promise<FreezeWalletsResult> => {
    const { walletAddresses, mintAddress } = params

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
    const networkFeePerTx = config?.networkFee ?? 0.0005

    // Estimate number of transactions (10 wallets per tx)
    const estimatedTxCount = Math.ceil(walletAddresses.length / 10)
    const totalServiceFee = serviceFeePerWallet * walletAddresses.length
    const totalNetworkFee = networkFeePerTx * estimatedTxCount

    const balanceValidation = await validateBalance({
      walletPublicKey: new PublicKey(context.walletAddress),
      connection,
      serviceId: 'freeze-wallets',
      formData: { mintAddress },
      serviceFee: totalServiceFee,
      networkFee: totalNetworkFee,
    })

    if (!balanceValidation.hasSufficientBalance) {
      throw new AppError('INSUFFICIENT_FUNDS', `Insufficient funds. Need ${balanceValidation.estimatedCost.toFixed(4)} SOL`)
    }

    // Call API to prepare transactions
    const response = await apiClient<FreezeWalletsRequest, BatchFreezeResponse>('/api/solana/freeze-wallets', {
      walletAddress: context.walletAddress,
      targetWallets: walletAddresses,
      mintAddress,
    })

    // Deserialize transactions
    const transactions = response.serializedTransactions.map((txStr) => VersionedTransaction.deserialize(Buffer.from(txStr, 'base64')))

    if (transactions.length === 0) {
      throw new AppError('TRANSACTION_FAILED', 'No transactions returned from server')
    }

    // Sign transactions
    let signedTransactions: VersionedTransaction[]
    if (transactions.length > 1 && signAllTransactions) {
      // Batch signing
      signedTransactions = await signAllTransactions(transactions)
    } else {
      // Single signing or fallback
      const signedTx = await context.signTransaction(transactions[0])
      signedTransactions = [signedTx]

      // If there are more transactions but signAllTransactions is not available (e.g. some hardware wallets)
      // We would need to loop, but for now we assume signAllTransactions is available for batch operations
      if (transactions.length > 1 && !signAllTransactions) {
        throw new AppError('WALLET_CONNECTION_FAILED', 'Your wallet does not support batch signing. For more than 10 wallets, use a wallet that supports signAllTransactions (e.g. Phantom, Backpack).')
      }
    }

    // Phase 1: Send all transactions in parallel — all land within milliseconds,
    // well within the shared blockhash's ~60-second expiry window.
    const signatures = await Promise.all(
      signedTransactions.map((tx) =>
        connection.sendRawTransaction(tx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })
      )
    )

    // Phase 2: Confirm all in parallel
    await Promise.all(
      signatures.map((sig) =>
        connection.confirmTransaction(
          { signature: sig, blockhash: response.blockhash, lastValidBlockHeight: response.lastValidBlockHeight },
          'confirmed'
        )
      )
    )

    // Show success toast for the last transaction (or a summary)
    if (signatures.length > 0) {
      showTransactionToast(signatures[signatures.length - 1], `Successfully processed ${signatures.length} transaction(s)`)
    }

    return {
      signatures,
      frozenWallets: response.frozenWallets,
      message: response.message,
    }
  }

  const toolBase = useToolBase(
    {
      toolId: 'freeze-wallets',
      toolName: 'Freeze Wallets',
      requiresWallet: true,
    },
    executeFreezeWallets
  )

  return {
    freezeWallets: toolBase.execute,
    ...toolBase,
  }
}
