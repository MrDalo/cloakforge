/**
 * Solana Balance Utilities
 *
 * Functions for checking balances, fetching prices, and converting between units.
 */

import { createSolanaRpc, address, type Address, lamports } from '@solana/kit'
import { type Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import axios from 'axios'
import { getLogger } from '../logger/logger'
import getConfig from '@/lib/config/getConfig'
import { AppError } from '@/lib/errors'

/**
 * Get current Solana price from server-side API route
 * Avoids CORS issues by using our own API endpoint
 *
 * @returns Current SOL price in USD
 */
export const getSolanaPrice = async (): Promise<number> => {
  const logger = getLogger({
    context: 'solana-balance',
    function: 'getSolanaPrice',
  })

  try {
    const response = await axios.get('/api/solana/price', {
      timeout: 10000,
    })

    if (response.data.status === 'success' && response.data.data?.price !== undefined) {
      return response.data.data.price || 0
    } else if (response.data.status === 'error') {
      logger.error('API returned error:', response.data.error_message, {
        errorCode: response.data.error_code,
      })
      return 0
    } else {
      logger.warn('Unexpected API response format:', response.data)
      return response.data.price || 0
    }
  } catch (error) {
    logger.error('Failed to fetch Solana price:', error)
    return 0
  }
}

/**
 * Get wallet balance using modern Kit RPC
 *
 * @param walletAddress - Wallet address (Kit Address or string)
 * @returns Balance in SOL
 */
export const getWalletBalance = async (walletAddress: Address | string): Promise<number> => {
  const { rpcPublicEndpoint } = getConfig()
  const rpc = createSolanaRpc(rpcPublicEndpoint)

  const logger = getLogger({
    context: 'solana-balance',
    function: 'getWalletBalance',
  })

  try {
    const kitAddress = typeof walletAddress === 'string' ? address(walletAddress) : walletAddress
    const balance = await rpc.getBalance(kitAddress).send()
    return Number(balance) / LAMPORTS_PER_SOL
  } catch (error) {
    logger.error('Failed to fetch wallet balance:', error)
    return 0
  }
}

/**
 * Convert lamports to SOL
 *
 * @param lamportsAmount - Amount in lamports (number or bigint)
 * @returns Amount in SOL
 */
export const lamportsToSol = (lamportsAmount: number | bigint): number => Number(lamportsAmount) / LAMPORTS_PER_SOL

/**
 * Convert SOL to lamports using Kit's lamports helper
 *
 * @param sol - Amount in SOL
 * @returns Amount in lamports as bigint
 */
export const solToLamports = (sol: number): bigint => lamports(BigInt(Math.floor(sol * LAMPORTS_PER_SOL)))

/**
 * Validate wallet has sufficient balance for operation
 * Reusable across all tools
 *
 * @param walletAddress - Wallet address to check
 * @param requiredAmount - Required amount in lamports
 * @param kitRpc - Kit RPC instance
 * @param legacyConnection - Legacy connection (fallback)
 * @param logger - Logger instance
 * @returns Balance validation result
 */
export const validateWalletBalance = async (
  walletAddress: Address | string,
  requiredAmount: number,
  kitRpc: ReturnType<typeof createSolanaRpc>,
  legacyConnection: Connection,
  logger: ReturnType<typeof getLogger>
): Promise<{ hasEnoughBalance: boolean; balance: number; balanceSOL: number }> => {
  const kitWalletAddress = address(typeof walletAddress === 'string' ? walletAddress : walletAddress)

  try {
    // Try Kit RPC first, fallback to legacy connection
    let balance: bigint
    try {
      const balanceResponse = await kitRpc.getBalance(kitWalletAddress).send()
      balance = balanceResponse.value
    } catch (kitError) {
      logger.warn('Kit RPC balance check failed, using legacy connection fallback', {
        error: kitError instanceof Error ? kitError.message : String(kitError),
      })
      const legacyPubkey = new PublicKey(typeof walletAddress === 'string' ? walletAddress : walletAddress)
      const legacyBalance = await legacyConnection.getBalance(legacyPubkey)
      balance = BigInt(legacyBalance)
    }

    const balanceSOL = Number(balance) / LAMPORTS_PER_SOL
    const hasEnoughBalance = Number(balance) >= requiredAmount

    if (!hasEnoughBalance) {
      const shortfall = requiredAmount - Number(balance)
      logger.warn('Insufficient wallet balance', {
        shortfallSOL: (shortfall / LAMPORTS_PER_SOL).toFixed(6),
      })
    }

    return {
      hasEnoughBalance,
      balance: Number(balance),
      balanceSOL,
    }
  } catch (error) {
    logger.error('Failed to check wallet balance', error)
    throw new AppError('RPC_CONNECTION_FAILED', 'Failed to check wallet balance')
  }
}
