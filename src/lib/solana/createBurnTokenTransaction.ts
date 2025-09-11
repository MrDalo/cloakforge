/**
 * Token Burn Utility
 *
 * Professional SPL token burning with comprehensive validation and error handling.
 * Supports both SPL Token (original) and Token Extensions (TOKEN_2022) programs.
 * Follows the established Token Creator architecture pattern with specific error codes.
 */

import 'server-only'

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createBurnInstruction, getAccount, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import { getLogger } from '@/lib/logger/logger'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import getServerConfig from '@/lib/config/getServerConfig'
import { getToolConfigFromCache } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from './serviceMemo'

export interface BurnTokenParams {
  /** Wallet's public key (token account owner) */
  walletPublicKey: PublicKey
  /** Token account address to burn from */
  tokenAccountAddress: string | PublicKey
  /** Amount to burn (in token units, not raw amount) */
  amount: number
  /** Token mint address for validation */
  mintAddress: string | PublicKey
  /** Token decimals for proper calculation */
  decimals: number
}

export interface BurnTokenResult {
  /** The constructed transaction ready to be signed and sent */
  transaction: Transaction
  /** Amount that will be burned (in raw token units) */
  rawAmount: string
  /** Amount that will be burned (in UI token units) */
  uiAmount: number
  /** Token account address being burned from */
  tokenAccount: string
  /** Token mint address */
  mint: string
}

/**
 * Creates a burn transaction for SPL tokens
 * This function constructs the transaction but does not send it
 * Includes comprehensive validation to prevent failed transactions and save user fees
 *
 * @param params - Burn token parameters
 * @returns Promise<BurnTokenResult>
 */
export async function createBurnTokenTransaction(params: BurnTokenParams): Promise<BurnTokenResult> {
  const { walletPublicKey, tokenAccountAddress, amount, mintAddress, decimals } = params

  // Create connection using server-side private RPC endpoint
  const serverConfig = getServerConfig()
  const connection = new Connection(serverConfig.rpcPrivateEndpoint, 'confirmed')

  const logger = getLogger({
    context: 'burn-token',
    function: 'createBurnTokenTransaction',
    wallet: walletPublicKey.toString(),
    tokenAccount: typeof tokenAccountAddress === 'string' ? tokenAccountAddress : tokenAccountAddress.toString(),
    mint: typeof mintAddress === 'string' ? mintAddress : mintAddress.toString(),
    rpcEndpoint: serverConfig.rpcPrivateEndpoint,
  })

  try {
    // Convert addresses to PublicKey if needed
    const tokenAccountPubkey = typeof tokenAccountAddress === 'string' ? new PublicKey(tokenAccountAddress) : tokenAccountAddress
    const mintPubkey = typeof mintAddress === 'string' ? new PublicKey(mintAddress) : mintAddress

    // Basic input validation with specific error codes
    if (amount <= 0) {
      throw new SolanaError('Burn amount must be greater than zero', SOLANA_ERROR_CODES.INVALID_AMOUNT)
    }

    if (decimals < 0 || decimals > 9) {
      throw new SolanaError('Token decimals must be between 0 and 9', SOLANA_ERROR_CODES.INVALID_INPUT)
    }

    // Calculate raw amount (amount * 10^decimals)
    const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)))
    if (rawAmount <= BigInt(0)) {
      throw new SolanaError('Calculated burn amount is too small', SOLANA_ERROR_CODES.AMOUNT_TOO_SMALL)
    }

    // Calculate service fees based on tool configuration
    let totalServiceFeeSOL = 0

    // Get base service fee from tool configuration
    try {
      const toolConfig = await getToolConfigFromCache('burn-tokens')
      if (toolConfig?.baseFee) {
        totalServiceFeeSOL = toolConfig.baseFee
      }
    } catch (error) {
      logger.warn('Failed to get tool config for base fee, using zero', { error: String(error) })
    }

    logger.info('Creating burn token transaction', {
      tokenAccount: tokenAccountPubkey.toString(),
      mint: mintPubkey.toString(),
      amount,
      decimals,
      rawAmount: rawAmount.toString(),
      serviceFeesSOL: totalServiceFeeSOL,
    })

    // Comprehensive server-side validation using private RPC
    // This prevents users from paying transaction fees for operations that will fail
    let tokenAccountInfo
    try {
      tokenAccountInfo = await getAccount(connection, tokenAccountPubkey)
    } catch (error) {
      logger.warn('Token account not found or RPC error', {
        tokenAccount: tokenAccountPubkey.toString(),
        error: error instanceof Error ? error.message : String(error),
      })

      // Enhanced error handling for different scenarios
      if (error instanceof Error && error.message.includes('could not find account')) {
        throw new SolanaError(
          'Token account not found. Please verify the token account address.',
          SOLANA_ERROR_CODES.TOKEN_ACCOUNT_NOT_FOUND
        )
      }

      // Network/RPC errors
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
        throw new SolanaError('Network connection failed. Please check your internet connection.', SOLANA_ERROR_CODES.NETWORK_ERROR)
      }

      throw new SolanaError('Failed to fetch token account information. Please try again.', SOLANA_ERROR_CODES.RPC_ERROR)
    }

    // Validate token account ownership
    if (tokenAccountInfo.owner.toString() !== walletPublicKey.toString()) {
      throw new SolanaError(
        'You do not own this token account. Please check your wallet connection.',
        SOLANA_ERROR_CODES.UNAUTHORIZED_OPERATION
      )
    }

    // Validate token account mint matches expected mint
    if (tokenAccountInfo.mint.toString() !== mintPubkey.toString()) {
      throw new SolanaError('Token account mint does not match the specified token mint.', SOLANA_ERROR_CODES.INVALID_MINT_ADDRESS)
    }

    // Check if token account is frozen
    if (tokenAccountInfo.isFrozen) {
      throw new SolanaError('Token account is frozen and cannot be used for burning.', SOLANA_ERROR_CODES.UNAUTHORIZED_OPERATION)
    }

    // Check sufficient balance to save transaction fees
    if (tokenAccountInfo.amount < rawAmount) {
      const availableAmount = Number(tokenAccountInfo.amount) / Math.pow(10, decimals)
      throw new SolanaError(
        `Insufficient token balance. Available: ${availableAmount}, Required: ${amount}`,
        SOLANA_ERROR_CODES.INSUFFICIENT_TOKEN_BALANCE
      )
    }

    // Check wallet SOL balance for transaction fees and service fees
    let walletBalance: number
    try {
      const balanceLamports = await connection.getBalance(walletPublicKey)
      walletBalance = balanceLamports / 1e9
    } catch (error) {
      logger.warn('Failed to check wallet balance', { error: String(error) })
      throw new SolanaError('Failed to check wallet balance. Please try again.', SOLANA_ERROR_CODES.RPC_ERROR)
    }

    const estimatedCostSOL = 0.0001 + totalServiceFeeSOL // Conservative estimate for burn transaction fees + service fee
    if (walletBalance < estimatedCostSOL) {
      throw new SolanaError(
        `Insufficient SOL balance. Required: ${estimatedCostSOL.toFixed(4)} SOL (including ${totalServiceFeeSOL.toFixed(4)} SOL service fee), Available: ${walletBalance.toFixed(4)} SOL`,
        SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS
      )
    }

    logger.info('All validations passed', {
      owner: tokenAccountInfo.owner.toString(),
      mint: tokenAccountInfo.mint.toString(),
      isFrozen: tokenAccountInfo.isFrozen,
      available: tokenAccountInfo.amount.toString(),
      required: rawAmount.toString(),
      walletBalance: walletBalance.toFixed(4),
    })

    // Determine the correct token program (SPL Token vs Token Extensions)
    let tokenProgram = TOKEN_PROGRAM_ID
    try {
      // For now, we'll use the standard TOKEN_PROGRAM_ID
      // In the future, we could add logic to detect TOKEN_2022_PROGRAM_ID if needed
      const mintInfo = await connection.getAccountInfo(mintPubkey)
      if (mintInfo?.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        tokenProgram = TOKEN_2022_PROGRAM_ID
      }
    } catch (error) {
      logger.warn('Could not determine token program, using standard TOKEN_PROGRAM_ID', {
        error: String(error),
      })
    }

    // Create burn instruction with the appropriate token program
    let burnInstruction
    try {
      burnInstruction = createBurnInstruction(
        tokenAccountPubkey, // token account
        mintPubkey, // mint
        walletPublicKey, // owner
        rawAmount, // amount to burn
        [], // multiSigners (empty for single-sig)
        tokenProgram // token program ID
      )
    } catch (error) {
      logger.error('Failed to create burn instruction', error)
      throw new SolanaError('Failed to create burn instruction. Please try again.', SOLANA_ERROR_CODES.TRANSACTION_FAILED)
    }

    // Create and configure transaction
    const transaction = new Transaction()

    // Get recent blockhash for the transaction
    let recentBlockhash: string
    try {
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      recentBlockhash = blockhash
    } catch (error) {
      logger.error('Failed to get recent blockhash', error)
      throw new SolanaError('Failed to prepare transaction. Please try again.', SOLANA_ERROR_CODES.BLOCKHASH_NOT_FOUND)
    }

    transaction.recentBlockhash = recentBlockhash
    transaction.feePayer = walletPublicKey

    // 1. Add service memo instruction (first instruction for visibility)
    transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.TOKEN_BURNER))

    // 2. Service fee transfer (if applicable)
    if (totalServiceFeeSOL > 0) {
      const serviceFeeWallet = new PublicKey(serverConfig.feeWalletAddress)
      const serviceFeeAmount = Math.floor(totalServiceFeeSOL * LAMPORTS_PER_SOL)

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: serviceFeeWallet,
          lamports: serviceFeeAmount,
        })
      )
    }

    // 3. Add burn instruction
    transaction.add(burnInstruction)

    const result: BurnTokenResult = {
      transaction,
      rawAmount: rawAmount.toString(),
      uiAmount: amount,
      tokenAccount: tokenAccountPubkey.toString(),
      mint: mintPubkey.toString(),
    }

    logger.info('Burn transaction created successfully', {
      rawAmount: rawAmount.toString(),
      uiAmount: amount,
      tokenAccount: tokenAccountPubkey.toString(),
      mint: mintPubkey.toString(),
      tokenProgram: tokenProgram.toString(),
    })

    return result
  } catch (error: unknown) {
    logger.error('Burn transaction creation failed', error, {
      tokenAccount: typeof tokenAccountAddress === 'string' ? tokenAccountAddress : tokenAccountAddress.toString(),
      mint: typeof mintAddress === 'string' ? mintAddress : mintAddress.toString(),
      amount,
      decimals,
    })

    // Re-throw SolanaError instances with specific error codes
    if (error instanceof SolanaError) {
      throw error
    }

    // Handle network/RPC errors
    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('network')) {
        throw new SolanaError('Network connection failed. Please check your internet connection.', SOLANA_ERROR_CODES.NETWORK_ERROR)
      }
      if (error.message.includes('blockhash')) {
        throw new SolanaError('Failed to get blockchain information. Please try again.', SOLANA_ERROR_CODES.BLOCKHASH_NOT_FOUND)
      }
    }

    // Generic fallback error
    throw new SolanaError('Failed to create burn transaction. Please try again.', SOLANA_ERROR_CODES.TRANSACTION_FAILED)
  }
}
