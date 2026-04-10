import 'server-only'

import { PublicKey, type Connection } from '@solana/web3.js'
import { getMint, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import BN from 'bn.js'
import Decimal from 'decimal.js'
import { Raydium, TxVersion, API_URLS, type ApiCpmmConfigInfo, type ClmmConfigInfo } from '@raydium-io/raydium-sdk-v2'
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

/**
 * Estimated creation cost in SOL for each pool type.
 * CPMM pools require ~0.19 SOL for rent; CLMM pools require ~0.06 SOL.
 */
const POOL_CREATION_COSTS: Record<string, number> = {
  CPMM: 0.19,
  CLMM: 0.06,
}

const PLATFORM_FEE_SOL = 0.01
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
 * Returns the config matching the requested fee tier, or the first available.
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
  return matched ?? data.data[0]
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

  logger.info('Creating Raydium pool transaction', {
    walletAddress: walletPublicKey.toString(),
    poolType: poolConfig.poolType,
    tokenPair: `${poolConfig.tokenA}/${poolConfig.tokenB}`,
  })

  // Establish connection using private RPC endpoint (never expose to client)
  const { legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  let serializedTransaction: string
  let poolPublicKey: string
  const poolType = poolConfig.poolType

  try {
    // Fetch actual token decimals and program IDs from on-chain mint accounts
    logger.info('Fetching token decimals from on-chain mint accounts')
    const [mintInfoA, mintInfoB] = await Promise.all([
      fetchMintDecimals(legacyConnection, poolConfig.tokenA),
      fetchMintDecimals(legacyConnection, poolConfig.tokenB),
    ])
    logger.info('Token decimals resolved', {
      decimalsA: mintInfoA.decimals,
      programIdA: mintInfoA.programId.toString(),
      decimalsB: mintInfoB.decimals,
      programIdB: mintInfoB.programId.toString(),
    })

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
      if (!poolConfig.priceRange?.minPrice) {
        throw new AppError('INVALID_INPUT', 'CLMM pool requires priceRange.minPrice')
      }
      const initialPrice = new Decimal(poolConfig.priceRange.minPrice)

      // Fetch amm config from Raydium API (matched to the requested fee tier)
      const ammConfig = await fetchClmmConfig(poolConfig.feeTier)

      const txData = await raydium.clmm.createPool({
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

      const tx = txData.transaction
      serializedTransaction = Buffer.from(tx.serialize({ requireAllSignatures: false })).toString('base64')
      poolPublicKey = (txData.extInfo?.address as { poolId?: PublicKey })?.poolId?.toString() ?? 'pending'
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

  logger.info('Pool transaction created successfully', { poolType, poolPublicKey, estimatedCosts })

  return {
    serializedTransaction,
    poolPublicKey,
    estimatedCosts,
    message: `${poolType} pool transaction prepared successfully`,
  }
}
