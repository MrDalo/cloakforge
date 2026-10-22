/**
 * Revoke Metadata Authority Transaction Utility
 *
 * Creates transaction for revoking the on-chain metadata update authority of a
 * Token-2022 token (SPL Token-2022 metadata-pointer extension — metadata stored
 * directly in the mint account, NOT classic Metaplex mpl-token-metadata).
 * Follows the established architecture pattern from createRevokeMintAuthorityTransaction.ts.
 */

import 'server-only'

import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_2022_PROGRAM_ID, getTokenMetadata as getOnChainTokenMetadata } from '@solana/spl-token'
import { address, createNoopSigner } from '@solana/kit'
import { getUpdateTokenMetadataUpdateAuthorityInstruction } from '@solana-program/token-2022'
import {
  addComputeBudgetInstructions,
  calculateDynamicPriorityFee,
  createConnectionPair,
  kitInstructionToWeb3Instruction,
} from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import { applyCouponToServiceFee } from './discountedServiceFee'
import { resolveToolBaseFee } from './defaultToolFees'

export interface CreateRevokeMetadataAuthorityTransactionParams {
  walletPublicKey: PublicKey
  tokenPublicKey: PublicKey
  /** Optional discount coupon code to apply to the service fee */
  couponCode?: string
}

export interface CreateRevokeMetadataAuthorityTransactionResult {
  transaction: Transaction
}

/**
 * Creates a revoke metadata authority transaction for Token-2022 tokens
 * This function constructs the transaction but does not send it
 *
 * @param params - Revoke metadata authority parameters
 * @returns Promise<CreateRevokeMetadataAuthorityTransactionResult>
 */
export async function createRevokeMetadataAuthorityTransaction(
  params: CreateRevokeMetadataAuthorityTransactionParams
): Promise<CreateRevokeMetadataAuthorityTransactionResult> {
  const { walletPublicKey, tokenPublicKey, couponCode } = params

  // Create connection using server-side private RPC endpoint
  const serverConfig = getServerConfig()

  // Create connection pair for RPC operations
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'revoke-metadata-authority',
    function: 'createRevokeMetadataAuthorityTransaction',
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

    if (!accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      throw new AppError(
        'INVALID_INPUT',
        'This tool only supports Token-2022 tokens with on-chain metadata. Legacy SPL tokens do not have a revocable on-chain metadata authority.'
      )
    }

    // Fetch on-chain metadata (metadata-pointer extension) using the official spl-token helper
    let metadata
    try {
      metadata = await getOnChainTokenMetadata(legacyConnection, tokenPublicKey, 'confirmed', TOKEN_2022_PROGRAM_ID)
    } catch (error) {
      logger.error('Failed to get on-chain metadata for token', error, {
        tokenAddress: tokenPublicKey.toString(),
      })
      throw new AppError('TOKEN_NOT_FOUND', 'Failed to retrieve token metadata')
    }

    if (!metadata || !metadata.updateAuthority) {
      throw new AppError('UNAUTHORIZED', 'This token has no update authority — its metadata is already immutable.')
    }

    if (!metadata.updateAuthority.equals(walletPublicKey)) {
      throw new AppError(
        'UNAUTHORIZED',
        'You are not the metadata update authority for this token. Only the current update authority can revoke it.'
      )
    }

    // Calculate service fees
    // Base service fee from tool configuration (hard-coded minimum if config is unavailable)
    let totalServiceFeeSOL = await resolveToolBaseFee('revoke-metadata-authority')

    // Apply discount coupon to the service fee (checks availability server-side; nothing is consumed
    // until the transaction confirms on-chain with the coupon memo)
    const { feeSOL: discountedServiceFeeSOL, couponInstructions } = await applyCouponToServiceFee(
      totalServiceFeeSOL,
      couponCode,
      walletPublicKey
    )
    totalServiceFeeSOL = discountedServiceFeeSOL

    // Get dynamic priority fee
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch (error) {
      logger.warn('Failed to calculate dynamic priority fee, using static fee - revokeMetadataAuthority', undefined, {
        error: String(error),
      })
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
    transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.METADATA_MANAGEMENT, 'action:revoke_metadata'))

    // Coupon memo + 0-lamport marker transfer: the use is counted once this transaction confirms
    if (couponInstructions.length > 0) {
      transaction.add(...couponInstructions)
    }

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

    // 3. Revoke metadata update authority instruction (kit-native builder, converted to a legacy
    // TransactionInstruction — see kitInstructionToWeb3Instruction). NoopSigner marks the wallet
    // as a required signer. The metadata address is the mint itself (metadata-pointer extension).
    transaction.add(
      kitInstructionToWeb3Instruction(
        getUpdateTokenMetadataUpdateAuthorityInstruction(
          {
            metadata: address(tokenPublicKey.toString()), // metadata address is the mint itself
            updateAuthority: createNoopSigner(address(walletPublicKey.toString())),
            newUpdateAuthority: null, // revoke — makes metadata immutable
          },
          { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
        )
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

    const result: CreateRevokeMetadataAuthorityTransactionResult = {
      transaction,
    }

    return result
  } catch (error: unknown) {
    logger.error('Failed to create revoke metadata authority transaction', error, {
      token: tokenPublicKey.toString(),
      wallet: walletPublicKey.toString(),
    })

    // Re-throw AppError instances first, so their messages (e.g. coupon errors) are not remapped below
    if (error instanceof AppError) {
      throw error
    }

    // Handle specific Solana errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient')) {
        throw new AppError('INSUFFICIENT_FUNDS', 'Insufficient funds for metadata authority revocation')
      }
      if (error.message.includes('invalid')) {
        throw new AppError('INVALID_INPUT', 'Invalid revoke metadata authority parameters')
      }
    }

    // Generic error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare metadata authority revocation transaction')
  }
}
