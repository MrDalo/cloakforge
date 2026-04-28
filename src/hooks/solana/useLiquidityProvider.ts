/**
 * useLiquidityProvider Hook
 *
 * Client-side hook for adding liquidity to Raydium CPMM and CLMM pools.
 * Uses useToolBase for wallet validation and error handling.
 *
 * Exported helpers (TOKEN_B_MINT_ADDRESSES, resolveTokenBAddress,
 * buildLiquidityRequest) are pure functions, making them unit-testable
 * without a React rendering environment.
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { validateBalance } from '@/lib/solana/validateBalance'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana'
import { useToolConfig } from '@/stores/toolConfigStore'

import type {
  LiquidityProviderParams,
  LiquidityProviderResult,
  LiquidityProviderRequest,
  LiquidityProviderResponse,
  TokenBOption,
} from '@/types/liquidityProvider'

// ---------------------------------------------------------------------------
// Exported constants + pure helpers (testable without React)
// ---------------------------------------------------------------------------

/** Canonical mainnet mint addresses for the preset Token B options */
export const TOKEN_B_MINT_ADDRESSES: Record<Exclude<TokenBOption, 'custom'>, string> = {
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
}

/**
 * Resolve a TokenBOption (from the form) to its on-chain mint address.
 * Returns `null` for `'custom'` when `customTokenB` is not provided.
 */
export function resolveTokenBAddress(tokenB: TokenBOption, customTokenB?: string): string | null {
  if (tokenB === 'custom') {
    return customTokenB ?? null
  }
  return TOKEN_B_MINT_ADDRESSES[tokenB]
}

/**
 * Build the API request body from form params + resolved addresses.
 * Pure function — no side effects.
 */
export function buildLiquidityRequest(
  params: LiquidityProviderParams,
  walletAddress: string,
  tokenBAddress: string
): LiquidityProviderRequest {
  const { poolType, tokenA, feeTier, amountA, amountB, minPrice, maxPrice, platformFee } = params

  const priceRange = poolType === 'CLMM' && minPrice && maxPrice ? { minPrice, maxPrice } : undefined

  return {
    walletAddress,
    poolConfig: {
      poolType,
      tokenA,
      tokenB: tokenBAddress,
      feeTier,
      initialLiquidity: {
        amountA,
        amountB,
      },
      ...(priceRange ? { priceRange } : {}),
    },
    ...(platformFee ? { platformFee } : {}),
  }
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export type UseLiquidityProviderReturn = Omit<
  UseToolBaseReturn<LiquidityProviderParams, LiquidityProviderResult>,
  'execute' | 'validateRequirements'
> & {
  provideLiquidity: UseToolBaseReturn<LiquidityProviderParams, LiquidityProviderResult>['execute']
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Client hook for the liquidity provider tool.
 *
 * Handles token address resolution, balance validation, API communication,
 * and transaction signing/confirmation.
 */
export function useLiquidityProvider(): UseLiquidityProviderReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('liquidity-provider')

  const executeLiquidityProvision = useCallback(
    async (context: ToolExecutionContext, params: LiquidityProviderParams): Promise<LiquidityProviderResult> => {
      // 1. Resolve Token B address
      const tokenBAddress = resolveTokenBAddress(params.tokenB, params.customTokenB)
      if (!tokenBAddress) {
        throw new AppError('INVALID_INPUT', 'Custom Token B address is required when selecting a custom token')
      }

      // 2. Validate CLMM price range
      if (params.poolType === 'CLMM' && (!params.minPrice || !params.maxPrice)) {
        throw new AppError('INVALID_INPUT', 'Price range (min and max) is required for CLMM pools')
      }

      // 3. Client-side balance validation
      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'liquidity-provider',
        formData: { poolType: params.poolType, feeTier: params.feeTier },
        serviceFee: config?.baseFee ?? 0.1,
        networkFee: config?.networkFee ?? 0.001,
      })

      if (!balanceValidation.hasSufficientBalance) {
        throw new AppError(
          'INSUFFICIENT_FUNDS',
          `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL, but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
        )
      }

      // 4. Build request and call server API
      const requestBody = buildLiquidityRequest(params, context.walletAddress, tokenBAddress)

      const apiResponse = await apiClient<LiquidityProviderRequest, LiquidityProviderResponse>(
        '/api/solana/liquidity-provider',
        requestBody
      )

      // 5. Deserialize transaction and refresh blockhash
      const transaction = Transaction.from(Buffer.from(apiResponse.serializedTransaction, 'base64'))
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      // 6. Sign with wallet
      const signedTransaction = await context.signTransaction(transaction)

      // 7. Submit to network
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // 8. Confirm transaction
      const { kitRpc } = createConnectionPair()
      const confirmationResult = await confirmTransactionWithParallelStrategy(signature, 50000, kitRpc, connection)

      if (!confirmationResult.confirmed) {
        const finalCheck = await connection.getSignatureStatus(signature, {
          searchTransactionHistory: true,
        })
        if (finalCheck?.value?.err) {
          throw new Error(`Transaction failed: ${String(finalCheck.value.err)}`)
        }
        if (!finalCheck?.value?.confirmationStatus) {
          throw new AppError('FINALIZATION_TIMEOUT', 'Transaction confirmation timed out')
        }
      }

      // 9. Build result
      const tokenPairLabel = `${params.tokenA.slice(0, 4)}...${params.tokenA.slice(-4)} — ${params.tokenB}`

      return {
        poolAddress: apiResponse.poolPublicKey,
        signature,
        poolType: params.poolType,
        tokenPair: tokenPairLabel,
        message: `Successfully added liquidity to ${params.poolType} pool`,
      }
    },
    [connection, config?.baseFee, config?.networkFee]
  )

  const toolBase = useToolBase<LiquidityProviderParams, LiquidityProviderResult>(
    {
      toolId: 'liquidity-provider',
      toolName: 'Liquidity Provider',
      requiresWallet: true,
    },
    executeLiquidityProvision
  )

  const provideLiquidity: UseToolBaseReturn<LiquidityProviderParams, LiquidityProviderResult>['execute'] = useCallback(
    async (params: LiquidityProviderParams) => {
      const result = await toolBase.execute(params)

      if (result) {
        showTransactionToast(result.signature, `Liquidity added to ${result.poolType} pool`)
      }

      return result
    },
    [toolBase]
  )

  return {
    provideLiquidity,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}

export default useLiquidityProvider
