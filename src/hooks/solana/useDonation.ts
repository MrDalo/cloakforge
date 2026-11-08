/**
 * useDonation Hook
 *
 * Client-side hook for donating SOL or an SPL token directly to the CloakForge
 * treasury wallet. Follows the same prepare -> sign -> send pattern as
 * useTransactionMultisender, minus batching (a donation is always one transaction).
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction } from '@solana/web3.js'
import { apiClient } from '@/lib/utils/apiClient'
import { useToolBase, type UseToolBaseReturn, type ToolExecutionContext } from './useToolBase'
import { AppError, isUserRejectionError } from '@/lib/errors'
import { toast } from 'sonner'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { getLogger } from '@/lib/logger/logger'
import { type ExpectedOperation, fetchMint, resolveFeeWalletForVerification, verifyBeforeSigning } from '@/lib/solana/client'

interface DonationRequest {
  walletAddress: string
  tokenMintAddress?: string
  amount: number
}

interface UnsignedDonationResponse {
  serializedTransaction: string
  message: string
  blockhash: string
  lastValidBlockHeight: number
}

export interface DonationParams {
  tokenMintAddress?: string
  amount: number
}

export interface DonationResult {
  signature: string
}

export type UseDonationReturn = Omit<UseToolBaseReturn<DonationParams, DonationResult>, 'execute' | 'validateRequirements'> & {
  execute: UseToolBaseReturn<DonationParams, DonationResult>['execute']
}

/**
 * Custom hook for donating to the CloakForge platform
 */
export function useDonation(): UseDonationReturn {
  const { connection } = useConnection()
  const { signTransaction } = useWallet()

  const executeDonation = async (context: ToolExecutionContext, params: DonationParams): Promise<DonationResult> => {
    const logger = getLogger({ context: 'donation', hook: 'useDonation' })

    if (!signTransaction) {
      throw new AppError('WALLET_CONNECTION_FAILED', 'Wallet does not support signing transactions')
    }

    // Donations go to the fee wallet, so it must be pinned to verify the recipient (even in development)
    const treasuryWallet = resolveFeeWalletForVerification()
    if (!treasuryWallet) {
      throw new AppError('TRANSACTION_VERIFICATION_FAILED', 'Donations are unavailable: the donation wallet is not configured.')
    }

    try {
      toast.loading('Preparing donation...', { id: 'donation-progress' })

      const response = await apiClient<DonationRequest, UnsignedDonationResponse>('/api/solana/donation', {
        walletAddress: context.walletAddress,
        tokenMintAddress: params.tokenMintAddress,
        amount: params.amount,
      })

      const transaction = VersionedTransaction.deserialize(Buffer.from(response.serializedTransaction, 'base64'))

      // Never sign what the user did not ask for (WEB3-07): exactly the entered amount to the donation
      // wallet, no service fee. Token decimals are read on-chain by the client to check the amount.
      const payments = [{ recipient: treasuryWallet, amount: params.amount }]
      const operation: ExpectedOperation = params.tokenMintAddress
        ? {
            kind: 'token-transfers',
            mint: params.tokenMintAddress,
            payments,
            decimals: (await fetchMint(connection, params.tokenMintAddress)).decimals,
          }
        : { kind: 'sol-transfers', payments }
      await verifyBeforeSigning(
        { connection, transactions: [transaction], toolId: 'donation' },
        { wallet: context.walletAddress, feeWallet: treasuryWallet, maxServiceFeeLamports: BigInt(0), operation }
      )

      toast.loading('Signing donation...', { id: 'donation-progress' })
      const signedTransaction = await signTransaction(transaction)

      toast.loading('Sending donation...', { id: 'donation-progress' })
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      await connection.confirmTransaction(
        { signature, blockhash: response.blockhash, lastValidBlockHeight: response.lastValidBlockHeight },
        'confirmed'
      )

      showTransactionToast(signature, 'Thank you for your donation!')

      return { signature }
    } catch (error) {
      const logFn = isUserRejectionError(error) ? logger.warn : logger.error
      logFn('Donation execution failed', error)
      throw error
    } finally {
      toast.dismiss('donation-progress')
    }
  }

  const toolBase = useToolBase<DonationParams, DonationResult>(
    {
      toolId: 'donation',
      toolName: 'Donation',
      requiresWallet: true,
    },
    executeDonation
  )

  return {
    ...toolBase,
    execute: toolBase.execute,
  }
}

export default useDonation
