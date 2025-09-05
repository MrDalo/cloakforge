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

import { createSolanaRpc, address, type Address } from '@solana/kit'

// Legacy imports for Token 2022 (until Kit has full Token 2022 support)
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, ComputeBudgetProgram } from '@solana/web3.js'
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

import { createInitializeInstruction, createUpdateFieldInstruction, TokenMetadata } from '@solana/spl-token-metadata'

import { uploadFileToIPFS, uploadJSONToIPFS } from '../ipfs/utils'
import { TokenCreatorFormData } from '@/components/pages/TokenCreatorPage/TokenCreationForm/tokenCreatorFormSchema'
import { getLogger } from '@/lib/logger/logger'
import { ConfigType } from '@/types/config'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import { SolanaError, AppError } from '@/types/error'
import { SOL_TO_LAMPORTS } from '@/hooks/useFeeCalculation'
import { toolFeeConfigs } from '@/lib/utils/feeConfigs'

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
 * Calculate dynamic priority fee based on recent network activity
 */
const calculateDynamicPriorityFee = async (
  rpc: ReturnType<typeof createSolanaRpc>,
  logger: ReturnType<typeof getLogger>
): Promise<number> => {
  try {
    logger.info('Calculating dynamic priority fee based on network conditions')

    // Get recent prioritization fees from network
    const recentFees = await rpc.getRecentPrioritizationFees().send()

    if (recentFees && recentFees.length > 0) {
      // Calculate statistics from recent fees - convert MicroLamports to numbers
      const fees = recentFees.map((fee) => Number(fee.prioritizationFee))
      const nonZeroFees = fees.filter((fee) => fee > 0)

      if (nonZeroFees.length === 0) {
        // No recent priority fees - network is quiet, use competitive fee for fast inclusion
        const quietNetworkFee = 100_000 // Increased from 50k for faster inclusion during quiet periods
        logger.info('Network appears quiet (no priority fees) - using competitive quiet-network fee', {
          microLamports: quietNetworkFee,
          recentFeesCount: fees.length,
          reasoning: 'Higher than minimum to ensure fast inclusion during quiet network periods',
        })
        return quietNetworkFee
      }

      // Calculate percentiles for smart fee selection
      const sortedFees = [...nonZeroFees].sort((a, b) => a - b)
      const p50 = sortedFees[Math.floor(sortedFees.length * 0.5)] || 0
      const p75 = sortedFees[Math.floor(sortedFees.length * 0.75)] || 0
      const p90 = sortedFees[Math.floor(sortedFees.length * 0.9)] || 0
      const maxFee = Math.max(...sortedFees)
      const avgFee = Math.floor(sortedFees.reduce((sum, fee) => sum + fee, 0) / sortedFees.length)

      // Use 75th percentile + 25% buffer for competitive inclusion
      // This ensures we're faster than 75% of transactions with some buffer
      const recommendedFee = Math.floor(p75 * 1.25)

      // Set reasonable bounds (min 25k, max 1M microLamports)
      const minFee = 25_000
      const maxFeeCap = 1_000_000
      const finalFee = Math.min(Math.max(recommendedFee, minFee), maxFeeCap)

      logger.info('Dynamic priority fee calculated from network data', {
        recentSlotsAnalyzed: recentFees.length,
        nonZeroFeesCount: nonZeroFees.length,
        statistics: {
          median: p50,
          p75,
          p90,
          max: maxFee,
          average: avgFee,
        },
        calculation: {
          p75_base: p75,
          buffer_multiplier: 1.25,
          recommended: recommendedFee,
          finalFee,
          bounds: { min: minFee, max: maxFeeCap },
        },
        estimatedSOL: (finalFee * 400_000) / 1_000_000 / 1_000_000_000, // Rough estimate
      })

      return finalFee
    } else {
      // Fallback to competitive static fee for network issues
      const fallbackFee = 200_000 // Increased for better inclusion when RPC fails
      logger.warn('Failed to get recent prioritization fees - using higher fallback', {
        microLamports: fallbackFee,
        reasoning: 'Higher fallback for reliable inclusion when network data unavailable',
      })
      return fallbackFee
    }
  } catch (error) {
    // Fallback to conservative competitive fee on error
    const errorFallbackFee = 250_000 // Increased for reliable inclusion on errors
    logger.error('Error calculating dynamic priority fee - using higher conservative fallback', error, {
      microLamports: errorFallbackFee,
      reasoning: 'Higher emergency fallback for reliable inclusion when calculation fails',
    })
    return errorFallbackFee
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

  // Setup connections - use Kit RPC for modern features, legacy Connection for Token 2022 compatibility
  const { rpcEndpoint, feeWalletAddress } = config

  // Initialize modern Kit RPC for dynamic priority fee and optimized operations
  const kitRpc = createSolanaRpc(rpcEndpoint)
  const legacyConnection = new Connection(rpcEndpoint, 'confirmed')

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
        logger.debug('Added revoke mint authority fee from feeConfigs', {
          fee: feeConfig.fee,
          description: feeConfig.description,
        })
      }

      if (feeConfig.fieldName === 'revokeFreezeAuthority' && tokenData.revokeFreezeAuthority) {
        totalServiceFee += feeConfig.fee
        logger.debug('Added revoke freeze authority fee from feeConfigs', {
          fee: feeConfig.fee,
          description: feeConfig.description,
        })
      }
    }

    logger.info('Total service fees calculated from centralized fee config', {
      baseFee: tokenData.serviceFee || 0,
      additionalFees: toolFees
        .filter(
          (fee) =>
            (fee.fieldName === 'revokeMintAuthority' && tokenData.revokeMintAuthority) ||
            (fee.fieldName === 'revokeFreezeAuthority' && tokenData.revokeFreezeAuthority)
        )
        .map((fee) => ({ fieldName: fee.fieldName, fee: fee.fee, label: fee.label })),
      totalServiceFee,
    })

    // Get dynamic priority fee using modern Kit RPC
    const dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)

    // Use Kit RPC for balance check (more efficient than legacy)
    const kitWalletAddress = address(walletPubkey.toString())
    const walletBalance = await kitRpc.getBalance(kitWalletAddress).send()

    // Calculate estimated cost based on actual transaction requirements
    let estimatedCost = 0

    // Base token creation cost (rent + transaction fees)
    estimatedCost += 5_000_000 // ~0.005 SOL for base token creation

    // Add total service fee to estimated cost (calculated above)
    if (totalServiceFee > 0) {
      estimatedCost += Math.floor(totalServiceFee * SOL_TO_LAMPORTS)
    }

    // Authority revocation costs are included in service fees above
    // No additional blockchain costs for authority revocations

    // Priority fee estimation (conservative estimate)
    estimatedCost += Math.floor((dynamicPriorityFee * 500_000) / 1_000_000) // Based on 500k compute units

    const estimatedCostSOL = estimatedCost / SOL_TO_LAMPORTS

    logger.info('Calculated estimated transaction cost', {
      baseCost: 5_000_000,
      baseServiceFee: tokenData.serviceFee || 0,
      additionalFees: toolFees
        .filter(
          (fee) =>
            (fee.fieldName === 'revokeMintAuthority' && tokenData.revokeMintAuthority) ||
            (fee.fieldName === 'revokeFreezeAuthority' && tokenData.revokeFreezeAuthority)
        )
        .reduce((acc, fee) => ({ ...acc, [fee.fieldName]: fee.fee }), {}),
      totalServiceFeeSOL: totalServiceFee,
      totalServiceFeeLamports: totalServiceFee > 0 ? Math.floor(totalServiceFee * SOL_TO_LAMPORTS) : 0,
      priorityFeeEstimate: Math.floor((dynamicPriorityFee * 500_000) / 1_000_000),
      totalEstimatedCost: estimatedCost,
      totalEstimatedSOL: estimatedCostSOL.toFixed(6),
    })

    if (Number(walletBalance) < estimatedCost) {
      const error = new SolanaError(
        `Insufficient funds. Need at least ${estimatedCostSOL.toFixed(4)} SOL, but wallet has ${(Number(walletBalance) / SOL_TO_LAMPORTS).toFixed(4)} SOL`,
        SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS
      )
      logger.error('Insufficient wallet balance', error, {
        walletBalance: Number(walletBalance),
        walletBalanceSOL: (Number(walletBalance) / SOL_TO_LAMPORTS).toFixed(6),
        estimatedCost,
        estimatedCostSOL: estimatedCostSOL.toFixed(6),
        shortfall: estimatedCost - Number(walletBalance),
        shortfallSOL: ((estimatedCost - Number(walletBalance)) / SOL_TO_LAMPORTS).toFixed(6),
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
        logger.info('Uploading token image to IPFS')
        imageUri = await uploadFileToIPFS(tokenData.logo as File)
        logger.info('Successfully uploaded image to IPFS', { imageUri })
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
      logger.debug('Using default token image', { imageUri })
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
      createdWith: 'CryptoForge',
      createdAt: new Date().toISOString(),
    }

    let metadataUri: string
    try {
      logger.info('Uploading token metadata to IPFS')
      metadataUri = await uploadJSONToIPFS(offChainMetadata)
      logger.info('Successfully uploaded metadata to IPFS', { metadataUri })
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
      ['created_with', 'CryptoForge'],
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

    // Log authority configuration
    logger.info('Token authority configuration', {
      immutable: tokenData.immutable,
      revokeMintAuthority: tokenData.revokeMintAuthority,
      revokeFreezeAuthority: tokenData.revokeFreezeAuthority,
      mintAuthority: tokenData.revokeMintAuthority ? 'will be revoked' : walletPubkey.toString(),
      freezeAuthority: tokenData.revokeFreezeAuthority ? 'will be revoked' : walletPubkey.toString(),
      updateAuthority: tokenData.immutable ? 'retained (immutable mode - updates discouraged)' : walletPubkey.toString(),
      additionalMetadata: 'will be added during creation',
    })

    // Calculate required space for the mint account with MetadataPointer extension only
    // CRITICAL: Do NOT pre-allocate space for TokenMetadata extension!
    // The TokenMetadata initialization instruction will automatically reallocate space
    const extensions = [ExtensionType.MetadataPointer]
    const mintLen = getMintLen(extensions)

    // Use ONLY the space needed for mint + MetadataPointer extension
    // The TokenMetadata initialization will handle reallocation automatically
    const totalLen = mintLen

    logger.debug('Token account space calculated', {
      mintLen,
      totalLen,
      extensions: extensions.map((ext) => ExtensionType[ext]).join(', '),
      approach: 'Minimal space for mint + MetadataPointer only - TokenMetadata init will reallocate',
      lamportsForRent: await legacyConnection.getMinimumBalanceForRentExemption(totalLen),
    })

    // Get rent exemption amount using legacy connection for initial space only
    const lamportsForRent = await legacyConnection.getMinimumBalanceForRentExemption(totalLen)

    // Build transaction instructions using legacy approach for Token 2022
    const transaction = new Transaction()

    // Add compute budget instructions with dynamic priority fee for optimal performance
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 500_000, // Increased for Token 2022 operations
      })
    )

    // Use dynamic priority fee based on current network conditions
    const priorityFeeInstruction = ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: dynamicPriorityFee,
    })
    transaction.add(priorityFeeInstruction)

    // Debug: Log the priority fee instruction details
    logger.info('Dynamic priority fee instruction added', {
      instructionProgramId: priorityFeeInstruction.programId.toString(),
      instructionData: priorityFeeInstruction.data.toString('hex'),
      microLamports: dynamicPriorityFee,
      instruction: 'ComputeBudgetProgram.setComputeUnitPrice',
      feeSource: 'dynamic_calculation',
    })

    // Log priority fee information with updated calculation
    const estimatedComputeUnits = 500_000
    // Priority fee calculation: (microLamports * actual_compute_units) / 1_000_000
    const priorityFeeInLamports = (dynamicPriorityFee * estimatedComputeUnits) / 1_000_000
    const priorityFeeInSOL = priorityFeeInLamports / 1_000_000_000
    logger.info('Dynamic priority fee applied for optimal network performance', {
      microLamportsPerComputeUnit: dynamicPriorityFee,
      estimatedComputeUnits,
      priorityFeeInLamports,
      estimatedPriorityFeeSOL: priorityFeeInSOL.toFixed(6),
      purpose: 'Network-optimized priority for fastest inclusion',
      improvement: 'Dynamic vs static fee calculation',
    })

    // Add platform fee transfer instruction before token creation
    if (totalServiceFee > 0 && feeWalletAddress) {
      const serviceFeeLamports = Math.floor(totalServiceFee * SOL_TO_LAMPORTS) // Convert SOL to lamports
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPubkey,
          toPubkey: new PublicKey(feeWalletAddress),
          lamports: serviceFeeLamports,
        })
      )
      logger.info('Service fee transfer instruction added', {
        totalServiceFeeSOL: totalServiceFee,
        serviceFeeLamports,
        feeWalletAddress,
      })
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
      logger.debug('Added rent transfer for metadata reallocation', {
        rentDifference,
        totalExpectedLen,
        estimatedMetadataSize,
      })
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
      logger.debug('Added mint authority revocation instruction')
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
      logger.debug('Added freeze authority revocation instruction')
    }

    // If immutable is true, revoke the metadata update authority
    if (tokenData.immutable) {
      // For SPL Token 2022 metadata, we can revoke the update authority
      // Note: This is different from mint/freeze authority revocation
      // We need to use the metadata update authority revocation if available
      logger.info('Token marked as immutable - metadata update authority will be retained but updates discouraged')
      // TODO: Implement proper metadata update authority revocation when SPL libraries support it
    }

    // Finalize transaction with optimized blockhash handling using Kit RPC
    transaction.feePayer = walletPubkey

    // Get the freshest possible blockhash using Kit RPC for better performance
    logger.debug('Getting fresh blockhash using Kit RPC for optimal transaction timing')

    // Use Kit RPC for faster blockhash retrieval
    const kitBlockhash = await kitRpc.getLatestBlockhash().send()
    const blockhash = kitBlockhash.value.blockhash
    const lastValidBlockHeight = kitBlockhash.value.lastValidBlockHeight

    transaction.recentBlockhash = blockhash

    // Log blockhash info for debugging
    logger.debug('Transaction blockhash info from Kit RPC', {
      blockhash,
      lastValidBlockHeight: Number(lastValidBlockHeight),
      timestamp: new Date().toISOString(),
      rpcSource: 'kit_v3',
    })

    // Sign with mint keypair
    transaction.partialSign(mintKeypair)

    // Sign with wallet
    const signedTransaction = await signTransaction(transaction)

    // Send transaction with optimized settings
    let signature: string
    try {
      // Debug: Analyze transaction instructions before sending
      const instructionDetails = transaction.instructions.map((ix, index) => ({
        index,
        programId: ix.programId.toString(),
        dataLength: ix.data.length,
        keysCount: ix.keys.length,
        isComputeBudget: ix.programId.equals(ComputeBudgetProgram.programId),
      }))

      logger.info('Sending token creation transaction with dynamic priority fee', {
        instructionCount: transaction.instructions.length,
        totalLen,
        mintAddress: mintAddress.toString(),
        instructionDetails,
        computeBudgetInstructions: instructionDetails.filter((ix) => ix.isComputeBudget),
        blockhash,
        lastValidBlockHeight: Number(lastValidBlockHeight),
        transactionSize: signedTransaction.serialize().length,
        dynamicPriorityFee,
        rpcMethod: 'kit_v3_optimized',
      })

      // Use legacy connection for transaction sending (Kit may not have sendRawTransaction yet)
      // Send with maxRetries and optimized preflightCommitment
      signature = await legacyConnection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'processed', // Fastest send option
        maxRetries: 3, // Allow retries if needed
      })

      logger.info('Transaction sent successfully with dynamic priority', {
        signature,
        sendTime: new Date().toISOString(),
        priorityFeeMicroLamports: dynamicPriorityFee,
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
    // Ultra-fast parallel confirmation strategy with network-adaptive timeouts
    try {
      logger.info('Starting parallel confirmation with network-adaptive polling', {
        signature,
        priorityFee: dynamicPriorityFee,
      })

      const confirmationStart = Date.now()

      // Network-adaptive polling with longer timeout for high-congestion scenarios
      const adaptivePolling = async (): Promise<{ confirmed: boolean; status: string; slot?: number }> => {
        // Adjust polling duration based on network conditions and priority fee
        const isHighPriority = dynamicPriorityFee >= 100_000
        const isVeryHighPriority = dynamicPriorityFee >= 250_000

        // Network-adaptive timeouts:
        // - Very high priority (250k+): 15 seconds max (expect fast processing)
        // - High priority (100k+): 20 seconds max (good priority)
        // - Standard priority (<100k): 30 seconds max (may wait in queue)
        const maxPolls = isVeryHighPriority ? 15 : isHighPriority ? 20 : 30
        const pollInterval = 1000 // 1 second intervals

        logger.info('Using network-adaptive polling strategy', {
          priorityFee: dynamicPriorityFee,
          maxWaitTime: `${maxPolls} seconds`,
          strategy: isVeryHighPriority ? 'very_high_priority' : isHighPriority ? 'high_priority' : 'standard_wait',
          reasoning: 'Longer waits for lower priority fees during network congestion',
        })

        let pollCount = 0

        while (pollCount < maxPolls) {
          const statusCheck = await legacyConnection.getSignatureStatus(signature, {
            searchTransactionHistory: true,
          })

          if (statusCheck?.value?.confirmationStatus === 'confirmed' || statusCheck?.value?.confirmationStatus === 'finalized') {
            return {
              confirmed: true,
              status: statusCheck.value.confirmationStatus,
              slot: statusCheck.value.slot,
            }
          }

          // Check if transaction failed permanently
          if (statusCheck?.value?.err) {
            logger.warn('Transaction failed on-chain', {
              signature,
              error: statusCheck.value.err,
              slot: statusCheck.value.slot,
            })
            return {
              confirmed: false,
              status: 'failed',
              slot: statusCheck.value.slot,
            }
          }

          // Wait before next poll
          await new Promise((resolve) => setTimeout(resolve, pollInterval))
          pollCount++

          // Log progress for longer waits
          if (pollCount % 10 === 0) {
            logger.info('Transaction still pending - network may be congested', {
              signature,
              waitTime: `${pollCount} seconds`,
              remainingTime: `${maxPolls - pollCount} seconds`,
              advice: 'Transaction is queued - higher priority fees process faster',
            })
          }
        }

        return { confirmed: false, status: 'timeout' }
      }

      // Kit confirmation with network-adaptive timeout
      const kitConfirmation = async (): Promise<{ confirmed: boolean; method: string }> => {
        try {
          // Shorter timeout for Kit confirmation as it's less reliable during congestion
          const kitTimeout = dynamicPriorityFee >= 100_000 ? 10_000 : 8_000

          await Promise.race([
            legacyConnection.confirmTransaction(
              {
                signature,
                blockhash,
                lastValidBlockHeight: Number(lastValidBlockHeight),
              },
              'confirmed'
            ),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Kit confirmation timeout')), kitTimeout)),
          ])
          return { confirmed: true, method: 'kit' }
        } catch {
          return { confirmed: false, method: 'kit_timeout' }
        }
      }

      // Use Promise.race for fastest confirmation detection
      const winner = await Promise.race([
        adaptivePolling().then((result) => ({ ...result, method: 'polling' })),
        kitConfirmation().then((result) => ({ ...result, method: 'kit' })),
      ])

      const confirmationTime = Date.now() - confirmationStart

      if (winner.confirmed) {
        logger.info(`Transaction confirmed via ${winner.method} (winner)`, {
          signature,
          confirmationTime,
          confirmationTimeMs: `${confirmationTime}ms`,
          confirmationStatus: 'status' in winner ? winner.status : 'confirmed',
          slot: 'slot' in winner ? winner.slot : undefined,
          method: winner.method,
          priorityFee: dynamicPriorityFee,
          networkPerformance: confirmationTime < 10000 ? 'excellent' : confirmationTime < 20000 ? 'good' : 'congested',
          improvement: 'Promise.race() for fastest detection',
        })
      } else if ('status' in winner && winner.status === 'failed') {
        // Transaction failed permanently - SOL will be returned except network fee
        const txError = new SolanaError(
          'Transaction failed on-chain. SOL has been returned to your wallet except for network fee (~0.000005 SOL)',
          SOLANA_ERROR_CODES.TRANSACTION_FAILED
        )
        logger.error('Transaction failed permanently', txError, {
          signature,
          slot: 'slot' in winner ? winner.slot : undefined,
          confirmationTime,
          solReturned: true,
          networkFeeDeducted: '~0.000005 SOL',
        })
        throw txError
      } else {
        // Winner timed out - transaction may still be pending
        logger.warn('Fastest confirmation method timed out - transaction may still be processing', {
          signature,
          confirmationTime,
          winner,
          nextStep: 'final_status_check',
        })

        const enhancedError = new SolanaError(
          'Transaction confirmation timed out - it may still be processing. Check the signature on Solana Explorer.',
          SOLANA_ERROR_CODES.FINALIZATION_TIMEOUT
        )
        throw enhancedError
      }
    } catch (error: unknown) {
      // Final fallback - one more status check
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
