import 'server-only'

import { getTransferFeeConfig, type TransferFeeConfig } from '@solana/spl-token'
import {
  LAMPORTS_PER_SOL,
  PACKET_DATA_SIZE,
  PublicKey,
  SystemProgram,
  Transaction,
  type Connection,
  type Signer,
  type TransactionInstruction,
} from '@solana/web3.js'
import BN from 'bn.js'
import Decimal from 'decimal.js'
import { getTransferAmountFee, Raydium, TxVersion } from '@raydium-io/raydium-sdk-v2'
import getServerConfig from '@/lib/config/getServerConfig'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import { createConnectionPair, parseTokenAmount } from '@/lib/solana'
import { liquidityProviderRequestSchema, openPositionRequestSchema } from '@/lib/schemas/apiSchemas'
import type { LiquidityProviderRequest, PoolType } from '@/types/liquidityProvider'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import { applyCouponToServiceFee } from './discountedServiceFee'
import { resolveToolBaseFee } from './defaultToolFees'
import { decodeMintAccount } from './getMintAccountInfo'
import { fetchClmmAmmConfig, fetchCpmmFeeConfig } from './raydiumFeeConfigs'
import {
  assertPoolMatchesRequest,
  assertPoolPriceWithinSlippage,
  computeClmmPosition,
  poolPriceInRequestOrder,
  type ClmmPositionConfig,
} from './raydiumClmmPosition'

export interface CreateRaydiumPoolParams {
  walletPublicKey: PublicKey
  poolConfig: LiquidityProviderRequest['poolConfig']
  /** Optional discount coupon applied to the platform fee */
  couponCode?: string
}

export interface CreateRaydiumPoolResult {
  serializedTransaction: string
  poolPublicKey: string
  estimatedCosts: {
    poolCreation: number
    /** Platform fee (SOL) charged by the transaction, after any coupon discount */
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
  /** Slippage tolerance in percent (0.1–50) */
  slippageTolerance: number
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
const POOL_CREATION_COSTS: Record<PoolType, number> = {
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

const NETWORK_FEE_SOL = 0.0005

/**
 * Largest serialized transaction (bytes) the builders return: the 1232-byte packet limit minus
 * 32 bytes of safety margin for account states the measured cases below do not cover.
 *
 * The platform fee and coupon instructions are added to the pool-creation transaction itself, so
 * they are paid only if the pool is created (no separate fee transaction is needed). Measured with
 * the real SDK in createRaydiumPool.size.test.ts, including the service memo, the fee transfer and a
 * coupon memo + marker transfer: CPMM with a Token-2022 token and SOL wrapping (the largest case)
 * ~1190 bytes, CPMM with an SPL token and SOL ~1150, CLMM pool creation ~840. The CLMM position
 * transaction carries no platform instructions (~1030 bytes).
 */
export const MAX_RAYDIUM_TRANSACTION_SIZE = PACKET_DATA_SIZE - 32

// Raydium mainnet program and fee-receiver addresses (the tool builds mainnet transactions only)
const CPMM_PROGRAM_ID = new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C')
const CPMM_POOL_FEE_ACC = new PublicKey('DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8')
const CLMM_PROGRAM_ID = new PublicKey('CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK')

/** Mint metadata the SDK needs for a CLMM `createPool` call (display fields are unused). */
const CLMM_MINT_DISPLAY_FIELDS = { chainId: 101, logoURI: '', symbol: '', name: '', tags: [], extensions: {} }

const logger = getLogger({ context: 'createRaydiumPool' })

interface MintInfo {
  decimals: number
  programId: PublicKey
  /** Token-2022 transfer fee configuration, null for mints without the extension */
  transferFeeConfig: TransferFeeConfig | null
}

/** Result of building the Raydium part of a pool-creation transaction. */
interface RaydiumPoolBuild {
  transaction: Transaction
  signers: Signer[]
  poolId: string
}

/**
 * Reads both pool mints in one RPC call and resolves each one's token program from the account
 * owner, so Token-2022 mints are passed to the SDK with the Token-2022 program.
 *
 * @param connection - Private-RPC connection.
 * @param tokenA - Token A mint address.
 * @param tokenB - Token B mint address.
 * @returns On-chain decimals and token program of each mint.
 * @throws AppError TOKEN_NOT_FOUND / INVALID_MINT when an address is not an initialized mint.
 */
async function fetchPoolMints(connection: Connection, tokenA: string, tokenB: string): Promise<[MintInfo, MintInfo]> {
  const mintAddresses = [new PublicKey(tokenA), new PublicKey(tokenB)]
  const accounts = await connection.getMultipleAccountsInfo(mintAddresses, 'confirmed')
  const [mintA, mintB] = mintAddresses.map((mintAddress, index) => {
    const { decimals, programId, mint } = decodeMintAccount(mintAddress, accounts[index] ?? null)
    return { decimals, programId, transferFeeConfig: getTransferFeeConfig(mint) }
  })
  return [mintA, mintB]
}

/**
 * Rejects a CLMM request whose token amount cannot cover its mint's Token-2022 transfer fee, before
 * any platform fee is charged.
 *
 * CLMM pool creation moves no tokens; the liquidity is deposited by the later position transaction,
 * whose program check is `amount + transfer_fee <= amount_max`. That step re-reads each mint's
 * transfer fee from the pool account and sizes the position from the user's amount net of the fee
 * (see `computeClmmPosition`), so a fee-bearing mint is supported. The one case it cannot satisfy
 * is an amount entirely consumed by the fee, which would otherwise surface only after the user paid
 * for an empty pool. The fee is read at the current epoch; the position step recomputes it then.
 *
 * @throws AppError INVALID_INPUT when a token's amount is not larger than its current transfer fee.
 */
async function assertClmmAmountsCoverTransferFees(
  connection: Connection,
  poolConfig: CreateRaydiumPoolParams['poolConfig'],
  mintInfoA: MintInfo,
  mintInfoB: MintInfo
): Promise<void> {
  const sides = [
    { mintInfo: mintInfoA, amount: poolConfig.initialLiquidity.amountA, token: poolConfig.tokenA },
    { mintInfo: mintInfoB, amount: poolConfig.initialLiquidity.amountB, token: poolConfig.tokenB },
  ].filter((side) => side.mintInfo.transferFeeConfig !== null)
  if (sides.length === 0) return

  const epochInfo = await connection.getEpochInfo('confirmed')
  for (const { mintInfo, amount, token } of sides) {
    const baseUnits = toBaseUnits(amount, mintInfo.decimals)
    const { fee } = getTransferAmountFee(baseUnits, mintInfo.transferFeeConfig ?? undefined, epochInfo, false)
    logger.info('CLMM pool uses a Token-2022 mint with a transfer fee', { token })
    if (fee && fee.gte(baseUnits)) {
      throw new AppError(
        'INVALID_INPUT',
        'The amount for a token with a transfer fee is too small to cover that fee. Increase the amount before creating the pool.'
      )
    }
  }
}

/** Converts a UI amount to base units (exact decimal math, on-chain decimals). */
const toBaseUnits = (amount: string, decimals: number): BN => new BN(parseTokenAmount(amount, decimals).toString())

/** Generic client message for an unexpected failure; the cause is logged, never returned. */
const preparationFailed = (what: string): AppError =>
  new AppError(
    'TRANSACTION_FAILED',
    `Failed to prepare the ${what} transaction. Check that your wallet holds both tokens and try again.`,
    500
  )

/**
 * Loads the Raydium SDK against the private RPC connection, with the user's wallet as owner so
 * the SDK can find and create the wallet's token accounts. Token lists and feature checks are
 * disabled (no extra network calls).
 */
const loadRaydium = (connection: Connection, owner: PublicKey): Promise<Raydium> =>
  Raydium.load({ connection, owner, disableFeatureCheck: true, disableLoadToken: true })

/**
 * Resolves the configured fee wallet.
 *
 * @throws AppError 503 when FEE_WALLET_ADDRESS is missing or invalid — the fee is never skipped.
 */
function resolveFeeWallet(): PublicKey {
  const { feeWalletAddress } = getServerConfig()
  try {
    return new PublicKey(feeWalletAddress)
  } catch {
    logger.error('FEE_WALLET_ADDRESS is missing or invalid; refusing to build an unpaid pool transaction')
    throw new AppError('SERVICE_UNAVAILABLE', undefined, 503)
  }
}

/**
 * Builds the platform instructions of the pool-creation transaction: the service memo (used to
 * attribute fee-wallet income), the coupon memo + marker transfer, and the platform fee transfer.
 *
 * @param payer - The user's wallet (fee payer and fee source).
 * @param poolType - Pool type, recorded in the service memo.
 * @param feeSOL - Platform fee after the coupon discount.
 * @param couponInstructions - Instructions from {@link applyCouponToServiceFee} (empty without a coupon).
 */
function buildPlatformInstructions(
  payer: PublicKey,
  poolType: PoolType,
  feeSOL: number,
  couponInstructions: TransactionInstruction[]
): TransactionInstruction[] {
  const instructions = [createServiceMemoInstruction(SERVICE_IDENTIFIERS.LIQUIDITY_PROVIDER, `create:${poolType}`), ...couponInstructions]

  const feeLamports = Math.floor(feeSOL * LAMPORTS_PER_SOL)
  if (feeLamports > 0) {
    instructions.push(SystemProgram.transfer({ fromPubkey: payer, toPubkey: resolveFeeWallet(), lamports: feeLamports }))
  }
  return instructions
}

/**
 * Serializes a (partially signed) transaction, enforcing {@link MAX_RAYDIUM_TRANSACTION_SIZE}.
 *
 * @throws AppError 500 when it cannot be serialized or is too large (size details are logged).
 */
function serializeWithinSizeLimit(transaction: Transaction, what: string): string {
  let wire: Buffer
  try {
    wire = transaction.serialize({ requireAllSignatures: false })
  } catch (error) {
    // web3.js throws "Transaction too large" past PACKET_DATA_SIZE
    logger.error('Failed to serialize the Raydium transaction', error, { what, instructions: transaction.instructions.length })
    throw preparationFailed(what)
  }

  if (wire.length > MAX_RAYDIUM_TRANSACTION_SIZE) {
    logger.error('Raydium transaction exceeds the size limit', undefined, { what, size: wire.length, limit: MAX_RAYDIUM_TRANSACTION_SIZE })
    throw preparationFailed(what)
  }
  return wire.toString('base64')
}

/** Builds the SDK's CPMM pool-creation transaction (pool + initial deposit, atomically). */
async function buildCpmmPool(
  raydium: Raydium,
  poolConfig: CreateRaydiumPoolParams['poolConfig'],
  mintInfoA: MintInfo,
  mintInfoB: MintInfo
): Promise<RaydiumPoolBuild> {
  const feeConfig = await fetchCpmmFeeConfig(poolConfig.feeTier)

  const txData = await raydium.cpmm.createPool({
    programId: CPMM_PROGRAM_ID,
    poolFeeAccount: CPMM_POOL_FEE_ACC,
    mintA: { address: poolConfig.tokenA, decimals: mintInfoA.decimals, programId: mintInfoA.programId.toBase58() },
    mintB: { address: poolConfig.tokenB, decimals: mintInfoB.decimals, programId: mintInfoB.programId.toBase58() },
    mintAAmount: toBaseUnits(poolConfig.initialLiquidity.amountA, mintInfoA.decimals),
    mintBAmount: toBaseUnits(poolConfig.initialLiquidity.amountB, mintInfoB.decimals),
    startTime: new BN(0),
    ownerInfo: { useSOLBalance: true },
    // Deposit only from the wallet's associated token accounts: the client verifier requires them
    associatedOnly: true,
    txVersion: TxVersion.LEGACY,
    feeConfig,
  })

  return { transaction: txData.transaction, signers: txData.signers, poolId: txData.extInfo.address.poolId.toBase58() }
}

/**
 * Builds the SDK's CLMM pool-creation transaction, opening the pool at the user's initial price.
 * Liquidity is deposited by a separate position transaction (see {@link createRaydiumPositionTransaction}).
 */
async function buildClmmPool(
  raydium: Raydium,
  poolConfig: CreateRaydiumPoolParams['poolConfig'],
  mintInfoA: MintInfo,
  mintInfoB: MintInfo
): Promise<RaydiumPoolBuild> {
  // The request schema requires initialPrice for CLMM; this keeps the type narrow
  if (!poolConfig.initialPrice) {
    throw new AppError('INVALID_INPUT', 'Initial price is required for CLMM pools')
  }

  const ammConfig = await fetchClmmAmmConfig(poolConfig.feeTier)

  const txData = await raydium.clmm.createPool({
    programId: CLMM_PROGRAM_ID,
    mint1: {
      address: poolConfig.tokenA,
      decimals: mintInfoA.decimals,
      programId: mintInfoA.programId.toBase58(),
      ...CLMM_MINT_DISPLAY_FIELDS,
    },
    mint2: {
      address: poolConfig.tokenB,
      decimals: mintInfoB.decimals,
      programId: mintInfoB.programId.toBase58(),
      ...CLMM_MINT_DISPLAY_FIELDS,
    },
    ammConfig,
    // Quoted as tokenB per tokenA; the SDK inverts it when it reorders the mints canonically
    initialPrice: new Decimal(poolConfig.initialPrice),
    txVersion: TxVersion.LEGACY,
  })

  return { transaction: txData.transaction, signers: txData.signers, poolId: txData.extInfo.address.id }
}

/**
 * Prepares an unsigned Raydium pool-creation transaction for client-side signing.
 *
 * Flow:
 *  1. Validate input with the shared Zod schema (also run by the API route)
 *  2. Resolve the platform fee (tool config, fail-closed minimum) and apply the coupon
 *  3. Read token decimals and programs on-chain via the private RPC
 *  4. Build the pool instructions with the Raydium SDK (CPMM: pool + deposit; CLMM: pool at
 *     the user's initial price)
 *  5. Prepend the service memo, coupon instructions and fee transfer, so the fee is only paid
 *     if the pool is created, and serialize within the packet size limit
 *
 * @param params - Wallet, pool configuration and optional coupon code.
 * @returns The base64 unsigned transaction, pool address and cost estimates.
 * @throws AppError for invalid input, unusable coupons, unavailable dependencies or build failures
 *   (messages are generic; SDK details stay in the logs).
 */
export async function createRaydiumPoolTransaction({
  walletPublicKey,
  poolConfig,
  couponCode,
}: CreateRaydiumPoolParams): Promise<CreateRaydiumPoolResult> {
  const validation = liquidityProviderRequestSchema.safeParse({ walletAddress: walletPublicKey.toBase58(), poolConfig, couponCode })
  if (!validation.success) {
    const messages = validation.error.issues.map((issue) => issue.message).join('; ')
    throw new AppError('INVALID_INPUT', `Invalid pool parameters: ${messages}`)
  }

  const poolType = poolConfig.poolType
  const { legacyConnection } = createConnectionPair(getServerConfig().rpcPrivateEndpoint)

  try {
    const baseFeeSOL = await resolveToolBaseFee('liquidity-provider')
    const { feeSOL, couponInstructions } = await applyCouponToServiceFee(baseFeeSOL, couponCode, walletPublicKey)

    const [mintInfoA, mintInfoB] = await fetchPoolMints(legacyConnection, poolConfig.tokenA, poolConfig.tokenB)

    if (poolType === 'CLMM') {
      await assertClmmAmountsCoverTransferFees(legacyConnection, poolConfig, mintInfoA, mintInfoB)
    }

    const raydium = await loadRaydium(legacyConnection, walletPublicKey)
    const pool =
      poolType === 'CPMM'
        ? await buildCpmmPool(raydium, poolConfig, mintInfoA, mintInfoB)
        : await buildClmmPool(raydium, poolConfig, mintInfoA, mintInfoB)

    // Pool creation needs only the wallet's signature; any other signer would be invalidated
    // when the client refreshes the blockhash, so fail closed instead of returning a broken tx
    if (pool.signers.length > 0) {
      logger.error('Raydium pool creation unexpectedly requires extra signers', undefined, { poolType, signers: pool.signers.length })
      throw preparationFailed(`${poolType} pool`)
    }

    const { blockhash, lastValidBlockHeight } = await legacyConnection.getLatestBlockhash('confirmed')
    const transaction = new Transaction({ feePayer: walletPublicKey, blockhash, lastValidBlockHeight }).add(
      ...buildPlatformInstructions(walletPublicKey, poolType, feeSOL, couponInstructions),
      ...pool.transaction.instructions
    )

    return {
      serializedTransaction: serializeWithinSizeLimit(transaction, `${poolType} pool`),
      poolPublicKey: pool.poolId,
      estimatedCosts: {
        poolCreation: POOL_CREATION_COSTS[poolType],
        platformFee: feeSOL,
        networkFee: NETWORK_FEE_SOL,
      },
      message: `${poolType} pool transaction prepared successfully`,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    logger.error('Raydium pool transaction preparation failed', error, { poolType })
    throw preparationFailed(`${poolType} pool`)
  }
}

/**
 * Prepares a transaction that opens a CLMM position — minting the position NFT and depositing the
 * user's tokens into the requested price range. This is what provides the liquidity of a CLMM pool.
 *
 * Runs as a separate call after the pool-creation transaction has confirmed, because the position
 * needs the pool's real on-chain state, and because the server co-signs with a fresh position-NFT
 * keypair whose signature is only valid for the blockhash set here.
 *
 * Safety checks before building (the pool ID comes from the client, and an empty pool's price can
 * be moved by anyone for free):
 *  - the pool is owned by the Raydium CLMM program and holds exactly the requested mints and fee tier;
 *  - the current pool price is within `slippageTolerance` of the user's initial price;
 *  - the deposit maximums are the expected amounts plus `slippageTolerance` plus any Token-2022
 *    transfer fee (the program checks `amount + fee <= max`), so the transaction fails on-chain if
 *    the price moves further before it lands, and is rejected here if the amounts cannot cover the fee.
 *
 * @param params - Wallet, pool ID, pool configuration and slippage tolerance.
 * @returns The base64 transaction (co-signed by the position-NFT keypair) and the NFT mint.
 * @throws AppError for invalid input, a mismatched pool, a moved price or build failures.
 */
export async function createRaydiumPositionTransaction({
  walletPublicKey,
  poolId,
  poolConfig,
  slippageTolerance,
}: CreateRaydiumPositionParams): Promise<CreateRaydiumPositionResult> {
  const validation = openPositionRequestSchema.safeParse({
    walletAddress: walletPublicKey.toBase58(),
    poolId,
    poolConfig,
    slippageTolerance,
  })
  if (!validation.success) {
    const messages = validation.error.issues.map((issue) => issue.message).join('; ')
    throw new AppError('INVALID_INPUT', `Invalid position parameters: ${messages}`)
  }
  const positionConfig: ClmmPositionConfig = validation.data.poolConfig

  const { legacyConnection } = createConnectionPair(getServerConfig().rpcPrivateEndpoint)

  try {
    const raydium = await loadRaydium(legacyConnection, walletPublicKey)

    // The pool's REAL on-chain state via RPC — no dependency on Raydium's indexer, which can lag
    const { poolInfo, poolKeys, computePoolInfo } = await raydium.clmm.getPoolInfoFromRpc(poolId)
    assertPoolMatchesRequest(poolInfo, CLMM_PROGRAM_ID.toBase58(), positionConfig)

    const poolPrice = poolPriceInRequestOrder(poolInfo, computePoolInfo.sqrtPriceX64, positionConfig.tokenA)
    assertPoolPriceWithinSlippage(poolPrice, new Decimal(positionConfig.initialPrice), slippageTolerance)

    // Selects the transfer fee in force for Token-2022 mints; poolInfo carries each mint's fee config
    const epochInfo = await legacyConnection.getEpochInfo('confirmed')
    const { tickLower, tickUpper, liquidity, amountMaxA, amountMaxB } = computeClmmPosition(
      poolInfo,
      computePoolInfo.sqrtPriceX64,
      positionConfig,
      slippageTolerance,
      epochInfo
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
      // Associated token accounts only, as the client verifier requires
      associatedOnly: true,
      withMetadata: 'create',
      // Token-2022 NFT: Raydium's cheaper, modern position-ownership method
      // (~0.0092 SOL vs ~0.0215 SOL for the legacy SPL + Metaplex method).
      nft2022: true,
      txVersion: TxVersion.LEGACY,
      // No compute-budget instructions: the transaction is co-signed, so the wallet must not alter it
      computeBudgetConfig: undefined,
    })

    const positionNftMint = positionTxData.extInfo.address.nftMint.toBase58()

    // The SDK leaves the blockhash unset; it must be set before the NFT-mint keypair signs, and the
    // client must not change it afterwards. The NFT mint is a fresh ephemeral keypair, not a user
    // secret, so the server may sign with it; the client adds only the wallet's signature.
    const positionTx = positionTxData.transaction
    const { blockhash, lastValidBlockHeight } = await legacyConnection.getLatestBlockhash('confirmed')
    positionTx.recentBlockhash = blockhash
    positionTx.lastValidBlockHeight = lastValidBlockHeight
    positionTx.feePayer = walletPublicKey
    if (positionTxData.signers.length > 0) {
      positionTx.partialSign(...positionTxData.signers)
    }

    return {
      serializedTransaction: serializeWithinSizeLimit(positionTx, 'CLMM position'),
      positionNftMint,
      estimatedCosts: {
        positionOpening: POSITION_NFT_COST_SOL + TICK_ARRAY_COST_SOL * MAX_NEW_TICK_ARRAYS,
      },
      message: 'Position-opening transaction prepared successfully',
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    logger.error('Raydium CLMM position preparation failed', error, { poolId })
    throw preparationFailed('CLMM position')
  }
}
