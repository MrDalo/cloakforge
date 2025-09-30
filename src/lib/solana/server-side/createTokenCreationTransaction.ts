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
import { addComputeBudgetInstructions, createConnectionPair } from '@/lib/solana/utils'
import { getLogger } from '@/lib/logger/logger'
import { SolanaError } from '@/types/error'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import getServerConfig from '@/lib/config/getServerConfig'
import { toolFeeConfigs } from '@/lib/utils/feeConfigs'
import { getToolConfigFromCache } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
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
  const { legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'create-token',
    function: 'createTokenCreationTransaction',
    wallet: walletPublicKey.toString(),
    rpcEndpoint: serverConfig.rpcPrivateEndpoint,
  })

  try {
    // Generate new mint keypair
    const mintKeypair = Keypair.generate()
    const mintPublicKey = mintKeypair.publicKey

    // Calculate service fees based on selected options
    let totalServiceFeeSOL = 0

    // Get base service fee from tool configuration
    try {
      const toolConfig = await getToolConfigFromCache('token-creator')
      if (toolConfig) {
        totalServiceFeeSOL += toolConfig.baseFee
      }
    } catch (error) {
      logger.warn('Failed to get tool config for base fee, using zero', { error: String(error) })
    }

    const toolFees = toolFeeConfigs['token-creator']()

    // Apply service fees for authority revocations
    for (const feeConfig of toolFees) {
      if (feeConfig.fieldName === 'revokeMintAuthority' && tokenData.revokeMintAuthority) {
        totalServiceFeeSOL += feeConfig.fee
      }
      if (feeConfig.fieldName === 'revokeFreezeAuthority' && tokenData.revokeFreezeAuthority) {
        totalServiceFeeSOL += feeConfig.fee
      }
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

    // CRITICAL FIX: Use simulation-friendly compute budget
    // Reduced compute units and conservative priority fee for better simulation compatibility
    const computeUnits = 400000 // Reduced from 500k for better simulation
    const priorityFee = 5000 // Conservative priority fee for simulation

    // Add compute budget instructions with simulation-friendly settings
    addComputeBudgetInstructions(transaction, computeUnits, priorityFee)

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
    }

    // If immutable metadata is requested, revoke the metadata update authority
    if (tokenData.immutableMetadata && metadata) {
      // For SPL Token 2022 metadata, we use createUpdateAuthorityInstruction (following original pattern)
      transaction.add(
        createUpdateAuthorityInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mintPublicKey, // metadata address is the mint itself
          oldAuthority: walletPublicKey,
          newAuthority: null, // Setting to null makes metadata immutable
        })
      )
    }

    // Don't sign the transaction server-side - let the client handle all signing
    // This ensures proper signature handling across serialization/deserialization

    // Validate transaction before returning
    if (transaction.instructions.length === 0) {
      throw new SolanaError('Transaction has no instructions', SOLANA_ERROR_CODES.INVALID_INPUT)
    }

    try {
      transaction.serialize({ requireAllSignatures: false })
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

    // Log transaction construction details for debugging
    logger.info('Token creation transaction constructed with simulation-friendly settings', {
      computeUnits,
      priorityFee,
      instructionCount: transaction.instructions.length,
      serviceFee: totalServiceFeeSOL,
      tokenName: tokenData.name,
      tokenSymbol: tokenData.symbol,
      estimatedSize: transaction.serialize({ requireAllSignatures: false }).length,
    })

    const result: CreateTokenTransactionResult = {
      transaction,
      mintPublicKey: mintPublicKey.toString(),
      mintKeypair, // Include the keypair for client-side signing
      tokenAccountAddress: associatedTokenAccountAddress.toString(),
      totalSupply: rawSupply.toString(),
    }

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
