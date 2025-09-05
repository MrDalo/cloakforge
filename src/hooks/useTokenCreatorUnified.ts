import { useCallback, useMemo } from 'react'
import { useToolBase, type ToolExecutionConfig, type ToolExecutionContext, type ToolValidationResult } from './useToolBase'
import createTokenWithSolanaKit from '@/lib/solana/createTokenWithSolanaKit'
import type { TokenCreatorFormData } from '@/components/pages/TokenCreatorPage/TokenCreationForm/tokenCreatorFormSchema'
import { getLogger } from '@/lib/logger/logger'
import { useConfig } from './context/useConfig'
import { useToolConfig } from '@/stores/toolConfigStore'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { toolFeeConfigs } from '@/lib/utils/feeConfigs'
import { showTokenCreationToast } from '@/lib/toast/showTransactionToast'

// Token Creator specific types
export interface TokenCreatorResult {
  mintAddress: string
  transactionSignature: string
  tokenName: string
  tokenSymbol: string
  success: boolean
}

export interface UseTokenCreatorReturn {
  // From base hook
  isExecuting: boolean
  lastResult: TokenCreatorResult | null
  execute: (data: TokenCreatorFormData) => Promise<TokenCreatorResult | null>
  validateRequirements: () => ToolValidationResult
  reset: () => void
  isWalletReady: boolean
  validationErrors: string[]

  createToken: (data: TokenCreatorFormData) => Promise<TokenCreatorResult | null>
}

/**
 * Unified Token Creator Hook
 * Combines base tool functionality with token-specific business logic
 */
export function useTokenCreator(): UseTokenCreatorReturn {
  // Memoize configurations to prevent recreation and infinite loops
  const toolExecutionConfig: ToolExecutionConfig = useMemo(
    () => ({
      toolId: 'token-creator',
      toolName: 'Token Creator',
      requiresWallet: true,
    }),
    []
  )

  // Memoize logger to prevent recreating on every render
  const logger = useMemo(
    () =>
      getLogger({
        context: 'token-creator',
        tool: 'token-creator',
        function: 'useTokenCreator',
      }),
    []
  )

  // Get client-side configuration
  const clientConfig = useConfig()

  const { config } = useToolConfig('token-creator')

  // Token creation business logic
  const executeTokenCreation = useCallback(
    async (context: ToolExecutionContext, data: TokenCreatorFormData): Promise<TokenCreatorResult> => {
      try {
        // Enhanced data with fee information - use stable values instead of feeCalculation object
        const enhancedData = {
          ...data,
          // Add fee calculation results to the data - use stable primitive values
          serviceFee: config?.baseFee || 0.2, // Use base fee from contentful or 0.2 SOL if not available
        }

        // Calculate estimated transaction cost before execution
        const serviceFeeSOL = config?.baseFee || 0.2
        const networkFeeSOL = config?.networkFee || 0.0005 // Default network fee estimation

        // Calculate additional fees based on form data
        let additionalFeesSOL = 0
        const toolFees = toolFeeConfigs['token-creator']() // token-creator doesn't take parameters

        for (const feeConfig of toolFees) {
          const fieldValue = data[feeConfig.fieldName as keyof TokenCreatorFormData]
          if (fieldValue === true || fieldValue === 'true') {
            additionalFeesSOL += feeConfig.fee
          }
        }

        const estimatedCostSOL = serviceFeeSOL + networkFeeSOL + additionalFeesSOL

        // Check wallet balance
        const connection = new Connection(clientConfig.rpcEndpoint, 'confirmed')
        const walletPublicKey = new PublicKey(context.walletAddress)
        const walletBalance = await connection.getBalance(walletPublicKey)
        const walletBalanceSOL = walletBalance / LAMPORTS_PER_SOL

        logger.info('Wallet balance check', {
          walletAddress: context.walletAddress.toString(),
          walletBalanceSOL: walletBalanceSOL.toFixed(6),
          estimatedCostSOL: estimatedCostSOL.toFixed(6),
          breakdown: {
            serviceFee: serviceFeeSOL,
            networkFee: networkFeeSOL,
            additionalFees: additionalFeesSOL,
          },
        })

        if (walletBalanceSOL < estimatedCostSOL) {
          const error = new SolanaError(
            `Insufficient funds. Need at least ${estimatedCostSOL.toFixed(4)} SOL, but wallet has ${walletBalanceSOL.toFixed(4)} SOL`,
            SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS
          )

          logger.warn('Insufficient wallet balance', {
            required: estimatedCostSOL,
            available: walletBalanceSOL,
            shortage: estimatedCostSOL - walletBalanceSOL,
          })

          throw error
        }

        // Create the token using the existing kit with config
        const result = await createTokenWithSolanaKit(context.walletAddress, context.signTransaction, enhancedData, clientConfig)

        const tokenResult: TokenCreatorResult = {
          mintAddress: result.mintAddress,
          transactionSignature: result.signature,
          tokenName: data.name,
          tokenSymbol: data.symbol,
          success: true,
        }

        // Show success toast with transaction and token links
        showTokenCreationToast(result.signature, data.name, result.mintAddress)

        return tokenResult
      } catch (error) {
        logger.error('Token creation failed', error, {
          tokenName: data.name,
          tokenSymbol: data.symbol,
          walletAddress: context.walletAddress,
        })

        // Re-throw to let base hook handle it
        throw error
      }
    },
    [logger, clientConfig, config]
  )

  // Use the base tool hook
  const baseHook = useToolBase<TokenCreatorFormData, TokenCreatorResult>(toolExecutionConfig, executeTokenCreation)

  // Alias for createToken to match existing API
  const createToken = baseHook.execute

  return {
    ...baseHook,
    createToken,
  }
}

export default useTokenCreator
