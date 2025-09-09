/**
 * Token Creation Utility
 *
 * Professional SPL Token 2022 creation with embedded metadata using Token Extensions.
 * Follows the established architecture pattern from createTokenWithSolanaKit.ts.
 * Uses SPL Token Extensions (TOKEN_2022) for advanced metadata capabilities.
 * Uses versioned transactions to handle transaction size limits efficiently.
 */

import { Keypair, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
  getMintLen,
  ExtensionType,
  createSetAuthorityInstruction,
  AuthorityType,
  createInitializeMetadataPointerInstruction,
} from '@solana/spl-token'
// Legacy imports for Token 2022 (following createTokenWithSolanaKit.ts pattern)
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  createUpdateAuthorityInstruction,
  TokenMetadata,
} from '@solana/spl-token-metadata'
import { addComputeBudgetInstructions, calculateDynamicPriorityFee, createConnectionPair } from '@/lib/solana/utils'
import { getLogger } from '@/lib/logger/logger'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import getServerConfig from '@/lib/config/getServerConfig'
import { toolFeeConfigs } from '@/lib/utils/feeConfigs'
import { getToolConfigFromCache } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from './serviceMemo'
import type { CreateTokenTransactionParams, CreateTokenTransactionResult } from '@/types/tokenCreator'
import 'server-only'

/**
 * Creates a token creation transaction for SPL tokens
 * This function constructs the transaction but does not send it
 *
 * @param params - Token creation parameters
 * @returns Promise<CreateTokenTransactionResult>
 */
export async function createTokenCreationTransaction(params: CreateTokenTransactionParams): Promise<CreateTokenTransactionResult> {
  const { walletPublicKey, tokenData, metadataUri } = params

  // Create connection using server-side private RPC endpoint
  const serverConfig = getServerConfig()

  // Create connection pair for RPC operations (following createTokenWithSolanaKit pattern)
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'create-token',
    function: 'createTokenCreationTransaction',
    wallet: walletPublicKey.toString(),
    rpcEndpoint: serverConfig.rpcPrivateEndpoint,
  })

  try {
    // Input validation
    if (!tokenData.name || tokenData.name.length === 0) {
      throw new SolanaError('Token name is required', SOLANA_ERROR_CODES.INVALID_INPUT)
    }
    if (!tokenData.symbol || tokenData.symbol.length === 0) {
      throw new SolanaError('Token symbol is required', SOLANA_ERROR_CODES.INVALID_INPUT)
    }
    if (tokenData.decimals < 0 || tokenData.decimals > 9) {
      throw new SolanaError('Token decimals must be between 0 and 9', SOLANA_ERROR_CODES.INVALID_INPUT)
    }
    if (tokenData.totalSupply <= 0) {
      throw new SolanaError('Token supply must be greater than 0', SOLANA_ERROR_CODES.INVALID_INPUT)
    }

    // Generate new mint keypair
    const mintKeypair = Keypair.generate()
    const mintPublicKey = mintKeypair.publicKey

    logger.info('Creating token creation transaction', {
      mintAddress: mintPublicKey.toString(),
      tokenName: tokenData.name,
      tokenSymbol: tokenData.symbol,
      decimals: tokenData.decimals,
      supply: tokenData.totalSupply,
      metadataUri: metadataUri || 'none',
      hasWebsite: !!tokenData.website,
      hasTwitter: !!tokenData.twitter,
      hasTelegram: !!tokenData.telegram,
      hasDiscord: !!tokenData.discord,
      revokeMintAuthority: tokenData.revokeMintAuthority,
      revokeFreezeAuthority: tokenData.revokeFreezeAuthority,
      immutable: tokenData.immutable,
    })

    // Calculate service fees based on selected options
    let totalServiceFeeSOL = 0

    // Get base service fee from tool configuration
    try {
      const toolConfig = await getToolConfigFromCache('token-creator')
      if (toolConfig) {
        totalServiceFeeSOL += toolConfig.baseFee
        logger.info('Base service fee applied from tool config', { baseFee: toolConfig.baseFee })
      }
    } catch (error) {
      logger.warn('Failed to get tool config for base fee, using zero', { error: String(error) })
    }

    const toolFees = toolFeeConfigs['token-creator']()

    // Apply service fees for authority revocations
    for (const feeConfig of toolFees) {
      if (feeConfig.fieldName === 'revokeMintAuthority' && tokenData.revokeMintAuthority) {
        totalServiceFeeSOL += feeConfig.fee
        logger.info('Service fee applied: revokeMintAuthority', { fee: feeConfig.fee })
      }
      if (feeConfig.fieldName === 'revokeFreezeAuthority' && tokenData.revokeFreezeAuthority) {
        totalServiceFeeSOL += feeConfig.fee
        logger.info('Service fee applied: revokeFreezeAuthority', { fee: feeConfig.fee })
      }
    }

    // Get dynamic priority fee using modern Kit RPC with automatic fallback (following createTokenWithSolanaKit pattern)
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
      logger.info('Dynamic priority fee calculated successfully', { dynamicPriorityFee })
    } catch (priorityFeeError) {
      // Fallback to static priority fee if dynamic calculation fails
      logger.warn('Dynamic priority fee calculation failed, using static fallback', {
        error: priorityFeeError instanceof Error ? priorityFeeError.message : String(priorityFeeError),
        fallbackFee: 1_000,
        reason: 'RPC_priority_fee_call_failed',
      })
      dynamicPriorityFee = 1_000 // 1000 microlamports fallback
    }

    // Calculate raw supply amount
    const rawSupply = BigInt(Math.floor(tokenData.totalSupply * Math.pow(10, tokenData.decimals)))

    // Get associated token account address (use TOKEN_2022_PROGRAM_ID)
    const associatedTokenAccountAddress = await getAssociatedTokenAddress(mintPublicKey, walletPublicKey, false, TOKEN_2022_PROGRAM_ID)

    // Create optimized metadata object for Token Extensions
    // OPTIMIZATION: Reduce on-chain metadata to essential fields only to avoid transaction size limits
    // Social media links are already in the off-chain metadata JSON at metadataUri
    let metadata: TokenMetadata | undefined
    if (metadataUri || tokenData.name || tokenData.symbol) {
      // Only include essential additional metadata to stay within transaction size limits
      const additionalMetadata: [string, string][] = []

      metadata = {
        mint: mintPublicKey,
        name: tokenData.name,
        symbol: tokenData.symbol,
        uri: metadataUri || '',
        additionalMetadata, // Keep empty to minimize on-chain data
      }

      logger.info('Optimized metadata created for transaction size limits', {
        onChainMetadataFields: additionalMetadata.length,
        offChainMetadataUri: metadataUri,
        descriptionInOffChain: !!tokenData.description,
        socialLinksInOffChain: !!(tokenData.website || tokenData.twitter || tokenData.telegram || tokenData.discord),
        optimization: 'description_moved_to_ipfs_for_size_reduction',
      })
    }

    // Calculate required space for mint account with extensions
    const extensions = [ExtensionType.MetadataPointer]
    const mintLen = getMintLen(extensions)

    // Build transaction
    const transaction = new Transaction()

    // Get recent blockhash using legacy connection
    const { blockhash } = await legacyConnection.getLatestBlockhash('confirmed')
    transaction.recentBlockhash = blockhash
    transaction.feePayer = walletPublicKey

    // Get minimum balance for rent exemption (base space only)
    const lamportsForRent = await legacyConnection.getMinimumBalanceForRentExemption(mintLen)

    // Add compute budget instructions with dynamic priority fee
    addComputeBudgetInstructions(transaction, 500_000, dynamicPriorityFee)

    // 1. Add service memo instruction (first instruction for visibility)
    transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.TOKEN_CREATOR))

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

      logger.info('Service fee transfer instruction added', {
        amount: totalServiceFeeSOL,
        feeWallet: serviceFeeWallet.toString(),
      })
    }

    // 3. Create mint account with proper space for extensions
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: walletPublicKey,
        newAccountPubkey: mintPublicKey,
        lamports: lamportsForRent,
        space: mintLen,
        programId: TOKEN_2022_PROGRAM_ID,
      })
    )

    // 4. Initialize MetadataPointer extension (pointing to the mint itself)
    if (metadata) {
      transaction.add(
        createInitializeMetadataPointerInstruction(
          mintPublicKey, // mint
          walletPublicKey, // authority
          mintPublicKey, // metadata address (point to self)
          TOKEN_2022_PROGRAM_ID
        )
      )
    }

    // 5. Initialize mint with authority settings
    // IMPORTANT: Always initialize with authorities set, then revoke them later if requested
    // Setting authorities to null during initialization creates invalid instruction sequences
    transaction.add(
      createInitializeMintInstruction(
        mintPublicKey,
        tokenData.decimals,
        walletPublicKey, // mint authority (will be revoked later if requested)
        walletPublicKey, // freeze authority (will be revoked later if requested)
        TOKEN_2022_PROGRAM_ID
      )
    )

    // 6. Initialize metadata inside the mint (if metadata exists)
    if (metadata) {
      // Calculate additional rent needed for TokenMetadata extension
      const estimatedMetadataSize =
        200 + // base metadata size
        metadata.name.length +
        metadata.symbol.length +
        metadata.uri.length +
        metadata.additionalMetadata.reduce((sum, [key, value]) => sum + key.length + value.length + 20, 0) +
        500 // buffer

      const totalExpectedLen = mintLen + estimatedMetadataSize
      const additionalRentLamports = await legacyConnection.getMinimumBalanceForRentExemption(totalExpectedLen)
      const currentRentLamports = await legacyConnection.getMinimumBalanceForRentExemption(mintLen)
      const rentDifference = additionalRentLamports - currentRentLamports

      // Transfer additional rent to mint account if needed for metadata reallocation
      if (rentDifference > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: mintPublicKey,
            lamports: rentDifference,
          })
        )

        logger.info('Additional rent transfer for metadata reallocation', {
          additionalRent: rentDifference / LAMPORTS_PER_SOL,
        })
      }

      // Initialize metadata inside the mint
      transaction.add(
        createInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          mint: mintPublicKey,
          metadata: mintPublicKey, // metadata address is the mint itself
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
          mintAuthority: walletPublicKey,
          updateAuthority: walletPublicKey,
        })
      )

      // Add additional metadata fields
      for (const [key, value] of metadata.additionalMetadata) {
        transaction.add(
          createUpdateFieldInstruction({
            programId: TOKEN_2022_PROGRAM_ID,
            metadata: mintPublicKey,
            updateAuthority: walletPublicKey,
            field: key,
            value,
          })
        )
      }
    }

    // 7. Create associated token account
    transaction.add(
      createAssociatedTokenAccountInstruction(
        walletPublicKey, // payer
        associatedTokenAccountAddress, // ata
        walletPublicKey, // owner
        mintPublicKey, // mint
        TOKEN_2022_PROGRAM_ID
      )
    )

    // 8. Mint initial supply to associated token account
    if (rawSupply > BigInt(0)) {
      transaction.add(
        createMintToInstruction(
          mintPublicKey, // mint
          associatedTokenAccountAddress, // destination
          walletPublicKey, // authority
          rawSupply, // amount
          [], // multisigners
          TOKEN_2022_PROGRAM_ID
        )
      )
    }

    // 9. Handle authority revocations based on form data
    if (tokenData.revokeMintAuthority) {
      transaction.add(
        createSetAuthorityInstruction(
          mintPublicKey, // mint
          walletPublicKey, // current authority
          AuthorityType.MintTokens, // authority type
          null, // new authority (null = revoke)
          [], // multisigners
          TOKEN_2022_PROGRAM_ID
        )
      )
      logger.info('Mint authority revocation instruction added')
    }

    // Handle freeze authority revocation
    if (tokenData.revokeFreezeAuthority) {
      transaction.add(
        createSetAuthorityInstruction(
          mintPublicKey, // mint
          walletPublicKey, // current authority
          AuthorityType.FreezeAccount, // authority type
          null, // new authority (null = revoke)
          [], // multisigners
          TOKEN_2022_PROGRAM_ID
        )
      )
      logger.info('Freeze authority revocation instruction added')
    }

    // If immutable is requested, revoke the metadata update authority
    if (tokenData.immutable && metadata) {
      // For SPL Token 2022 metadata, we use createUpdateAuthorityInstruction (following original pattern)
      transaction.add(
        createUpdateAuthorityInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mintPublicKey, // metadata address is the mint itself
          oldAuthority: walletPublicKey,
          newAuthority: null, // Setting to null makes metadata immutable
        })
      )
      logger.info('Update authority revocation instruction added - token metadata is now immutable', {
        mintAddress: mintPublicKey.toString(),
        previousUpdateAuthority: walletPublicKey.toString(),
        newUpdateAuthority: 'null (revoked)',
        isImmutable: true,
      })
    }

    // Don't sign the transaction server-side - let the client handle all signing
    // This ensures proper signature handling across serialization/deserialization

    // Validate transaction before returning
    if (transaction.instructions.length === 0) {
      throw new SolanaError('Transaction has no instructions', SOLANA_ERROR_CODES.INVALID_INPUT)
    }

    // Check transaction size before returning to catch size issues early
    let transactionSize: number
    try {
      const serialized = transaction.serialize({ requireAllSignatures: false })
      transactionSize = serialized.length
    } catch (sizeError) {
      logger.error('Transaction size validation failed', sizeError, {
        mintAddress: mintPublicKey.toString(),
        instructionCount: transaction.instructions.length,
        hasMetadata: !!metadata,
        metadataFieldsCount: metadata?.additionalMetadata.length || 0,
      })

      // If transaction is too large, throw a specific error with guidance
      if (sizeError instanceof Error && sizeError.message.includes('too large')) {
        throw new SolanaError(
          'Token creation transaction exceeds Solana size limits. Try reducing the description length or creating the token without some optional features.',
          SOLANA_ERROR_CODES.TRANSACTION_FAILED
        )
      }
      throw sizeError
    }

    const result: CreateTokenTransactionResult = {
      transaction,
      mintPublicKey: mintPublicKey.toString(),
      mintKeypair, // Include the keypair for client-side signing
      tokenAccountAddress: associatedTokenAccountAddress.toString(),
      totalSupply: rawSupply.toString(),
    }

    logger.info('Token creation transaction prepared successfully', {
      mintAddress: mintPublicKey.toString(),
      tokenAccount: associatedTokenAccountAddress.toString(),
      totalSupply: rawSupply.toString(),
      transactionSize,
      instructionCount: transaction.instructions.length,
      metadataFieldsCount: metadata?.additionalMetadata.length || 0,
      sizeLimitUtilization: `${((transactionSize / 1232) * 100).toFixed(1)}%`,
    })

    return result
  } catch (error: unknown) {
    logger.error('Failed to create token creation transaction', error, {
      tokenName: tokenData.name,
      tokenSymbol: tokenData.symbol,
      wallet: walletPublicKey.toString(),
    })

    // Handle specific Solana errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient')) {
        throw new SolanaError('Insufficient funds for token creation', SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS)
      }
      if (error.message.includes('invalid')) {
        throw new SolanaError('Invalid token creation parameters', SOLANA_ERROR_CODES.INVALID_INPUT)
      }
    }

    // Re-throw SolanaError instances
    if (error instanceof SolanaError) {
      throw error
    }

    // Generic error
    throw new SolanaError('Failed to prepare token creation transaction', SOLANA_ERROR_CODES.TRANSACTION_FAILED)
  }
}
