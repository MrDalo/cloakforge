/**
 * Token Burn Utility
 *
 * Streamlined utility for burning SPL tokens with essential validation.
 * Supports both SPL Token (original) and Token Extensions (TOKEN_2022) programs.
 */

import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { createBurnInstruction, getAccount } from '@solana/spl-token'
import { getLogger } from '@/lib/logger/logger'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import getServerConfig from '@/lib/config/getServerConfig'
import 'server-only'

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
 *
 * @param params - Burn token parameters
 * @returns Promise<BurnTokenResult>
 */
export async function createBurnTokenTransaction(params: BurnTokenParams): Promise<BurnTokenResult> {
  const { walletPublicKey, tokenAccountAddress, amount, mintAddress, decimals } = params

  // Create connection using server-side private RPC endpoint
  const serverConfig = getServerConfig()
  const connection = new Connection(serverConfig.rpcPrivateEndpoint)

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

    // Basic input validation
    if (amount <= 0) {
      throw new SolanaError('Burn amount must be greater than zero', SOLANA_ERROR_CODES.INVALID_AMOUNT)
    }

    // Calculate raw amount (amount * 10^decimals)
    const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)))
    if (rawAmount <= BigInt(0)) {
      throw new SolanaError('Calculated burn amount is too small', SOLANA_ERROR_CODES.AMOUNT_TOO_SMALL)
    }

    logger.info('Creating burn token transaction', {
      tokenAccount: tokenAccountPubkey.toString(),
      mint: mintPubkey.toString(),
      amount,
      decimals,
      rawAmount: rawAmount.toString(),
    })

    // Comprehensive validation - saves users from paying fees for failed transactions
    // Since failed transactions still charge fees (~5000 lamports), this is cost-effective
    try {
      const tokenAccount = await getAccount(connection, tokenAccountPubkey)

      // Validate token account ownership
      if (tokenAccount.owner.toString() !== walletPublicKey.toString()) {
        throw new SolanaError(
          'You do not own this token account. Please check your wallet connection.',
          SOLANA_ERROR_CODES.UNAUTHORIZED_OPERATION
        )
      }

      // Validate token account mint matches expected mint
      if (tokenAccount.mint.toString() !== mintPubkey.toString()) {
        throw new SolanaError('Token account mint does not match the specified token mint.', SOLANA_ERROR_CODES.INVALID_MINT_ADDRESS)
      }

      // Check if token account is frozen
      if (tokenAccount.isFrozen) {
        throw new SolanaError('Token account is frozen and cannot be used for burning.', SOLANA_ERROR_CODES.UNAUTHORIZED_OPERATION)
      }

      // Check sufficient balance to save transaction fees
      if (tokenAccount.amount < rawAmount) {
        throw new SolanaError(
          `Insufficient token balance. Available: ${Number(tokenAccount.amount) / Math.pow(10, decimals)}, Required: ${amount}`,
          SOLANA_ERROR_CODES.INSUFFICIENT_TOKEN_BALANCE
        )
      }

      logger.info('All validations passed', {
        owner: tokenAccount.owner.toString(),
        mint: tokenAccount.mint.toString(),
        isFrozen: tokenAccount.isFrozen,
        available: tokenAccount.amount.toString(),
        required: rawAmount.toString(),
      })
    } catch (error) {
      if (error instanceof SolanaError) {
        throw error // Re-throw our validation errors
      }

      // If we can't fetch the account, it likely doesn't exist
      logger.warn('Token account not found or RPC error', {
        tokenAccount: tokenAccountPubkey.toString(),
        error: error instanceof Error ? error.message : String(error),
      })

      throw new SolanaError(
        'Token account not found or invalid. Please verify the token account address.',
        SOLANA_ERROR_CODES.TOKEN_ACCOUNT_NOT_FOUND
      )
    }

    // Create burn instruction
    const burnInstruction = createBurnInstruction(
      tokenAccountPubkey, // token account
      mintPubkey, // mint
      walletPublicKey, // owner
      rawAmount // amount to burn
    )

    // Create transaction
    const transaction = new Transaction().add(burnInstruction)

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
    })

    return result
  } catch (error: unknown) {
    if (error instanceof SolanaError) {
      throw error
    }

    const enhancedError = new SolanaError('Failed to create burn transaction', SOLANA_ERROR_CODES.TRANSACTION_FAILED)

    logger.error('Burn transaction creation failed', enhancedError, {
      tokenAccount: typeof tokenAccountAddress === 'string' ? tokenAccountAddress : tokenAccountAddress.toString(),
      mint: typeof mintAddress === 'string' ? mintAddress : mintAddress.toString(),
      amount,
      decimals,
      originalError: error instanceof Error ? error.message : String(error),
    })

    throw enhancedError
  }
}
