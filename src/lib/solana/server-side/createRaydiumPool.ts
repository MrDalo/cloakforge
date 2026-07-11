import 'server-only'

import { PublicKey, type Connection } from '@solana/web3.js'
import { getMint, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import BN from 'bn.js'
import Decimal from 'decimal.js'
import {
  Raydium,
  TxVersion,
  API_URLS,
  TickMath,
  SqrtPriceMath,
  LiquidityMath,
  type ApiCpmmConfigInfo,
  type ClmmConfigInfo,
  type ApiV3PoolInfoConcentratedItem,
} from '@raydium-io/raydium-sdk-v2'
import getServerConfig from '@/lib/config/getServerConfig'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import { createConnectionPair } from '@/lib/solana'
import { liquidityProviderRequestSchema } from '@/lib/schemas/apiSchemas'
import type { LiquidityProviderRequest } from '@/types/liquidityProvider'

export interface CreateRaydiumPoolParams {
  walletPublicKey: PublicKey
  poolConfig: LiquidityProviderRequest['poolConfig']
}

export interface CreateRaydiumPoolResult {
  serializedTransaction: string
  poolPublicKey: string
  estimatedCosts: {
    poolCreation: number
    platformFee: number
    networkFee: number
  }
  message: string
}

export interface CreateRaydiumPositionParams {
  walletPublicKey: PublicKey
  /** The CLMM pool's on-chain address, confirmed by the caller before this is invoked */
  poolId: string
  poolConfig: LiquidityProviderRequest['poolConfig']
}

export interface CreateRaydiumPositionResult {
  serializedTransaction: string
  positionNftMint: string
  estimatedCosts: {
    positionOpening: number
  }
  message: string
}

/**
 * Estimated creation cost in SOL for each pool type.
 * CPMM pools require ~0.19 SOL for rent; CLMM pools require ~0.06 SOL
 * (source: docs.raydium.io/raydium/for-liquidity-providers/pool-fees).
 */
const POOL_CREATION_COSTS: Record<string, number> = {
  CPMM: 0.19,
  CLMM: 0.06,
}

/**
 * Estimated cost in SOL for opening a CLMM position (separate from pool creation).
 * Token-2022 NFT method (~0.0092 SOL) + up to 2 new tick arrays (~0.0722 SOL each)
 * if the chosen price range isn't already initialised by another position.
 * This is a conservative upper bound — shared/popular ranges cost less.
 * (source: docs.raydium.io/raydium/for-liquidity-providers/pool-fees)
 */
const POSITION_NFT_COST_SOL = 0.0092
const TICK_ARRAY_COST_SOL = 0.07216128
const MAX_NEW_TICK_ARRAYS = 2

const PLATFORM_FEE_SOL = 0.1
const NETWORK_FEE_SOL = 0.0005

// Mainnet program addresses — callers on devnet must override via poolConfig extensions
const CPMM_PROGRAM_ID = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C')
const CPMM_POOL_FEE_ACC = new PublicKey('DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8')
const CLMM_PROGRAM_ID = new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK')

interface MintInfo {
  decimals: number
  programId: PublicKey
}

/**
 * Fetches the actual decimals and owning program ID for a mint address from on-chain data.
 * Falls back gracefully: tries TOKEN_2022_PROGRAM_ID first, then TOKEN_PROGRAM_ID.
 * Returns both decimals and the correct program ID so callers can pass the right program
 * to the Raydium SDK (Token-2022 mints require TOKEN_2022_PROGRAM_ID, not the default).
 */
async function fetchMintDecimals(connection: Connection, mintAddress: string): Promise<MintInfo> {
  const mintPublicKey = new PublicKey(mintAddress)
  try {
    const mintInfo = await getMint(connection, mintPublicKey, 'confirmed', TOKEN_2022_PROGRAM_ID)
    return { decimals: mintInfo.decimals, programId: TOKEN_2022_PROGRAM_ID }
  } catch {
    // Not a Token-2022 mint — try standard SPL token program
    const mintInfo = await getMint(connection, mintPublicKey, 'confirmed', TOKEN_PROGRAM_ID)
    return { decimals: mintInfo.decimals, programId: TOKEN_PROGRAM_ID }
  }
}

/**
 * Fetches CPMM fee configs from the Raydium API.
 * Returns the first (default) config. Throws AppError if the fetch fails.
 */
async function fetchCpmmFeeConfig(): Promise<ApiCpmmConfigInfo> {
  const url = `${API_URLS.BASE_HOST}${API_URLS.CPMM_CONFIG}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new AppError('TRANSACTION_FAILED', `Failed to fetch CPMM config from Raydium API: ${response.status}`)
  }
  const data = (await response.json()) as { data: ApiCpmmConfigInfo[] }
  if (!data.data || data.data.length === 0) {
    throw new AppError('TRANSACTION_FAILED', 'No CPMM fee configs returned from Raydium API')
  }
  return data.data[0]
}

/**
 * Fetches CLMM pool configs from the Raydium API.
 * Returns the config matching the requested fee tier exactly.
 *
 * Never silently substitutes a different fee tier: a user who selects 0.25%
 * must get a 0.25% pool or a clear error, not a silently different rate.
 */
async function fetchClmmConfig(feeTier: string): Promise<ClmmConfigInfo> {
  const url = `${API_URLS.BASE_HOST}${API_URLS.CLMM_CONFIG}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new AppError('TRANSACTION_FAILED', `Failed to fetch CLMM config from Raydium API: ${response.status}`)
  }
  const data = (await response.json()) as { data: ClmmConfigInfo[] }
  if (!data.data || data.data.length === 0) {
    throw new AppError('TRANSACTION_FAILED', 'No CLMM configs returned from Raydium API')
  }
  // Convert fee tier percentage to basis points (e.g. "0.05" → 500)
  const bps = Math.round(parseFloat(feeTier) * 10_000)
  const matched = data.data.find((c) => c.tradeFeeRate === bps)
  if (!matched) {
    throw new AppError('INVALID_INPUT', `No CLMM pool config available for fee tier ${feeTier}% — please choose a different fee tier`)
  }
  return matched
}

interface ClmmPositionRangeParams {
  tickLower: number
  tickUpper: number
  liquidity: BN
  /** Amounts in the SDK's canonical mintA/mintB order — may be swapped vs. the user's tokenA/tokenB */
  amountMaxA: BN
  amountMaxB: BN
}

/**
 * Computes the tick range and liquidity for opening a CLMM position, matching
 * the user's requested price range (minPrice/maxPrice, quoted as tokenB-per-tokenA)
 * and deposit amounts.
 *
 * IMPORTANT — canonical mint ordering: Raydium's CLMM program always orders
 * a pool's mintA/mintB by ascending public key, regardless of which token the
 * caller passed as "mint1"/"mint2" at pool creation. If poolConfig.tokenA sorts
 * after poolConfig.tokenB, the SDK internally swaps them and inverts the price
 * (see raydium-sdk-v2's Clmm.createPool). poolInfo.mintA/mintB reflect the
 * REAL on-chain order, so this function detects the swap by comparing addresses
 * and inverts/swaps the user's price range and amounts to match — using the
 * user's values directly without this check would silently open a position at
 * the wrong price range (or fail on-chain) whenever the swap occurs.
 */
function computeClmmPositionRange(
  poolInfo: ApiV3PoolInfoConcentratedItem,
  tickSpacing: number,
  poolConfig: LiquidityProviderRequest['poolConfig'],
  mintInfoA: MintInfo,
  mintInfoB: MintInfo
): ClmmPositionRangeParams {
  const { minPrice, maxPrice } = poolConfig.priceRange ?? {}
  if (!minPrice || !maxPrice) {
    throw new AppError('INVALID_INPUT', 'CLMM pool requires both priceRange.minPrice and priceRange.maxPrice')
  }

  const decimalsA = poolInfo.mintA.decimals
  const decimalsB = poolInfo.mintB.decimals

  // Did the SDK swap tokenA/tokenB when canonicalising by public key?
  const swapped = poolInfo.mintA.address !== poolConfig.tokenA

  // Prices are quoted "tokenB per tokenA" in the UI. If the SDK swapped the
  // mints, the canonical price convention is inverted, so invert and swap
  // min/max (inverting a range flips which bound is the lower one).
  const priceForTickLower = swapped ? new Decimal(1).div(maxPrice) : new Decimal(minPrice)
  const priceForTickUpper = swapped ? new Decimal(1).div(minPrice) : new Decimal(maxPrice)

  const tickLower = TickMath.getTickWithPriceAndTickspacing(priceForTickLower, tickSpacing, decimalsA, decimalsB)
  const tickUpper = TickMath.getTickWithPriceAndTickspacing(priceForTickUpper, tickSpacing, decimalsA, decimalsB)
  if (tickLower >= tickUpper) {
    throw new AppError('INVALID_INPUT', 'Max Price must be greater than Min Price for a CLMM position')
  }

  const sqrtPriceLowerX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tickLower)
  const sqrtPriceUpperX64 = SqrtPriceMath.getSqrtPriceX64FromTick(tickUpper)
  // Current pool price, fetched from real (or mock) pool state — for a fresh
  // pool with no trades yet, this equals the initial price it was created with.
  const currentSqrtPriceX64 = SqrtPriceMath.priceToSqrtPriceX64(new Decimal(poolInfo.price), decimalsA, decimalsB)

  // Map the user's amountA/amountB (defined against their own tokenA/tokenB)
  // onto the SDK's canonical mintA/mintB order.
  const amountAScaled = new BN(new Decimal(poolConfig.initialLiquidity.amountA).mul(Decimal.pow(10, mintInfoA.decimals)).toFixed(0))
  const amountBScaled = new BN(new Decimal(poolConfig.initialLiquidity.amountB).mul(Decimal.pow(10, mintInfoB.decimals)).toFixed(0))
  const amountMaxA = swapped ? amountBScaled : amountAScaled
  const amountMaxB = swapped ? amountAScaled : amountBScaled

  const liquidity = LiquidityMath.getLiquidityFromTokenAmounts(
    currentSqrtPriceX64,
    sqrtPriceLowerX64,
    sqrtPriceUpperX64,
    amountMaxA,
    amountMaxB
  )

  return { tickLower, tickUpper, liquidity, amountMaxA, amountMaxB }
}

/**
 * Prepares an unsigned Raydium pool-creation transaction for client-side signing.
 *
 * Flow:
 *  1. Validate input via Zod schema
 *  2. Connect to private RPC via createConnectionPair
 *  3. Fetch actual token decimals from on-chain mint accounts
 *  4. Fetch fee/amm configs from Raydium API
 *  5. Initialise Raydium SDK with the legacy Connection
 *  6. Delegate to raydium.cpmm.createPool or raydium.clmm.createPool
 *  7. Serialise the unsigned transaction and return it as base64
 */
export async function createRaydiumPoolTransaction({
  walletPublicKey,
  poolConfig,
}: CreateRaydiumPoolParams): Promise<CreateRaydiumPoolResult> {
  const serverConfig = getServerConfig()
  const logger = getLogger({ context: 'createRaydiumPool' })

  // Validate inputs using the shared Zod schema (addresses, pool type, fee tier)
  const validation = liquidityProviderRequestSchema.safeParse({
    walletAddress: walletPublicKey.toString(),
    poolConfig,
  })
  if (!validation.success) {
    const messages = validation.error.issues.map((i) => i.message).join('; ')
    throw new AppError('INVALID_INPUT', `Invalid pool parameters: ${messages}`)
  }

  // Establish connection using private RPC endpoint (never expose to client)
  const { legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  let serializedTransaction: string
  let poolPublicKey: string
  const poolType = poolConfig.poolType

  try {
    // Fetch actual token decimals and program IDs from on-chain mint accounts
    const [mintInfoA, mintInfoB] = await Promise.all([
      fetchMintDecimals(legacyConnection, poolConfig.tokenA),
      fetchMintDecimals(legacyConnection, poolConfig.tokenB),
    ])

    // Initialise Raydium SDK — owner is set so the SDK can derive ATAs
    const raydium = await Raydium.load({
      connection: legacyConnection,
      owner: walletPublicKey,
      disableFeatureCheck: true,
      disableLoadToken: true,
    })

    if (poolType === 'CPMM') {
      // Scale amounts using Decimal arithmetic to avoid floating-point precision loss
      const mintAAmount = new BN(new Decimal(poolConfig.initialLiquidity.amountA).mul(Decimal.pow(10, mintInfoA.decimals)).toFixed(0))
      const mintBAmount = new BN(new Decimal(poolConfig.initialLiquidity.amountB).mul(Decimal.pow(10, mintInfoB.decimals)).toFixed(0))

      // Fetch fee config from Raydium API
      const feeConfig = await fetchCpmmFeeConfig()

      const txData = await raydium.cpmm.createPool({
        programId: CPMM_PROGRAM_ID,
        poolFeeAccount: CPMM_POOL_FEE_ACC,
        mintA: {
          address: poolConfig.tokenA,
          decimals: mintInfoA.decimals,
          programId: mintInfoA.programId.toString(),
        },
        mintB: {
          address: poolConfig.tokenB,
          decimals: mintInfoB.decimals,
          programId: mintInfoB.programId.toString(),
        },
        mintAAmount,
        mintBAmount,
        startTime: new BN(0),
        ownerInfo: { useSOLBalance: true },
        associatedOnly: false,
        txVersion: TxVersion.LEGACY,
        feeConfig,
      })

      const tx = txData.transaction
      serializedTransaction = Buffer.from(tx.serialize({ requireAllSignatures: false })).toString('base64')
      poolPublicKey = (txData.extInfo?.address as { poolId?: PublicKey })?.poolId?.toString() ?? 'pending'
    } else {
      // CLMM — priceRange is required by the schema for CLMM pools; this is a safety guard
      if (!poolConfig.priceRange?.minPrice || !poolConfig.priceRange?.maxPrice) {
        throw new AppError('INVALID_INPUT', 'CLMM pool requires priceRange.minPrice and priceRange.maxPrice')
      }
      const initialPrice = new Decimal(poolConfig.priceRange.minPrice)

      // Fetch amm config from Raydium API (matched to the requested fee tier)
      const ammConfig = await fetchClmmConfig(poolConfig.feeTier)

      const poolTxData = await raydium.clmm.createPool({
        programId: CLMM_PROGRAM_ID,
        mint1: {
          address: poolConfig.tokenA,
          decimals: mintInfoA.decimals,
          programId: mintInfoA.programId.toString(),
          chainId: 101,
          logoURI: '',
          symbol: '',
          name: '',
          tags: [],
          extensions: {},
        },
        mint2: {
          address: poolConfig.tokenB,
          decimals: mintInfoB.decimals,
          programId: mintInfoB.programId.toString(),
          chainId: 101,
          logoURI: '',
          symbol: '',
          name: '',
          tags: [],
          extensions: {},
        },
        ammConfig,
        initialPrice,
        txVersion: TxVersion.LEGACY,
      })

      const poolTx = poolTxData.transaction
      serializedTransaction = Buffer.from(poolTx.serialize({ requireAllSignatures: false })).toString('base64')
      poolPublicKey = (poolTxData.extInfo?.address as { poolId?: PublicKey })?.poolId?.toString() ?? 'pending'

      // Opening the LP position (which actually deposits liquidity) happens in
      // a SEPARATE follow-up call — see createRaydiumPositionTransaction below —
      // once this pool-creation transaction has been confirmed on-chain. See
      // that function's docstring for why this can't be done in this same
      // request/transaction.
    }
  } catch (error) {
    logger.error('Raydium SDK call failed', {
      error: error instanceof Error ? error.message : String(error),
      poolType,
    })
    // Re-throw AppError instances as-is; wrap others
    if (error instanceof AppError) throw error
    throw new AppError(
      'TRANSACTION_FAILED',
      `Failed to create ${poolType} pool transaction: ${error instanceof Error ? error.message : String(error)}`
    )
  }

  const estimatedCosts = {
    poolCreation: POOL_CREATION_COSTS[poolType] ?? 0,
    platformFee: PLATFORM_FEE_SOL,
    networkFee: NETWORK_FEE_SOL,
  }

  return {
    serializedTransaction,
    poolPublicKey,
    estimatedCosts,
    message: `${poolType} pool transaction prepared successfully`,
  }
}

/**
 * Prepares an unsigned transaction that opens a CLMM position — minting a
 * position NFT and depositing the user's tokens into the requested price
 * range. This is what actually provides liquidity for a CLMM pool.
 *
 * MUST run as a separate call after the pool-creation transaction from
 * createRaydiumPoolTransaction has been confirmed on-chain, for two reasons:
 *  1. Correctness: per Raydium's docs, pool creation and position opening are
 *     distinct on-chain actions — a position can't be opened in a pool that
 *     doesn't exist yet, and this function fetches the pool's REAL state via
 *     RPC (getPoolInfoFromRpc), which requires the pool to actually exist.
 *  2. Signature safety: opening a position needs a fresh ephemeral keypair
 *     (the position NFT mint) that the SERVER signs here, since it's not a
 *     user secret. That signature is only valid for the exact blockhash used
 *     when building this transaction — if too much time passed since pool
 *     creation, calling this fresh (rather than pre-building it earlier)
 *     keeps the blockhash — and therefore this signature — valid by the time
 *     the client signs and submits it moments later.
 */
export async function createRaydiumPositionTransaction({
  walletPublicKey,
  poolId,
  poolConfig,
}: CreateRaydiumPositionParams): Promise<CreateRaydiumPositionResult> {
  const logger = getLogger({ context: 'createRaydiumPosition' })
  const serverConfig = getServerConfig()

  if (poolConfig.poolType !== 'CLMM') {
    throw new AppError('INVALID_INPUT', 'Opening a position only applies to CLMM pools')
  }
  if (!poolConfig.priceRange?.minPrice || !poolConfig.priceRange?.maxPrice) {
    throw new AppError('INVALID_INPUT', 'CLMM position requires priceRange.minPrice and priceRange.maxPrice')
  }

  const { legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  try {
    const [mintInfoA, mintInfoB] = await Promise.all([
      fetchMintDecimals(legacyConnection, poolConfig.tokenA),
      fetchMintDecimals(legacyConnection, poolConfig.tokenB),
    ])

    const raydium = await Raydium.load({
      connection: legacyConnection,
      owner: walletPublicKey,
      disableFeatureCheck: true,
      disableLoadToken: true,
    })

    // Fetch the pool's REAL on-chain state directly via RPC — no dependency
    // on Raydium's centralized indexer, which could lag right after creation.
    const { poolInfo, poolKeys } = await raydium.clmm.getPoolInfoFromRpc(poolId)

    const { tickLower, tickUpper, liquidity, amountMaxA, amountMaxB } = computeClmmPositionRange(
      poolInfo,
      poolInfo.config.tickSpacing,
      poolConfig,
      mintInfoA,
      mintInfoB
    )

    const positionTxData = await raydium.clmm.openPositionFromLiquidity({
      poolInfo,
      poolKeys,
      ownerInfo: { useSOLBalance: true },
      amountMaxA,
      amountMaxB,
      tickLower,
      tickUpper,
      liquidity,
      associatedOnly: false,
      withMetadata: 'create',
      // Token-2022 NFT: Raydium's cheaper, modern position-ownership method
      // (~0.0092 SOL vs ~0.0215 SOL for the legacy SPL + Metaplex method).
      nft2022: true,
      txVersion: TxVersion.LEGACY,
      computeBudgetConfig: undefined,
    })

    // The NFT mint is a fresh ephemeral keypair the SDK generated — not a
    // user secret, so it's safe for the server to sign with it here. The
    // client only needs to add the wallet's own signature afterward.
    const positionTx = positionTxData.transaction
    if (positionTxData.signers.length > 0) {
      positionTx.partialSign(...positionTxData.signers)
    }
    const serializedTransaction = Buffer.from(positionTx.serialize({ requireAllSignatures: false })).toString('base64')
    const positionNftMint = (positionTxData.extInfo?.address as { nftMint?: PublicKey })?.nftMint?.toString()
    if (!positionNftMint) {
      throw new AppError('TRANSACTION_FAILED', 'Raydium SDK did not return a position NFT mint address')
    }

    return {
      serializedTransaction,
      positionNftMint,
      estimatedCosts: {
        positionOpening: POSITION_NFT_COST_SOL + TICK_ARRAY_COST_SOL * MAX_NEW_TICK_ARRAYS,
      },
      message: 'Position-opening transaction prepared successfully',
    }
  } catch (error) {
    logger.error('Raydium SDK call failed while opening CLMM position', {
      error: error instanceof Error ? error.message : String(error),
      poolId,
    })
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', `Failed to open CLMM position: ${error instanceof Error ? error.message : String(error)}`)
  }
}
