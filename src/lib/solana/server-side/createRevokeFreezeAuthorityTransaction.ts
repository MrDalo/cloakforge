/**
 * Revoke Freeze Authority Transaction Utility
 *
 * Creates transaction for revoking freeze authority from SPL tokens.
 * Follows the established architecture pattern from createRevokeMintAuthorityTransaction.ts.
 * Supports both Token Program and Token 2022 Program.
 * Uses versioned transactions for efficiency.
 */

import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createSetAuthorityInstruction, AuthorityType, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token'
import { addComputeBudgetInstructions, calculateDynamicPriorityFee, createConnectionPair } from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import 'server-only'

export interface CreateRevokeFreezeAuthorityTransactionParams {
  walletPublicKey: PublicKey
  tokenPublicKey: PublicKey
}

export interface CreateRevokeFreezeAuthorityTransactionResult {
  transaction: Transaction
}

/**
 * Creates a revoke freeze authority transaction for SPL tokens
 * This function constructs the transaction but does not send it
 *
 * @param params - Revoke freeze authority parameters
 * @returns Promise<CreateRevokeFreezeAuthorityTransactionResult>
 */
export async function createRevokeFreezeAuthorityTransaction(
  params: CreateRevokeFreezeAuthorityTransactionParams
): Promise<CreateRevokeFreezeAuthorityTransactionResult> {
  const { walletPublicKey, tokenPublicKey } = params

  // Create connection using server-side private RPC endpoint
  const serverConfig = getServerConfig()

  // Create connection pair for RPC operations
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'revoke-freeze-authority',
    function: 'createRevokeFreezeAuthorityTransaction',
    wallet: walletPublicKey.toString(),
    token: tokenPublicKey.toString(),
    rpcEndpoint: serverConfig.rpcPrivateEndpoint,
  })

  try {
    // First, get account info to determine the program ID
    const accountInfo = await legacyConnection.getAccountInfo(tokenPublicKey, 'confirmed')

    if (!accountInfo) {
      throw new AppError('TOKEN_NOT_FOUND', 'Token not found or invalid token address')
    }

    let tokenProgramId: PublicKey
    if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
      tokenProgramId = TOKEN_PROGRAM_ID
    } else if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      tokenProgramId = TOKEN_2022_PROGRAM_ID
    } else {
      logger.error('Token owned by unknown program', {
        tokenAddress: tokenPublicKey.toString(),
        owner: accountInfo.owner.toString(),
      })
      throw new AppError('INVALID_INPUT', `Token is owned by an unknown program: ${accountInfo.owner.toString()}`)
    }

    // Now fetch the mint info with the correct program ID
    let mintInfo
    try {
      mintInfo = await getMint(legacyConnection, tokenPublicKey, 'confirmed', tokenProgramId)
    } catch (error) {
      logger.error('Failed to get mint info for token', error, {
        tokenAddress: tokenPublicKey.toString(),
        programId: tokenProgramId.toString(),
      })

      // Check for TokenInvalidMintError (indicates address is not a mint)
      if (error instanceof Error && (error.name === 'TokenInvalidMintError' || error.message.includes('Invalid mint'))) {
        throw new AppError(
          'INVALID_INPUT',
          'The provided address is not a valid Token Mint. You may have provided a Token Account address instead.'
        )
      }

      throw new AppError('TOKEN_NOT_FOUND', 'Failed to retrieve mint information')
    }

    // Validate that the wallet is the current freeze authority
    if (!mintInfo.freezeAuthority) {
      throw new AppError('UNAUTHORIZED', 'This token already has its freeze authority revoked. No further action needed.')
    }

    if (!mintInfo.freezeAuthority.equals(walletPublicKey)) {
      throw new AppError(
        'UNAUTHORIZED',
        'You are not the freeze authority for this token. Only the current freeze authority can revoke it.'
      )
    }

    // Calculate service fees
    let totalServiceFeeSOL = 0

    // Get base service fee from tool configuration
    try {
      const toolConfig = await getCachedToolConfig('revoke-freeze-authority')
      if (toolConfig) {
        totalServiceFeeSOL += toolConfig.baseFee
      }
    } catch (error) {
      logger.error('Failed to get tool config for base fee, using fallback', { error: String(error) })
      totalServiceFeeSOL += 0.1 // Default fallback fee
    }

    // Get dynamic priority fee
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch (error) {
      logger.error('Failed to calculate dynamic priority fee, using static fee - freezeAuthority', { error: String(error) })
      dynamicPriorityFee = 1_000
    }

    // Build transaction
    const transaction = new Transaction()

    // Get recent blockhash
    const { blockhash } = await legacyConnection.getLatestBlockhash('confirmed')
    transaction.recentBlockhash = blockhash
    transaction.feePayer = walletPublicKey

    // Add compute budget instructions with dynamic priority fee
    addComputeBudgetInstructions(transaction, 200_000, dynamicPriorityFee)

    // 1. Add service memo instruction (first instruction for visibility)
    transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.AUTHORITY_MANAGEMENT, 'action:revoke_freeze'))

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

    // 3. Revoke freeze authority instruction
    transaction.add(
      createSetAuthorityInstruction(
        tokenPublicKey, // mint
        walletPublicKey, // current authority
        AuthorityType.FreezeAccount, // authority type - KEY DIFFERENCE from mint authority
        null, // new authority (null = revoke)
        [], // multisigners
        tokenProgramId
      )
    )

    // Validate transaction before returning
    if (transaction.instructions.length === 0) {
      throw new AppError('INVALID_INPUT', 'Transaction has no instructions')
    }

    try {
      transaction.serialize({ requireAllSignatures: false })
    } catch (sizeError) {
      logger.error('Transaction size validation failed', sizeError, {
        tokenAddress: tokenPublicKey.toString(),
        instructionCount: transaction.instructions.length,
      })

      throw new AppError('TRANSACTION_FAILED', 'Transaction preparation failed')
    }

    const result: CreateRevokeFreezeAuthorityTransactionResult = {
      transaction,
    }

    return result
  } catch (error: unknown) {
    logger.error('Failed to create revoke freeze authority transaction', error, {
      token: tokenPublicKey.toString(),
      wallet: walletPublicKey.toString(),
    })

    // Handle specific Solana errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient')) {
        throw new AppError('INSUFFICIENT_FUNDS', 'Insufficient funds for authority revocation')
      }
      if (error.message.includes('invalid')) {
        throw new AppError('INVALID_INPUT', 'Invalid revoke authority parameters')
      }
    }

    // Re-throw AppError instances
    if (error instanceof AppError) {
      throw error
    }

    // Generic error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare freeze authority revocation transaction')
  }
}
