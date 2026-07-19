/**
 * useUnfreezeWallets Hook
 *
 * Client-side hook for unfreezing token wallets via server API.
 * Accepts wallet addresses, derives ATAs server-side, and batches unfreeze instructions.
 * Uses useToolBase for wallet validation and error handling.
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction, PublicKey } from '@solana/web3.js'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import { apiClient } from '@/lib/utils/apiClient'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { validateBalance } from '@/lib/solana/validateBalance'
import { useToolConfig } from '@/stores/toolConfigStore'
import { getAppliedCouponCode } from '@/stores/discountCouponStore'

// Request type for API call - accepts array of wallet addresses
type UnfreezeWalletsRequest = {
  walletAddress: string
  targetWallets: string[]
  mintAddress: string
  couponCode?: string
}

// Response type from API
type BatchUnfreezeResponse = {
  serializedTransactions: string[]
  message: string
  unfrozenWallets: string[]
  derivedTokenAccounts: string[]
  blockhash: string
  lastValidBlockHeight: number
}

// Parameters for the hook - accepts array of wallet addresses
export interface UnfreezeWalletsParams {
  walletAddresses: string[]
  mintAddress: string
}

// Result type
export interface UnfreezeWalletsResult {
  signatures: string[]
  unfrozenWallets: string[]
  message: string
  successfulWallets: number
  failedWallets: number
}

/**
 * Return type for useUnfreezeWallets hook
 */
export type UseUnfreezeWalletsReturn = Omit<
  UseToolBaseReturn<UnfreezeWalletsParams, UnfreezeWalletsResult>,
  'execute' | 'validateRequirements'
> & {
  unfreezeWallets: UseToolBaseReturn<UnfreezeWalletsParams, UnfreezeWalletsResult>['execute']
}

/**
 * Custom hook for unfreezing token wallets by wallet addresses
 * Server derives ATAs and batches unfreeze instructions
 */
export function useUnfreezeWallets(): UseUnfreezeWalletsReturn {
  const { connection } = useConnection()
  const { signAllTransactions } = useWallet()
  const { config } = useToolConfig('unfreeze-wallets')

  const WALLETS_PER_TX = 10

  // Define execution logic (React Compiler handles memoization — no manual useCallback)
  const executeUnfreezeWallets = async (context: ToolExecutionContext, params: UnfreezeWalletsParams): Promise<UnfreezeWalletsResult> => {
    const logger = getLogger({ context: 'unfreeze-wallets', hook: 'useUnfreezeWallets' })
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

    // Estimate number of transactions (WALLETS_PER_TX wallets per tx)
    const estimatedTxCount = Math.ceil(walletAddresses.length / WALLETS_PER_TX)
    const totalServiceFee = serviceFeePerWallet * walletAddresses.length
    const totalNetworkFee = networkFeePerTx * estimatedTxCount

    const balanceValidation = await validateBalance({
      walletPublicKey: new PublicKey(context.walletAddress),
      connection,
      serviceId: 'unfreeze-wallets',
      formData: { mintAddress },
      serviceFee: totalServiceFee,
      networkFee: totalNetworkFee,
    })

    if (!balanceValidation.hasSufficientBalance) {
      throw new AppError('INSUFFICIENT_FUNDS', `Insufficient funds. Need ${balanceValidation.estimatedCost.toFixed(4)} SOL`)
    }

    // Call API to prepare transactions
    const response = await apiClient<UnfreezeWalletsRequest, BatchUnfreezeResponse>('/api/solana/unfreeze-wallets', {
      couponCode: getAppliedCouponCode(),
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

      // If there are more transactions but signAllTransactions is not available
      if (transactions.length > 1 && !signAllTransactions) {
        throw new AppError(
          'WALLET_CONNECTION_FAILED',
          'Your wallet does not support batch signing. For more than 10 wallets, use a wallet that supports signAllTransactions (e.g. Phantom, Backpack).'
        )
      }
    }

    // Send and confirm all transactions in parallel — all land within milliseconds,
    // well within the shared blockhash's ~60-second expiry window.
    // Use allSettled so a single failed batch doesn't discard successful ones.
    const sendResults = await Promise.allSettled(
      signedTransactions.map(async (tx) => {
        const signature = await connection.sendRawTransaction(tx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })
        await connection.confirmTransaction(
          { signature, blockhash: response.blockhash, lastValidBlockHeight: response.lastValidBlockHeight },
          'confirmed'
        )
        return signature
      })
    )

    const signatures: string[] = []
    let successfulWallets = 0
    let failedWallets = 0

    for (let i = 0; i < sendResults.length; i++) {
      const result = sendResults[i]
      const walletsInBatch =
        i === signedTransactions.length - 1 ? walletAddresses.length - (signedTransactions.length - 1) * WALLETS_PER_TX : WALLETS_PER_TX

      if (result.status === 'fulfilled') {
        signatures.push(result.value)
        successfulWallets += walletsInBatch
      } else {
        // Best-effort per-batch send — other independent batches may have succeeded
        logger.warn(`Transaction batch ${i + 1}/${sendResults.length} failed`, result.reason)
        failedWallets += walletsInBatch
      }
    }

    if (signatures.length === 0) {
      throw new AppError('TRANSACTION_FAILED', 'All transactions failed to confirm')
    }

    const toastMessage =
      failedWallets > 0
        ? `${successfulWallets} wallet(s) unfrozen — ${failedWallets} failed`
        : `${successfulWallets} wallet(s) unfrozen successfully`

    showTransactionToast(signatures[signatures.length - 1], toastMessage)

    return {
      signatures,
      unfrozenWallets: response.unfrozenWallets,
      message: response.message,
      successfulWallets,
      failedWallets,
    }
  }

  const toolBase = useToolBase(
    {
      toolId: 'unfreeze-wallets',
      toolName: 'Unfreeze Wallets',
      requiresWallet: true,
    },
    executeUnfreezeWallets
  )

  return {
    unfreezeWallets: toolBase.execute,
    ...toolBase,
  }
}
