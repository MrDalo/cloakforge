import { useCallback, useMemo } from 'react'
import { useToolBase, type ToolExecutionConfig, type ToolExecutionContext, type ToolValidationResult } from './useToolBase'
import createTokenWithSolanaKit from '@/lib/solana/tokenCreatorKit'
import type { TokenCreatorFormData } from '@/components/pages/TokenCreatorPage/TokenCreationForm/tokenCreatorFormSchema'
import { getLogger } from '@/lib/logger/logger'
import { useConfig } from './context/useConfig'
import { useToolConfig } from '@/stores/toolConfigStore'

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
          serviceFeeLamports: config?.baseFee || 0.2, // Use base fee from contentful or 0.2 if not available
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
