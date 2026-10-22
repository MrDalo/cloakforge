/**
 * useLiquidityProvider Hook
 *
 * Client-side hook for adding liquidity to Raydium CPMM and CLMM pools.
 * Uses useToolBase for wallet validation and error handling.
 *
 * Exported helpers (TOKEN_B_MINT_ADDRESSES, resolveTokenBAddress,
 * parseSlippageTolerance, buildLiquidityRequest, buildOpenPositionRequest)
 * are pure functions, making them unit-testable without a React rendering
 * environment.
 */

import { useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey, SendTransactionError, type Connection } from '@solana/web3.js'
import { toast } from 'sonner'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import { useComplianceStore } from '@/lib/compliance/consentStore'
import { validateBalance } from '@/lib/solana/validateBalance'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana'
import {
  getMaxServiceFeeLamports,
  resolveFeeWalletForVerification,
  solToLamportsCeil,
  verifyBeforeSigning,
  type PreparedTransactionExpectation,
} from '@/lib/solana/client'
import { useToolConfig } from '@/stores/toolConfigStore'
import { getAppliedCoupon } from '@/stores/discountCouponStore'
import { MAX_LIQUIDITY_SLIPPAGE_PERCENT, MIN_LIQUIDITY_SLIPPAGE_PERCENT } from '@/lib/schemas/apiSchemas'

import type {
  LiquidityProviderParams,
  LiquidityProviderResult,
  LiquidityProviderRequest,
  LiquidityProviderResponse,
  OpenPositionRequest,
  OpenPositionResponse,
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

/** Platform fee (SOL) assumed when the tool configuration is not loaded; equals the server's default fee. */
const DEFAULT_PLATFORM_FEE_SOL = 0.1

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
 * Parses the form's slippage tolerance (percent) and checks the range the server accepts.
 *
 * @param slippageTolerance - Slippage tolerance from the form, e.g. "0.5".
 * @returns Slippage tolerance in percent.
 * @throws AppError INVALID_INPUT when it is not a number within 0.1–50.
 */
export function parseSlippageTolerance(slippageTolerance: string): number {
  const value = Number(slippageTolerance)
  if (!Number.isFinite(value) || value < MIN_LIQUIDITY_SLIPPAGE_PERCENT || value > MAX_LIQUIDITY_SLIPPAGE_PERCENT) {
    throw new AppError(
      'INVALID_INPUT',
      `Slippage tolerance must be between ${MIN_LIQUIDITY_SLIPPAGE_PERCENT}% and ${MAX_LIQUIDITY_SLIPPAGE_PERCENT}%`
    )
  }
  return value
}

/**
 * Build the pool-creation API request body from form params + resolved addresses.
 * CLMM requests carry the price range and initial price; CPMM requests carry neither.
 * Pure function — no side effects.
 */
export function buildLiquidityRequest(
  params: LiquidityProviderParams,
  walletAddress: string,
  tokenBAddress: string,
  couponCode?: string
): LiquidityProviderRequest {
  const { poolType, tokenA, feeTier, amountA, amountB, minPrice, maxPrice, initialPrice } = params
  const isClmm = poolType === 'CLMM'

  const priceRange = isClmm && minPrice && maxPrice ? { minPrice, maxPrice } : undefined

  return {
    walletAddress,
    ...(couponCode ? { couponCode } : {}),
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
      ...(isClmm && initialPrice ? { initialPrice } : {}),
    },
  }
}

/**
 * Build the CLMM open-position API request body for a confirmed pool.
 * Pure function — no side effects.
 *
 * @throws AppError INVALID_INPUT when the price settings or slippage tolerance are missing/invalid.
 */
export function buildOpenPositionRequest(
  params: LiquidityProviderParams,
  walletAddress: string,
  tokenBAddress: string,
  poolId: string
): OpenPositionRequest {
  const { minPrice, maxPrice, initialPrice } = params
  if (!minPrice || !maxPrice || !initialPrice) {
    throw new AppError('INVALID_INPUT', 'Price range and initial price are required for CLMM pools')
  }

  return {
    walletAddress,
    poolId,
    slippageTolerance: parseSlippageTolerance(params.slippageTolerance),
    poolConfig: {
      poolType: 'CLMM',
      tokenA: params.tokenA,
      tokenB: tokenBAddress,
      feeTier: params.feeTier,
      initialLiquidity: { amountA: params.amountA, amountB: params.amountB },
      priceRange: { minPrice, maxPrice },
      initialPrice,
    },
  }
}

/**
 * Upper bound (lamports) of the SOL the Raydium transaction may wrap: the SOL amount the user entered,
 * when one of the two tokens is wrapped SOL (a position never deposits more than the entered amount).
 * The wrapped-SOL account's rent is added by the verifier.
 */
export function getMaxWrappedSolLamports(params: LiquidityProviderParams, tokenBAddress: string): bigint {
  const wrappedSolMint = TOKEN_B_MINT_ADDRESSES.SOL
  const amounts = [
    ...(params.tokenA === wrappedSolMint ? [params.amountA] : []),
    ...(tokenBAddress === wrappedSolMint ? [params.amountB] : []),
  ]
  return amounts.reduce((total, amount) => total + solToLamportsCeil(Number(amount)), BigInt(0))
}

/**
 * Signs, sends, and confirms a base64-serialized transaction, after verifying it against what the user
 * asked for (WEB3-07): the server could otherwise add transfers or token approvals around the Raydium
 * instruction.
 *
 * `refreshBlockhash` must be false for transactions the server has already
 * partially signed (e.g. the CLMM position-opening transaction, co-signed
 * server-side with the ephemeral position-NFT keypair) — replacing the
 * blockhash after that signature was produced would invalidate it.
 */
async function signSendAndConfirm(
  serializedTransaction: string,
  context: ToolExecutionContext,
  connection: Connection,
  refreshBlockhash: boolean,
  expectation: PreparedTransactionExpectation
): Promise<string> {
  const transaction = Transaction.from(Buffer.from(serializedTransaction, 'base64'))

  if (refreshBlockhash) {
    const { blockhash } = await connection.getLatestBlockhash('confirmed')
    transaction.recentBlockhash = blockhash
  }

  // Verify, then simulate, before the wallet prompt. A server-signed (position) transaction is checked
  // with the blockhash it was signed for; it must not be altered afterwards
  await verifyBeforeSigning({ connection, transactions: [transaction], toolId: 'liquidity-provider' }, expectation)

  const signedTransaction = await context.signTransaction(transaction)

  let signature: string
  try {
    signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    })
  } catch (error) {
    // A preflight rejection is final; any other send error (e.g. a dropped connection) may have
    // happened after the node accepted the transaction, so its outcome is unknown
    if (error instanceof SendTransactionError) throw error
    throw new AppError('FINALIZATION_TIMEOUT', 'The transaction may have been sent, but its status could not be confirmed')
  }

  let finalCheck: Awaited<ReturnType<Connection['getSignatureStatus']>>
  try {
    const { kitRpc } = createConnectionPair()
    const confirmationResult = await confirmTransactionWithParallelStrategy(signature, 50000, kitRpc, connection)
    if (confirmationResult.confirmed) return signature

    finalCheck = await connection.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    })
  } catch {
    // The transaction was sent; failing to read its status says nothing about whether it landed
    throw new AppError('FINALIZATION_TIMEOUT', 'Transaction status could not be checked')
  }

  if (finalCheck?.value?.err) {
    throw new Error(`Transaction failed: ${String(finalCheck.value.err)}`)
  }
  if (!finalCheck?.value?.confirmationStatus) {
    throw new AppError('FINALIZATION_TIMEOUT', 'Transaction confirmation timed out')
  }

  return signature
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

/**
 * A CLMM pool that was created and confirmed on-chain, but whose position-opening step failed or was
 * refused (e.g. SLIPPAGE_EXCEEDED). The pool already exists, so re-submitting the form would fail;
 * the position has to be opened in this pool instead.
 */
export interface PendingLiquidityPosition {
  /** Address of the confirmed pool */
  poolAddress: string
  /** Signature of the confirmed pool-creation transaction */
  poolSignature: string
  /** Resolved Token B mint address */
  tokenBAddress: string
  /** The form params the pool was created with */
  params: LiquidityProviderParams
  /**
   * A position transaction was sent but its outcome is unknown (confirmation timed out or could not be
   * checked), so it may still land. Opening another position before checking could deposit the tokens
   * twice. Stays set until a position is opened or the pending pool is dismissed.
   */
  lastAttemptUnconfirmed: boolean
}

/** A sent transaction whose confirmation timed out or could not be checked: its outcome is unknown, not failed. */
const isUnconfirmedOutcome = (error: unknown): boolean => error instanceof AppError && error.code === 'FINALIZATION_TIMEOUT'

export type UseLiquidityProviderReturn = Omit<
  UseToolBaseReturn<LiquidityProviderParams, LiquidityProviderResult>,
  'execute' | 'validateRequirements'
> & {
  provideLiquidity: UseToolBaseReturn<LiquidityProviderParams, LiquidityProviderResult>['execute']
  /** Set when the pool was created but opening the position failed; cleared once the position is opened. */
  pendingPosition: PendingLiquidityPosition | null
  /**
   * Opens the CLMM position in the already-confirmed pool (calls only the open-position endpoint).
   * Slippage is re-validated; pass a new tolerance to retry with different slippage.
   */
  openPositionInExistingPool: (slippageTolerance?: string) => Promise<LiquidityProviderResult | null>
  /** Forgets the pending pool (it stays on-chain) so a new pool can be created. */
  dismissPendingPosition: () => void
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
  const [pendingPosition, setPendingPosition] = useState<PendingLiquidityPosition | null>(null)

  /**
   * Requests the CLMM position-opening transaction for a confirmed pool, then signs and confirms it.
   * The slippage tolerance is re-validated by buildOpenPositionRequest on every call.
   */
  const openPosition = async (
    context: ToolExecutionContext,
    params: LiquidityProviderParams,
    tokenBAddress: string,
    poolId: string
  ): Promise<{ positionSignature: string; positionNftMint: string }> => {
    // Fail closed before any request when the fee wallet cannot be pinned (production)
    const feeWallet = resolveFeeWalletForVerification()

    const openPositionResponse = await apiClient<OpenPositionRequest, OpenPositionResponse>(
      '/api/solana/liquidity-provider/open-position',
      buildOpenPositionRequest(params, context.walletAddress, tokenBAddress, poolId)
    )

    // Do NOT refresh the blockhash — the server already partial-signed
    // this transaction with the ephemeral position-NFT keypair. The position transaction carries no
    // platform fee; the NFT keypair is the only co-signer allowed besides the wallet.
    const positionSignature = await signSendAndConfirm(openPositionResponse.serializedTransaction, context, connection, false, {
      wallet: context.walletAddress,
      feeWallet,
      maxServiceFeeLamports: BigInt(0),
      operation: {
        kind: 'raydium-open-position',
        tokenA: params.tokenA,
        tokenB: tokenBAddress,
        poolId,
        positionNftMint: openPositionResponse.positionNftMint,
        maxWrappedSolLamports: getMaxWrappedSolLamports(params, tokenBAddress),
      },
    })
    return { positionSignature, positionNftMint: openPositionResponse.positionNftMint }
  }

  const executeLiquidityProvision = async (
    context: ToolExecutionContext,
    params: LiquidityProviderParams
  ): Promise<LiquidityProviderResult> => {
    // A paid pool still waiting for its position is only tracked here (nothing is stored server-side), so
    // a new provision must not overwrite or clear it until the user opens the position or dismisses it
    if (pendingPosition) {
      throw new AppError(
        'INVALID_INPUT',
        'Open the liquidity position in the pool you already created, or dismiss that pool, before creating another one'
      )
    }

    // 1. Resolve Token B address
    const tokenBAddress = resolveTokenBAddress(params.tokenB, params.customTokenB)
    if (!tokenBAddress) {
      throw new AppError('INVALID_INPUT', 'Custom Token B address is required when selecting a custom token')
    }

    // 2. Validate CLMM price settings and slippage before anything is signed
    if (params.poolType === 'CLMM') {
      if (!params.minPrice || !params.maxPrice || !params.initialPrice) {
        throw new AppError('INVALID_INPUT', 'Price range and initial price are required for CLMM pools')
      }
      parseSlippageTolerance(params.slippageTolerance)
    }

    // 3. Client-side balance validation
    const balanceValidation = await validateBalance({
      walletPublicKey: new PublicKey(context.walletAddress),
      connection,
      serviceId: 'liquidity-provider',
      formData: { poolType: params.poolType, feeTier: params.feeTier },
      serviceFee: config?.baseFee ?? DEFAULT_PLATFORM_FEE_SOL,
      networkFee: config?.networkFee ?? 0.001,
    })

    if (!balanceValidation.hasSufficientBalance) {
      throw new AppError(
        'INSUFFICIENT_FUNDS',
        `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL, but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
      )
    }

    // 4. Build request and call server API to prepare the pool-creation transaction
    // (it carries the platform fee and, with a coupon, the coupon instructions). The coupon is read once,
    // so the code sent and the fee limit used for verification come from the same coupon.
    const feeWallet = resolveFeeWalletForVerification()
    const appliedCoupon = getAppliedCoupon()
    const requestBody = buildLiquidityRequest(params, context.walletAddress, tokenBAddress, appliedCoupon?.code)

    const apiResponse = await apiClient<LiquidityProviderRequest, LiquidityProviderResponse>('/api/solana/liquidity-provider', requestBody)

    // 5. Sign, send, and confirm the pool-creation transaction
    const signature = await signSendAndConfirm(apiResponse.serializedTransaction, context, connection, true, {
      wallet: context.walletAddress,
      feeWallet,
      maxServiceFeeLamports: getMaxServiceFeeLamports({
        baseFeeSol: config?.baseFee ?? DEFAULT_PLATFORM_FEE_SOL,
        discountPercentage: appliedCoupon?.discountPercentage,
      }),
      operation: {
        kind: 'raydium-create-pool',
        poolType: params.poolType,
        tokenA: params.tokenA,
        tokenB: tokenBAddress,
        maxWrappedSolLamports: getMaxWrappedSolLamports(params, tokenBAddress),
      },
    })

    // 6. CLMM only: pool creation alone doesn't deposit liquidity (Raydium
    // treats opening a position as a separate on-chain action). Now that
    // the pool is confirmed, request and sign the position-opening
    // transaction that actually deposits the user's tokens.
    let positionSignature: string | undefined
    let positionNftMint: string | undefined

    if (params.poolType === 'CLMM') {
      toast.info('Pool created — opening your liquidity position...', { duration: 4000 })

      try {
        const position = await openPosition(context, params, tokenBAddress, apiResponse.poolPublicKey)
        positionSignature = position.positionSignature
        positionNftMint = position.positionNftMint
      } catch (error) {
        // The pool is already confirmed on-chain (fee and rent paid). Keep its address and signature so
        // the user can open the position in it — re-submitting would try to create the pool again.
        setPendingPosition({
          poolAddress: apiResponse.poolPublicKey,
          poolSignature: signature,
          tokenBAddress,
          params,
          lastAttemptUnconfirmed: isUnconfirmedOutcome(error),
        })
        throw error
      }
    }

    // 7. Build result
    const tokenPairLabel = `${params.tokenA.slice(0, 4)}...${params.tokenA.slice(-4)} — ${params.tokenB}`

    return {
      poolAddress: apiResponse.poolPublicKey,
      signature,
      positionSignature,
      positionNftMint,
      poolType: params.poolType,
      tokenPair: tokenPairLabel,
      message:
        params.poolType === 'CLMM'
          ? 'Successfully created pool and added liquidity'
          : `Successfully added liquidity to ${params.poolType} pool`,
    }
  }

  const toolBase = useToolBase<LiquidityProviderParams, LiquidityProviderResult>(
    {
      toolId: 'liquidity-provider',
      toolName: 'Liquidity Provider',
      requiresWallet: true,
    },
    executeLiquidityProvision
  )

  const executeOpenPosition = async (
    context: ToolExecutionContext,
    slippageTolerance: string | undefined
  ): Promise<LiquidityProviderResult> => {
    if (!pendingPosition) {
      throw new AppError('INVALID_INPUT', 'There is no created pool waiting for a liquidity position')
    }

    const { poolAddress, poolSignature, tokenBAddress, params } = pendingPosition
    let position: Awaited<ReturnType<typeof openPosition>>
    try {
      position = await openPosition(
        context,
        { ...params, slippageTolerance: slippageTolerance ?? params.slippageTolerance },
        tokenBAddress,
        poolAddress
      )
    } catch (error) {
      // A later refusal says nothing about an earlier attempt whose outcome is still unknown
      setPendingPosition({
        ...pendingPosition,
        lastAttemptUnconfirmed: pendingPosition.lastAttemptUnconfirmed || isUnconfirmedOutcome(error),
      })
      throw error
    }
    setPendingPosition(null)

    return {
      poolAddress,
      signature: poolSignature,
      positionSignature: position.positionSignature,
      positionNftMint: position.positionNftMint,
      poolType: params.poolType,
      tokenPair: `${params.tokenA.slice(0, 4)}...${params.tokenA.slice(-4)} — ${params.tokenB}`,
      message: 'Successfully opened liquidity position in your pool',
    }
  }

  const openPositionBase = useToolBase<string | undefined, LiquidityProviderResult>(
    {
      toolId: 'liquidity-provider-open-position',
      toolName: 'Open Liquidity Position',
      requiresWallet: true,
    },
    executeOpenPosition
  )

  const openPositionInExistingPool = async (slippageTolerance?: string): Promise<LiquidityProviderResult | null> => {
    const result = await openPositionBase.execute(slippageTolerance)

    if (result) {
      showTransactionToast(result.positionSignature ?? result.signature, 'Liquidity position opened')
    }

    return result
  }

  const provideLiquidity: UseToolBaseReturn<LiquidityProviderParams, LiquidityProviderResult>['execute'] = async (params) => {
    const result = await toolBase.execute(params)

    if (result) {
      // For CLMM, the position-opening transaction is the one that actually
      // deposits liquidity — surface that signature when present.
      useComplianceStore.getState().recordTransactionSignature(result.signature)
      showTransactionToast(result.positionSignature ?? result.signature, `Liquidity added to ${result.poolType} pool`)
    }

    return result
  }

  return {
    provideLiquidity,
    pendingPosition,
    openPositionInExistingPool,
    dismissPendingPosition: () => setPendingPosition(null),
    isExecuting: toolBase.isExecuting || openPositionBase.isExecuting,
    lastResult: openPositionBase.lastResult ?? toolBase.lastResult,
    reset: () => {
      toolBase.reset()
      openPositionBase.reset()
      setPendingPosition(null)
    },
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}

export default useLiquidityProvider
