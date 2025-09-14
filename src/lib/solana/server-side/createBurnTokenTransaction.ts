/**
 * Token Burn Utility
 *
 * Professional SPL token burning with comprehensive validation and error handling.
 * Supports both SPL Token (original) and Token Extensions (TOKEN_2022) programs.
 * Follows the established Token Creator architecture pattern with specific error codes.
 */

import 'server-only'

import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createBurnInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { getLogger } from '@/lib/logger/logger'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import getServerConfig from '@/lib/config/getServerConfig'
import { getToolConfigFromCache } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import { formatTokenAmount } from '@/lib/utils/transactionUtils'

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
    context: 'burn-tokens',
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

    // Comprehensive server-side validation using private RPC
    // This prevents users from paying transaction fees for operations that will fail
    // Use getParsedAccountInfo for consistent behavior across client/server (as recommended by Solana docs)

    interface TokenAccountData {
      mint: PublicKey
      owner: PublicKey
      amount: bigint
      delegate: PublicKey | null
      delegatedAmount: bigint
      isInitialized: boolean
      isFrozen: boolean
      isNative: boolean
      closeAuthority: PublicKey | null
    }

    let tokenAccountInfo: TokenAccountData
    let detectedTokenProgram: PublicKey = TOKEN_PROGRAM_ID // Default to regular SPL Token program

    try {
      const accountInfo = await connection.getParsedAccountInfo(tokenAccountPubkey, 'confirmed')

      if (!accountInfo.value) {
        throw new SolanaError(
          'Token account not found. Please verify the token account address.',
          SOLANA_ERROR_CODES.TOKEN_ACCOUNT_NOT_FOUND
        )
      }

      if (!accountInfo.value.data || typeof accountInfo.value.data === 'string') {
        throw new SolanaError(
          'Invalid token account data. Please verify this is a valid SPL token account.',
          SOLANA_ERROR_CODES.TOKEN_NOT_FOUND
        )
      }

      const parsedData = accountInfo.value.data as {
        program: string
        parsed: {
          info: {
            mint: string
            owner: string
            tokenAmount: {
              amount: string
              decimals: number
              uiAmount: number
              uiAmountString: string
            }
            state: string
            isNative?: boolean
            delegate?: string
            delegatedAmount?: {
              amount: string
              decimals: number
              uiAmount: number
              uiAmountString: string
            }
          }
        }
      }

      // Determine token program based on account owner (following Solana wallet integration guide)
      detectedTokenProgram = accountInfo.value.owner

      // Convert parsed data to format compatible with getAccount() return type
      tokenAccountInfo = {
        mint: new PublicKey(parsedData.parsed.info.mint),
        owner: new PublicKey(parsedData.parsed.info.owner),
        amount: BigInt(parsedData.parsed.info.tokenAmount.amount),
        delegate: parsedData.parsed.info.delegate ? new PublicKey(parsedData.parsed.info.delegate) : null,
        delegatedAmount: parsedData.parsed.info.delegatedAmount ? BigInt(parsedData.parsed.info.delegatedAmount.amount) : BigInt(0),
        isInitialized: parsedData.parsed.info.state === 'initialized',
        isFrozen: parsedData.parsed.info.state === 'frozen',
        isNative: parsedData.parsed.info.isNative || false,
        closeAuthority: null, // Not provided in parsed format
      }
    } catch (error) {
      if (error instanceof SolanaError) {
        throw error // Re-throw our specific errors
      }

      logger.warn('Token account validation failed', {
        tokenAccount: tokenAccountPubkey.toString(),
        error: error instanceof Error ? error.message : String(error),
      })

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
        `Insufficient token balance. Available: ${formatTokenAmount(availableAmount, decimals)}, Required: ${formatTokenAmount(amount, decimals)}`,
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

    // Use the detected token program from account validation
    // This ensures we use the correct program (SPL Token vs Token Extensions)
    const tokenProgram = detectedTokenProgram

    // Create burn instruction with the appropriate token program
    let burnInstruction
    try {
      burnInstruction = createBurnInstruction(
        tokenAccountPubkey, // token account
        mintPubkey, // mint
        walletPublicKey, // owner
        rawAmount, // amount to burn
        [], // multiSigners (empty for single-sig)
        tokenProgram // Use detected token program
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
