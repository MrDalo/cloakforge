/**
 * Modern SPL Token 2022 Creator with Dynamic Priority Fees
 *
 * This implementation uses:
 * - @solana/kit v3.0+ for RPC connection and dynamic priority fee calculation
 * - Legacy Connection for Token 2022 operations (until Kit has full support)
 * - Dynamic priority fee calculation using getRecentPrioritizationFees
 * - Optimized transaction confirmation strategies
 * - SPL Token 2022 with embedded metadata using MetadataPointer extension
 * - Pinata IPFS for off-chain metadata storage
 */

import { address, type Address } from '@solana/kit'

// Legacy imports for Token 2022 (until Kit has full Token 2022 support)
import { PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  getMintLen,
  ExtensionType,
  createInitializeMetadataPointerInstruction,
} from '@solana/spl-token'

import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
  createUpdateAuthorityInstruction,
  TokenMetadata,
} from '@solana/spl-token-metadata'

import { uploadFileToIPFS, uploadJSONToIPFS } from '../ipfs/utils'
import { TokenCreatorFormData } from '@/components/pages/TokenCreatorPage/TokenCreationForm/tokenCreatorFormSchema'
import { getLogger } from '@/lib/logger/logger'
import { ConfigType } from '@/types/config'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import { SolanaError, AppError } from '@/types/error'
import { toolFeeConfigs } from '@/lib/utils/feeConfigs'

// Import reusable utilities
import {
  calculateDynamicPriorityFee,
  addComputeBudgetInstructions,
  getFreshBlockhash,
  confirmTransactionWithParallelStrategy,
  validateWalletBalance,
  createConnectionPair,
} from './utils'

// Import service memo utilities
import { addServiceMemo, SERVICE_IDENTIFIERS } from './serviceMemo'

export interface EnhancedTokenCreatorFormData extends TokenCreatorFormData {
  serviceFee: number // Service fee in SOL (will be converted to lamports internally)
}

export interface TokenCreationResult {
  mintAddress: string
  signature: string
  metadata: {
    name: string
    symbol: string
    uri: string
    imageUri: string
  }
}

/**
 * Creates a new SPL Token 2022 with embedded metadata using modern Solana Kit v3.0+
 * with dynamic priority fee calculation and optimized transaction handling
 */
export const createTokenWithSolanaKit = async (
  walletAddress: Address | string,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  tokenData: EnhancedTokenCreatorFormData,
  config: ConfigType
): Promise<TokenCreationResult> => {
  // Convert to legacy PublicKey for compatibility
  const walletPubkey = new PublicKey(typeof walletAddress === 'string' ? walletAddress : walletAddress)

  // Runtime validation with proper error codes
  if (!walletPubkey) {
    throw new SolanaError('Wallet address is required', SOLANA_ERROR_CODES.INVALID_WALLET_ADDRESS)
  }
  if (!signTransaction) {
    throw new AppError('Transaction signing function is required', APP_ERROR_CODES.MISSING_REQUIRED_FIELD)
  }

  // Setup connections - use connection pair helper to prevent rate limiting
  const { rpcEndpoint, feeWalletAddress } = config

  // Create reusable connection pair to avoid multiple connection creation
  const { kitRpc, legacyConnection } = createConnectionPair(rpcEndpoint)

  const logger = getLogger({
    context: 'token-creator-kit-v3',
    function: 'createTokenWithSolanaKit',
    walletAddress: walletPubkey.toString(),
    kitVersion: '3.0+',
  })

  try {
    // Calculate total service fee including additional service fees from feeConfigs.ts
    let totalServiceFee = tokenData.serviceFee || 0

    // Get additional fees from centralized fee configuration
    const toolFees = toolFeeConfigs['token-creator']()

    // Apply additional fees based on selected services
    for (const feeConfig of toolFees) {
      if (feeConfig.fieldName === 'revokeMintAuthority' && tokenData.revokeMintAuthority) {
        totalServiceFee += feeConfig.fee
      }

      if (feeConfig.fieldName === 'revokeFreezeAuthority' && tokenData.revokeFreezeAuthority) {
        totalServiceFee += feeConfig.fee
      }
    }

    // Get dynamic priority fee using modern Kit RPC with automatic fallback
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch (priorityFeeError) {
      // Fallback to static priority fee if dynamic calculation fails (e.g., 403 from RPC)
      logger.warn('Dynamic priority fee calculation failed, using static fallback', {
        error: priorityFeeError instanceof Error ? priorityFeeError.message : String(priorityFeeError),
        fallbackFee: 100_000,
        reason: 'RPC_priority_fee_call_failed',
      })
      dynamicPriorityFee = 100_000 // Conservative static fee
    }

    // Get wallet balance using refactored utility with automatic Kit RPC -> legacy fallback
    const walletBalanceResult = await validateWalletBalance(
      address(walletPubkey.toString()),
      0, // We'll check balance separately after getting the actual value
      kitRpc,
      legacyConnection,
      logger
    )
    const walletBalance = BigInt(walletBalanceResult.balance)

    // Calculate estimated cost based on actual transaction requirements
    let estimatedCost = 0

    // Base token creation cost (rent + transaction fees)
    estimatedCost += 5_000_000 // ~0.005 SOL for base token creation

    // Add total service fee to estimated cost (calculated above)
    if (totalServiceFee > 0) {
      estimatedCost += Math.floor(totalServiceFee * LAMPORTS_PER_SOL)
    }

    // Authority revocation costs are included in service fees above
    // No additional blockchain costs for authority revocations

    // Priority fee estimation (conservative estimate)
    estimatedCost += Math.floor((dynamicPriorityFee * 500_000) / 1_000_000) // Based on 500k compute units

    const estimatedCostSOL = estimatedCost / LAMPORTS_PER_SOL

    if (Number(walletBalance) < estimatedCost) {
      const error = new SolanaError(
        `Insufficient funds. Need at least ${estimatedCostSOL.toFixed(4)} SOL, but wallet has ${(Number(walletBalance) / LAMPORTS_PER_SOL).toFixed(4)} SOL`,
        SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS
      )
      logger.error('Insufficient wallet balance', error, {
        walletBalance: Number(walletBalance),
        walletBalanceSOL: (Number(walletBalance) / LAMPORTS_PER_SOL).toFixed(6),
        estimatedCost,
        estimatedCostSOL: estimatedCostSOL.toFixed(6),
        shortfall: estimatedCost - Number(walletBalance),
        shortfallSOL: ((estimatedCost - Number(walletBalance)) / LAMPORTS_PER_SOL).toFixed(6),
      })
      throw error
    }

    // Setup mint configuration
    const mintKeypair = Keypair.generate()
    const mintAddress = mintKeypair.publicKey
    const decimals = Number(tokenData.decimals)
    const supply = Number(tokenData.totalSupply)

    // Validate decimals
    if (decimals < 0 || decimals > 9) {
      const error = new SolanaError('Decimals must be between 0 and 9', SOLANA_ERROR_CODES.INVALID_INPUT)
      logger.error('Invalid decimals value', error, { decimals })
      throw error
    }

    // Upload image and create metadata
    let imageUri = ''
    if (tokenData.logo) {
      try {
        imageUri = await uploadFileToIPFS(tokenData.logo as File)
      } catch (error: unknown) {
        const ipfsError = new AppError('Failed to upload image to IPFS', APP_ERROR_CODES.UPLOAD_FAILED)
        logger.error('IPFS image upload failed', error, {
          fileName: (tokenData.logo as File)?.name,
          fileSize: (tokenData.logo as File)?.size,
        })
        throw ipfsError
      }
    } else {
      imageUri = 'https://red-academic-smelt-470.mypinata.cloud/ipfs/bafkreib32upwnobzayvo3lt6e6myvjtgfcocl5ge3gjuecxocb4v7ypdku'
    }

    // Create comprehensive off-chain metadata
    const offChainMetadata = {
      name: tokenData.name,
      symbol: tokenData.symbol,
      description: tokenData.description || '',
      image: imageUri,
      external_url: tokenData.website || '',
      attributes: [],
      properties: {
        files: [
          {
            uri: imageUri,
            type: 'image/png',
          },
        ],
        category: 'image',
        creators: [
          {
            address: walletPubkey.toString(),
            share: 100,
          },
        ],
      },
      ...(tokenData.twitter && { twitter: tokenData.twitter }),
      ...(tokenData.telegram && { telegram: tokenData.telegram }),
      ...(tokenData.website && { website: tokenData.website }),
      ...(tokenData.discord && { discord: tokenData.discord }),
      createdWith: 'SolCloak',
      createdAt: new Date().toISOString(),
    }

    let metadataUri: string
    try {
      metadataUri = await uploadJSONToIPFS(offChainMetadata)
    } catch (error: unknown) {
      const metadataError = new AppError('Failed to upload metadata to IPFS', APP_ERROR_CODES.UPLOAD_FAILED)
      logger.error('IPFS metadata upload failed', error, {
        metadataSize: JSON.stringify(offChainMetadata).length,
      })
      throw metadataError
    }

    // Create on-chain metadata object
    const additionalMetadata: [string, string][] = [
      ['description', tokenData.description || ''],
      ['created_with', 'SolCloak'],
      ['created_at', new Date().toISOString()],
    ]

    if (tokenData.website) {
      additionalMetadata.push(['website', tokenData.website])
    }
    if (tokenData.twitter) {
      additionalMetadata.push(['twitter', tokenData.twitter])
    }
    if (tokenData.telegram) {
      additionalMetadata.push(['telegram', tokenData.telegram])
    }
    if (tokenData.discord) {
      additionalMetadata.push(['discord', tokenData.discord])
    }

    const metadata: TokenMetadata = {
      mint: mintAddress,
      name: tokenData.name,
      symbol: tokenData.symbol,
      uri: metadataUri,
      additionalMetadata,
    }

    // Calculate required space for the mint account with MetadataPointer extension only
    // CRITICAL: Do NOT pre-allocate space for TokenMetadata extension!
    // The TokenMetadata initialization instruction will automatically reallocate space
    const extensions = [ExtensionType.MetadataPointer]
    const mintLen = getMintLen(extensions)

    // Use ONLY the space needed for mint + MetadataPointer extension
    // The TokenMetadata initialization will handle reallocation automatically
    const totalLen = mintLen

    // Get rent exemption amount using legacy connection for initial space only
    const lamportsForRent = await legacyConnection.getMinimumBalanceForRentExemption(totalLen)

    // Build transaction instructions using legacy approach for Token 2022
    const transaction = new Transaction()

    // Add compute budget instructions with dynamic priority fee for optimal performance
    addComputeBudgetInstructions(transaction, 500_000, dynamicPriorityFee)

    // Add platform fee transfer instruction before token creation
    if (totalServiceFee > 0 && feeWalletAddress) {
      const serviceFeeLamports = Math.floor(totalServiceFee * LAMPORTS_PER_SOL) // Convert SOL to lamports

      // Add service fee transfer
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPubkey,
          toPubkey: new PublicKey(feeWalletAddress),
          lamports: serviceFeeLamports,
        })
      )

      // Add service identification memo for on-chain tracking
      addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    }

    // Create mint account
    const createMintAccountIx = SystemProgram.createAccount({
      fromPubkey: walletPubkey,
      newAccountPubkey: mintAddress,
      space: totalLen,
      lamports: lamportsForRent,
      programId: TOKEN_2022_PROGRAM_ID,
    })
    transaction.add(createMintAccountIx)

    // Initialize metadata pointer (pointing to the mint itself)
    const initMetadataPointerIx = createInitializeMetadataPointerInstruction(mintAddress, walletPubkey, mintAddress, TOKEN_2022_PROGRAM_ID)
    transaction.add(initMetadataPointerIx)

    // Initialize mint with authority settings based on form data
    const mintAuthority = walletPubkey // Will be revoked later if requested
    const freezeAuthority = walletPubkey // Will be revoked later if requested
    const initMintIx = createInitializeMintInstruction(mintAddress, decimals, mintAuthority, freezeAuthority, TOKEN_2022_PROGRAM_ID)
    transaction.add(initMintIx)

    // Calculate additional rent needed for TokenMetadata extension
    // The metadata initialization will reallocate space, but we need to ensure sufficient lamports
    const estimatedMetadataSize =
      200 + // Base metadata structure
      metadata.name.length +
      metadata.symbol.length +
      metadata.uri.length +
      metadata.additionalMetadata.reduce((sum, [key, value]) => sum + key.length + value.length + 20, 0) + // Extra padding per field
      500 // Additional buffer for TLV encoding and future metadata fields

    const totalExpectedLen = totalLen + estimatedMetadataSize
    const additionalRentLamports = await legacyConnection.getMinimumBalanceForRentExemption(totalExpectedLen)
    const currentRentLamports = await legacyConnection.getMinimumBalanceForRentExemption(totalLen)
    const rentDifference = additionalRentLamports - currentRentLamports

    // Transfer additional rent to mint account if needed for metadata reallocation
    if (rentDifference > 0) {
      const transferRentIx = SystemProgram.transfer({
        fromPubkey: walletPubkey,
        toPubkey: mintAddress,
        lamports: rentDifference,
      })
      transaction.add(transferRentIx)
    }

    // Initialize metadata inside the mint
    const initMetadataIx = createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      mint: mintAddress,
      metadata: mintAddress,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      mintAuthority: walletPubkey,
      updateAuthority: walletPubkey,
    })
    transaction.add(initMetadataIx)

    // Add additional metadata fields (always include during creation)
    // The immutable flag controls future updates, not initial metadata creation
    for (const [key, value] of metadata.additionalMetadata) {
      if (value && value.trim()) {
        const updateFieldIx = createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mintAddress,
          updateAuthority: walletPubkey,
          field: key,
          value,
        })
        transaction.add(updateFieldIx)
      }
    }

    // Create associated token account and mint tokens
    const userTokenAccount = await getAssociatedTokenAddress(mintAddress, walletPubkey, false, TOKEN_2022_PROGRAM_ID)

    const createAtaIx = createAssociatedTokenAccountInstruction(
      walletPubkey,
      userTokenAccount,
      walletPubkey,
      mintAddress,
      TOKEN_2022_PROGRAM_ID
    )
    transaction.add(createAtaIx)

    // Calculate mint amount with decimals
    const mintAmount = supply * Math.pow(10, decimals)

    const mintToIx = createMintToInstruction(mintAddress, userTokenAccount, walletPubkey, mintAmount, [], TOKEN_2022_PROGRAM_ID)
    transaction.add(mintToIx)

    // Handle authority revocations based on form data
    if (tokenData.revokeMintAuthority) {
      const revokeMintAuthorityIx = createSetAuthorityInstruction(
        mintAddress,
        walletPubkey,
        AuthorityType.MintTokens,
        null,
        [],
        TOKEN_2022_PROGRAM_ID
      )
      transaction.add(revokeMintAuthorityIx)
    }

    if (tokenData.revokeFreezeAuthority) {
      const revokeFreezeAuthorityIx = createSetAuthorityInstruction(
        mintAddress,
        walletPubkey,
        AuthorityType.FreezeAccount,
        null,
        [],
        TOKEN_2022_PROGRAM_ID
      )
      transaction.add(revokeFreezeAuthorityIx)
    }

    // If immutable is true, revoke the metadata update authority
    if (tokenData.immutable) {
      // For SPL Token 2022 metadata, we can revoke the update authority by setting it to null
      // This makes the token metadata truly immutable - no one can update it after creation
      const revokeUpdateAuthorityIx = createUpdateAuthorityInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        metadata: mintAddress,
        oldAuthority: walletPubkey,
        newAuthority: null, // Setting to null makes metadata immutable
      })
      transaction.add(revokeUpdateAuthorityIx)

      logger.info('Token marked as immutable - metadata update authority revoked', {
        mintAddress: mintAddress.toString(),
        previousUpdateAuthority: walletPubkey.toString(),
        newUpdateAuthority: 'null (revoked)',
        isImmutable: true,
      })
    }

    // Finalize transaction with optimized blockhash handling using Kit RPC
    transaction.feePayer = walletPubkey

    // Use refactored utility for fresh blockhash with automatic Kit RPC -> legacy fallback
    let blockhash: string
    try {
      const freshBlockhash = await getFreshBlockhash(kitRpc, legacyConnection, logger)
      blockhash = freshBlockhash.blockhash
    } catch (blockhashError) {
      // This should not happen since getFreshBlockhash now has built-in fallback
      logger.error('Both Kit RPC and legacy connection failed for blockhash', {
        error: blockhashError instanceof Error ? blockhashError.message : String(blockhashError),
      })
      throw new SolanaError('Unable to get transaction blockhash', SOLANA_ERROR_CODES.RPC_ERROR)
    }
    transaction.recentBlockhash = blockhash

    // Sign with mint keypair
    transaction.partialSign(mintKeypair)

    // Sign with wallet
    const signedTransaction = await signTransaction(transaction)

    // Send transaction with optimized settings
    let signature: string
    try {
      // Use the existing legacyConnection to avoid creating multiple connections and rate limiting
      signature = await legacyConnection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'processed',
        maxRetries: 3,
      })
    } catch (error: unknown) {
      const txError = new SolanaError('Failed to send token creation transaction', SOLANA_ERROR_CODES.TRANSACTION_FAILED)
      logger.error('Transaction send failed', error, {
        transactionSize: signedTransaction.serialize().length,
        instructionCount: transaction.instructions.length,
        totalLen,
        mintAddress: mintAddress.toString(),
        priorityFee: dynamicPriorityFee,
      })
      throw txError
    }

    // Ultra-fast parallel confirmation strategy with refactored utility
    try {
      const confirmation = await confirmTransactionWithParallelStrategy(signature, dynamicPriorityFee, kitRpc, legacyConnection, logger)

      if (!confirmation.confirmed) {
        // Transaction failed or timed out
        logger.warn('Transaction confirmation failed or timed out - transaction may still be processing', {
          signature,
          confirmationTime: confirmation.confirmationTime,
          method: confirmation.method,
          nextStep: 'final_status_check',
        })

        const enhancedError = new SolanaError(
          'Transaction confirmation timed out - it may still be processing. Check the signature on Solana Explorer.',
          SOLANA_ERROR_CODES.FINALIZATION_TIMEOUT
        )
        throw enhancedError
      }
    } catch (error: unknown) {
      // Final fallback - one more status check using existing connection
      logger.warn('Parallel confirmation failed, attempting final status check', {
        signature,
        error: error instanceof Error ? error.message : String(error),
      })

      try {
        const finalCheck = await legacyConnection.getSignatureStatus(signature, {
          searchTransactionHistory: true,
        })

        if (finalCheck?.value?.confirmationStatus === 'confirmed' || finalCheck?.value?.confirmationStatus === 'finalized') {
          logger.info('Final status check found transaction success', {
            signature,
            confirmationStatus: finalCheck.value.confirmationStatus,
            slot: finalCheck.value.slot,
          })
        } else {
          const enhancedError = new SolanaError(
            'Transaction confirmation completely failed after all attempts',
            SOLANA_ERROR_CODES.FINALIZATION_TIMEOUT
          )
          throw enhancedError
        }
      } catch (statusError) {
        logger.error('All confirmation methods failed', {
          signature,
          originalError: error instanceof Error ? error.message : String(error),
          statusError: statusError instanceof Error ? statusError.message : String(statusError),
        })

        const finalError = new SolanaError('Transaction confirmation completely failed', SOLANA_ERROR_CODES.FINALIZATION_TIMEOUT)
        throw finalError
      }
    }

    const result = {
      mintAddress: mintAddress.toString(),
      signature,
      metadata: {
        name: tokenData.name,
        symbol: tokenData.symbol,
        uri: metadataUri,
        imageUri,
      },
    }

    return result
  } catch (error: unknown) {
    // Enhanced error handling with domain-specific error codes
    let enhancedError: Error
    if (error instanceof SolanaError || error instanceof AppError || error instanceof Error) {
      enhancedError = error
    } else {
      enhancedError = new AppError('Token creation failed with unknown error', APP_ERROR_CODES.UNKNOWN_ERROR)
    }

    // Log the error with context
    logger.error('Token creation failed', enhancedError, {
      tokenName: tokenData.name,
      tokenSymbol: tokenData.symbol,
      walletAddress: walletPubkey.toString(),
      userFriendlyMessage: getUserErrorMessageFromError(enhancedError),
    })

    throw enhancedError
  }
}

export default createTokenWithSolanaKit
