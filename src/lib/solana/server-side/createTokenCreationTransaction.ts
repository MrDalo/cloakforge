/**
 * Token Creation Utility
 *
 * Professional SPL Token 2022 creation with embedded metadata using Token Extensions.
 * Follows the established architecture pattern from createTokenWithSolanaKit.ts.
 * Uses SPL Token Extensions (TOKEN_2022) for advanced metadata capabilities.
 * Uses versioned transactions to handle transaction size limits efficiently.
 */

import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddress, getMintLen, ExtensionType } from '@solana/spl-token'
import { address, createNoopSigner } from '@solana/kit'
import {
  getInitializeMintInstruction,
  getCreateAssociatedTokenIdempotentInstruction,
  getMintToInstruction,
  getSetAuthorityInstruction,
  AuthorityType,
} from '@solana-program/token'
import {
  getInitializeMetadataPointerInstruction,
  getInitializeTokenMetadataInstruction,
  getUpdateTokenMetadataFieldInstruction,
  getUpdateTokenMetadataUpdateAuthorityInstruction,
} from '@solana-program/token-2022'
import {
  addComputeBudgetInstructions,
  calculateDynamicPriorityFee,
  createConnectionPair,
  kitInstructionToWeb3Instruction,
} from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { toolFeeConfigs } from '@/lib/utils/feeConfigs'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import { applyCouponToServiceFee } from './discountedServiceFee'
import { resolveToolBaseFee } from './defaultToolFees'
import type { CreateTokenTransactionParams, CreateTokenTransactionResult } from '@/types/tokenCreator'
import 'server-only'

/** Minimal on-chain metadata shape used by Token-2022's metadata-pointer extension. */
interface TokenMetadata {
  mint: PublicKey
  name: string
  symbol: string
  uri: string
  additionalMetadata: [string, string][]
}

/**
 * Creates a token creation transaction for SPL tokens
 * This function constructs the transaction but does not send it
 *
 * @param params - Token creation parameters
 * @returns Promise<CreateTokenTransactionResult>
 */
export async function createTokenCreationTransaction(params: CreateTokenTransactionParams): Promise<CreateTokenTransactionResult> {
  const { walletPublicKey, mintPublicKey, tokenData, metadataUri, couponCode } = params

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
    // Calculate service fees based on selected options
    // Base service fee from tool configuration (hard-coded minimum if config is unavailable)
    let totalServiceFeeSOL = await resolveToolBaseFee('token-creator')

    // Apply discount coupon to the base fee only, before option add-ons (checks availability server-side;
    // nothing is consumed until the transaction confirms on-chain with the coupon memo)
    const { feeSOL: discountedBaseFeeSOL, couponInstructions } = await applyCouponToServiceFee(
      totalServiceFeeSOL,
      couponCode,
      walletPublicKey
    )
    totalServiceFeeSOL = discountedBaseFeeSOL

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

    // Get dynamic priority fee using modern Kit RPC with automatic fallback (following createTokenWithSolanaKit pattern)
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch (error) {
      logger.warn('Failed to calculate dynamic priority fee, using static fee - tokenCreation', undefined, { error: String(error) })
      // Fallback to static priority fee if dynamic calculation fails
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

    // Coupon memo + 0-lamport marker transfer, always both (the usage counter scans the coupon's
    // marker history for the memo): the use is counted once this transaction confirms
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

    // 4. Initialize MetadataPointer extension (pointing to the mint itself) — kit-native builder,
    // converted to a legacy TransactionInstruction (see kitInstructionToWeb3Instruction)
    if (metadata) {
      transaction.add(
        kitInstructionToWeb3Instruction(
          getInitializeMetadataPointerInstruction({
            mint: address(mintPublicKey.toString()),
            authority: address(walletPublicKey.toString()),
            metadataAddress: address(mintPublicKey.toString()), // point to self
          })
        )
      )
    }

    // 5. Initialize mint with authority settings — kit-native builder
    // IMPORTANT: Always initialize with authorities set, then revoke them later if requested
    // Setting authorities to null during initialization creates invalid instruction sequences
    transaction.add(
      kitInstructionToWeb3Instruction(
        getInitializeMintInstruction(
          {
            mint: address(mintPublicKey.toString()),
            decimals: tokenData.decimals,
            mintAuthority: address(walletPublicKey.toString()), // will be revoked later if requested
            freezeAuthority: address(walletPublicKey.toString()), // will be revoked later if requested
          },
          { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
        )
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

      // Initialize metadata inside the mint — kit-native builder. mintAuthority must be a
      // TransactionSigner even though real signing happens client-side (see NoopSigner note below).
      const mintAuthoritySigner = createNoopSigner(address(walletPublicKey.toString()))
      transaction.add(
        kitInstructionToWeb3Instruction(
          getInitializeTokenMetadataInstruction(
            {
              metadata: address(mintPublicKey.toString()), // metadata address is the mint itself
              updateAuthority: address(walletPublicKey.toString()),
              mint: address(mintPublicKey.toString()),
              mintAuthority: mintAuthoritySigner,
              name: metadata.name,
              symbol: metadata.symbol,
              uri: metadata.uri,
            },
            { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
          )
        )
      )

      // Add additional metadata fields — kit-native builder
      for (const [key, value] of metadata.additionalMetadata) {
        transaction.add(
          kitInstructionToWeb3Instruction(
            getUpdateTokenMetadataFieldInstruction(
              {
                metadata: address(mintPublicKey.toString()),
                updateAuthority: createNoopSigner(address(walletPublicKey.toString())),
                field: { __kind: 'Key', fields: [key] },
                value,
              },
              { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
            )
          )
        )
      }
    }

    // 7. Create associated token account — kit-native builder (idempotent variant; the mint was
    // just created above so the ATA is guaranteed not to exist yet, and idempotent's discriminator
    // byte is the one verified byte-for-byte identical to @solana/spl-token's own idempotent
    // instruction — see kitInstructionEquivalence.test.ts). Payer must be a TransactionSigner even
    // though real signing happens client-side (see NoopSigner note above).
    transaction.add(
      kitInstructionToWeb3Instruction(
        getCreateAssociatedTokenIdempotentInstruction({
          payer: createNoopSigner(address(walletPublicKey.toString())), // payer
          ata: address(associatedTokenAccountAddress.toString()),
          owner: address(walletPublicKey.toString()), // owner
          mint: address(mintPublicKey.toString()),
          tokenProgram: address(TOKEN_2022_PROGRAM_ID.toString()),
        })
      )
    )

    // 8. Mint initial supply to associated token account — kit-native builder
    if (rawSupply > BigInt(0)) {
      transaction.add(
        kitInstructionToWeb3Instruction(
          getMintToInstruction(
            {
              mint: address(mintPublicKey.toString()),
              token: address(associatedTokenAccountAddress.toString()),
              mintAuthority: createNoopSigner(address(walletPublicKey.toString())),
              amount: rawSupply,
            },
            { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
          )
        )
      )
    }

    // 9. Handle authority revocations based on form data — kit-native builder
    if (tokenData.revokeMintAuthority) {
      transaction.add(
        kitInstructionToWeb3Instruction(
          getSetAuthorityInstruction(
            {
              owned: address(mintPublicKey.toString()), // mint
              owner: createNoopSigner(address(walletPublicKey.toString())), // current authority
              authorityType: AuthorityType.MintTokens,
              newAuthority: null, // revoke
            },
            { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
          )
        )
      )
    }

    // Handle freeze authority revocation — kit-native builder
    if (tokenData.revokeFreezeAuthority) {
      transaction.add(
        kitInstructionToWeb3Instruction(
          getSetAuthorityInstruction(
            {
              owned: address(mintPublicKey.toString()), // mint
              owner: createNoopSigner(address(walletPublicKey.toString())), // current authority
              authorityType: AuthorityType.FreezeAccount,
              newAuthority: null, // revoke
            },
            { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
          )
        )
      )
    }

    // If immutable metadata is requested, revoke the metadata update authority — kit-native builder
    if (tokenData.immutableMetadata && metadata) {
      transaction.add(
        kitInstructionToWeb3Instruction(
          getUpdateTokenMetadataUpdateAuthorityInstruction(
            {
              metadata: address(mintPublicKey.toString()), // metadata address is the mint itself
              updateAuthority: createNoopSigner(address(walletPublicKey.toString())),
              newUpdateAuthority: null, // makes metadata immutable
            },
            { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
          )
        )
      )
    }

    // Don't sign the transaction server-side - let the client handle all signing
    // This ensures proper signature handling across serialization/deserialization

    // Validate transaction before returning
    if (transaction.instructions.length === 0) {
      throw new AppError('INVALID_INPUT', 'Transaction has no instructions')
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
        throw new AppError(
          'TRANSACTION_FAILED',
          'Token creation transaction exceeds Solana size limits. Try reducing the description length or creating the token without some optional features.'
        )
      }
      throw sizeError
    }

    const result: CreateTokenTransactionResult = {
      transaction,
      mintPublicKey: mintPublicKey.toString(),
      tokenAccountAddress: associatedTokenAccountAddress.toString(),
      totalSupply: rawSupply.toString(),
    }

    return result
  } catch (error: unknown) {
    logger.error('Failed to create token creation transaction', error, {
      wallet: walletPublicKey.toString(),
    })

    // Re-throw AppError instances first, so their messages (e.g. coupon errors) are not remapped below
    if (error instanceof AppError) {
      throw error
    }

    // Handle specific Solana errors
    if (error instanceof Error) {
      if (error.message.includes('insufficient')) {
        throw new AppError('INSUFFICIENT_FUNDS', 'Insufficient funds for token creation')
      }
      if (error.message.includes('invalid')) {
        throw new AppError('INVALID_INPUT', 'Invalid token creation parameters')
      }
    }

    // Generic error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare token creation transaction')
  }
}
