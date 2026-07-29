/**
 * Update Token Metadata Transaction Utility
 *
 * Updates the on-chain name/symbol/URI of a Token-2022 mint using the SPL Token-2022
 * metadata-pointer extension (metadata stored directly inside the mint account).
 * Unlike classic Metaplex mpl-token-metadata, each field (Name / Symbol / Uri) is updated
 * independently via its own UpdateTokenMetadataField instruction — only changed fields are
 * emitted, so there is no risk of clobbering fields that were not touched.
 * Follows the established architecture pattern from createTokenCreationTransaction.ts.
 */

import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_2022_PROGRAM_ID, getTokenMetadata as getOnChainTokenMetadata } from '@solana/spl-token'
import { address, createNoopSigner } from '@solana/kit'
import { getUpdateTokenMetadataFieldInstruction } from '@solana-program/token-2022'
import {
  addComputeBudgetInstructions,
  calculateDynamicPriorityFee,
  createConnectionPair,
  kitInstructionToWeb3Instruction,
} from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import { applyCouponToServiceFee } from './discountedServiceFee'
import 'server-only'

export interface CreateUpdateMetadataTransactionParams {
  walletPublicKey: PublicKey
  tokenPublicKey: PublicKey
  tokenData: {
    name?: string
    symbol?: string
  }
  /** New off-chain metadata JSON URI (only present when description/socials/logo changed and were re-uploaded to IPFS) */
  metadataUri?: string
  /** Optional discount coupon code to apply to the service fee */
  couponCode?: string
}

export interface CreateUpdateMetadataTransactionResult {
  transaction: Transaction
}

/**
 * Creates a transaction that updates a Token-2022 token's on-chain metadata fields
 * (name/symbol/uri) via the metadata-pointer extension. This function constructs the
 * transaction but does not send it.
 *
 * @param params - Update metadata parameters
 * @returns Promise<CreateUpdateMetadataTransactionResult>
 */
export async function createUpdateMetadataTransaction(
  params: CreateUpdateMetadataTransactionParams
): Promise<CreateUpdateMetadataTransactionResult> {
  const { walletPublicKey, tokenPublicKey, tokenData, metadataUri, couponCode } = params

  // Create connection using server-side private RPC endpoint
  const serverConfig = getServerConfig()

  // Create connection pair for RPC operations
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'update-metadata',
    function: 'createUpdateMetadataTransaction',
    wallet: walletPublicKey.toString(),
    token: tokenPublicKey.toString(),
    rpcEndpoint: serverConfig.rpcPrivateEndpoint,
  })

  try {
    // First, get account info to confirm this is a Token-2022 mint
    const accountInfo = await legacyConnection.getAccountInfo(tokenPublicKey, 'confirmed')

    if (!accountInfo) {
      throw new AppError('TOKEN_NOT_FOUND', 'Token not found or invalid token address')
    }

    if (!accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      throw new AppError('INVALID_INPUT', 'This tool only supports Token-2022 tokens with on-chain metadata.')
    }

    // Fetch current on-chain metadata via the official spl-token helper
    const currentMetadata = await getOnChainTokenMetadata(legacyConnection, tokenPublicKey, 'confirmed', TOKEN_2022_PROGRAM_ID)

    if (!currentMetadata) {
      throw new AppError('INVALID_INPUT', 'This token has no on-chain metadata to update.')
    }

    if (!currentMetadata.updateAuthority) {
      throw new AppError('UNAUTHORIZED', "This token's metadata is immutable — its update authority has already been revoked.")
    }

    if (!currentMetadata.updateAuthority.equals(walletPublicKey)) {
      throw new AppError('UNAUTHORIZED', 'You are not the metadata update authority for this token.')
    }

    // Diff requested fields against the current on-chain values — only changed fields get an instruction
    const fieldUpdates: { field: { __kind: 'Name' } | { __kind: 'Symbol' } | { __kind: 'Uri' }; value: string }[] = []

    if (tokenData.name !== undefined && tokenData.name !== currentMetadata.name) {
      fieldUpdates.push({ field: { __kind: 'Name' }, value: tokenData.name })
    }
    if (tokenData.symbol !== undefined && tokenData.symbol !== currentMetadata.symbol) {
      fieldUpdates.push({ field: { __kind: 'Symbol' }, value: tokenData.symbol })
    }
    if (metadataUri !== undefined && metadataUri !== currentMetadata.uri) {
      fieldUpdates.push({ field: { __kind: 'Uri' }, value: metadataUri })
    }

    if (fieldUpdates.length === 0) {
      throw new AppError('INVALID_INPUT', 'No metadata changes detected.')
    }

    // Calculate service fees
    let totalServiceFeeSOL = 0

    // Get base service fee from tool configuration
    try {
      const toolConfig = await getCachedToolConfig('update-metadata')
      if (toolConfig) {
        totalServiceFeeSOL += toolConfig.baseFee
      }
    } catch (error) {
      logger.error('Failed to get tool config for base fee, using fallback', { error: String(error) })
      totalServiceFeeSOL += 0.05 // Default fallback fee
    }

    // Apply discount coupon to the service fee (validates the coupon server-side)
    const { feeSOL: discountedServiceFeeSOL, couponMemoInstruction } = await applyCouponToServiceFee(totalServiceFeeSOL, couponCode)
    totalServiceFeeSOL = discountedServiceFeeSOL

    // Get dynamic priority fee
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch (error) {
      logger.warn('Failed to calculate dynamic priority fee, using static fee - updateMetadata', undefined, { error: String(error) })
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
    transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.METADATA_MANAGEMENT, 'action:update_metadata'))

    // Coupon memo so the redeem endpoint can verify the coupon was used in this transaction
    if (couponMemoInstruction) {
      transaction.add(couponMemoInstruction)
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

    // 3. Field update instructions — kit-native builder, one per changed field. NoopSigner marks
    // the wallet as the required update-authority signer even though real signing happens client-side.
    for (const { field, value } of fieldUpdates) {
      transaction.add(
        kitInstructionToWeb3Instruction(
          getUpdateTokenMetadataFieldInstruction(
            {
              metadata: address(tokenPublicKey.toString()),
              updateAuthority: createNoopSigner(address(walletPublicKey.toString())),
              field,
              value,
            },
            { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
          )
        )
      )
    }

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
        fieldsUpdated: fieldUpdates.length,
      })

      throw new AppError('TRANSACTION_FAILED', 'Transaction preparation failed')
    }

    const result: CreateUpdateMetadataTransactionResult = {
      transaction,
    }

    return result
  } catch (error: unknown) {
    logger.error('Failed to create update metadata transaction', error, {
      token: tokenPublicKey.toString(),
      wallet: walletPublicKey.toString(),
    })

    // Handle specific Solana errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient')) {
        throw new AppError('INSUFFICIENT_FUNDS', 'Insufficient funds for metadata update')
      }
      if (error.message.includes('invalid')) {
        throw new AppError('INVALID_INPUT', 'Invalid metadata update parameters')
      }
    }

    // Re-throw AppError instances
    if (error instanceof AppError) {
      throw error
    }

    // Generic error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare metadata update transaction')
  }
}
