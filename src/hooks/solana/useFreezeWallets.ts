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
import { getLogger } from '@/lib/logger/logger'
import { apiClient } from '@/lib/utils/apiClient'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { validateBalance } from '@/lib/solana/validateBalance'
import { resolveFeeWalletForVerification, solToLamportsCeil, verifyBeforeSigning } from '@/lib/solana/client'
import { useToolConfig } from '@/stores/toolConfigStore'
import { getAppliedCouponCode } from '@/stores/discountCouponStore'

// Request type for API call - now accepts array of wallet addresses
type FreezeWalletsRequest = {
  walletAddress: string
  targetWallets: string[]
  mintAddress: string
  couponCode?: string
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
  successfulWallets: number
  failedWallets: number
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

  const WALLETS_PER_TX = 10

  // Define execution logic (React Compiler handles memoization — no manual useCallback)
  const executeFreezeWallets = async (context: ToolExecutionContext, params: FreezeWalletsParams): Promise<FreezeWalletsResult> => {
    const logger = getLogger({ context: 'freeze-wallets', hook: 'useFreezeWallets' })
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

    // Fail closed before any wallet prompt when the fee wallet cannot be pinned (production)
    const feeWallet = resolveFeeWalletForVerification()

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

    // A batch needs signAllTransactions (e.g. some hardware wallets lack it): check before any wallet prompt
    if (transactions.length > 1 && !signAllTransactions) {
      throw new AppError(
        'WALLET_CONNECTION_FAILED',
        'Your wallet does not support batch signing. For more than 10 wallets, use a wallet that supports signAllTransactions (e.g. Phantom, Backpack).'
      )
    }

    // Never sign what the user did not ask for (WEB3-07): verify, then simulate, before the wallet prompt.
    // The server may skip wallets without a matching token account, never add others.
    await verifyBeforeSigning(
      { connection, transactions, toolId: 'freeze-wallets' },
      {
        wallet: context.walletAddress,
        feeWallet,
        maxServiceFeeLamports: solToLamportsCeil(totalServiceFee),
        operation: { kind: 'freeze', mint: mintAddress, targetWallets: walletAddresses },
      }
    )

    const signedTransactions =
      transactions.length > 1 && signAllTransactions
        ? await signAllTransactions(transactions)
        : [await context.signTransaction(transactions[0])]

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
        ? `${successfulWallets} wallet(s) frozen — ${failedWallets} failed`
        : `${successfulWallets} wallet(s) frozen successfully`

    showTransactionToast(signatures[signatures.length - 1], toastMessage)

    return {
      signatures,
      frozenWallets: response.frozenWallets,
      message: response.message,
      successfulWallets,
      failedWallets,
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
