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
import { AppError } from '@/lib/errors'
import { toast } from 'sonner'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { getLogger } from '@/lib/logger/logger'

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

    try {
      toast.loading('Preparing donation...', { id: 'donation-progress' })

      const response = await apiClient<DonationRequest, UnsignedDonationResponse>('/api/solana/donation', {
        walletAddress: context.walletAddress,
        tokenMintAddress: params.tokenMintAddress,
        amount: params.amount,
      })

      const transaction = VersionedTransaction.deserialize(Buffer.from(response.serializedTransaction, 'base64'))

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
      logger.error('Donation execution failed', error)
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
