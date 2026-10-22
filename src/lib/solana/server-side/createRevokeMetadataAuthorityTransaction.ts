/**
 * Revoke Metadata Authority Transaction Utility
 *
 * Creates transaction for revoking the on-chain metadata update authority of a
 * Token-2022 token (SPL Token-2022 metadata-pointer extension — metadata stored
 * directly in the mint account, NOT classic Metaplex mpl-token-metadata).
 * Follows the established architecture pattern from createRevokeMintAuthorityTransaction.ts.
 */

import 'server-only'

import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, type TransactionInstruction } from '@solana/web3.js'
import { ExtensionType, TOKEN_2022_PROGRAM_ID, getExtensionData, getMetadataPointerState, type Mint } from '@solana/spl-token'
import { unpack as unpackTokenMetadata, type TokenMetadata } from '@solana/spl-token-metadata'
import { address, createNoopSigner } from '@solana/kit'
import { AuthorityType, getSetAuthorityInstruction, getUpdateTokenMetadataUpdateAuthorityInstruction } from '@solana-program/token-2022'
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
import { decodeMintAccount } from './getMintAccountInfo'

export interface CreateRevokeMetadataAuthorityTransactionParams {
  walletPublicKey: PublicKey
  tokenPublicKey: PublicKey
  /** Optional discount coupon code to apply to the service fee */
  couponCode?: string
}

export interface CreateRevokeMetadataAuthorityTransactionResult {
  transaction: Transaction
}

/** Which metadata authorities the wallet holds on-chain, and so which ones the transaction revokes. */
interface MetadataAuthorityRevocations {
  /** The wallet is the TokenMetadata update authority (name, symbol, URI). */
  updateAuthority: boolean
  /** The wallet is the MetadataPointer authority (which account wallets read metadata from). */
  metadataPointerAuthority: boolean
}

/**
 * Reads the TokenMetadata extension stored inside a decoded Token-2022 mint (no RPC call).
 *
 * @param mint - Decoded mint, including its TLV data.
 * @returns The metadata, or null when the mint has no TokenMetadata extension.
 * @throws AppError TOKEN_NOT_FOUND when the extension is present but cannot be decoded.
 */
function readEmbeddedTokenMetadata(mint: Mint): TokenMetadata | null {
  const data = getExtensionData(ExtensionType.TokenMetadata, mint.tlvData)
  if (!data) {
    return null
  }
  try {
    return unpackTokenMetadata(data)
  } catch {
    throw new AppError('TOKEN_NOT_FOUND', 'Failed to retrieve token metadata')
  }
}

/**
 * Decides which metadata authorities to revoke, from on-chain state only. Fails closed: every
 * authority that is still set must be held by the wallet, because revoking only one of them would
 * charge the fee and leave the metadata editable or redirectable by another account. Authorities
 * that are already revoked are skipped.
 *
 * @param mint - Decoded Token-2022 mint.
 * @param wallet - The requesting wallet.
 * @returns The authorities the wallet holds (all of those still set).
 * @throws AppError INVALID_INPUT when the mint has no embedded metadata, UNAUTHORIZED (403) when no
 *   authority is set or any still-set authority is held by another account.
 */
export function resolveMetadataAuthorityRevocations(mint: Mint, wallet: PublicKey): MetadataAuthorityRevocations {
  const metadata = readEmbeddedTokenMetadata(mint)
  if (!metadata) {
    throw new AppError('INVALID_INPUT', 'This token has no Token-2022 on-chain metadata to make immutable.')
  }

  const updateAuthority = metadata.updateAuthority ?? null
  const pointerAuthority = getMetadataPointerState(mint)?.authority ?? null

  if (!updateAuthority && !pointerAuthority) {
    throw new AppError('UNAUTHORIZED', 'This token has no update authority — its metadata is already immutable.', 403)
  }

  const foreignAuthorities: string[] = []
  if (updateAuthority && !updateAuthority.equals(wallet)) {
    foreignAuthorities.push('metadata update authority')
  }
  if (pointerAuthority && !pointerAuthority.equals(wallet)) {
    foreignAuthorities.push('metadata pointer authority')
  }

  if (foreignAuthorities.length > 0) {
    const holdsAny = Boolean(updateAuthority?.equals(wallet) || pointerAuthority?.equals(wallet))
    throw new AppError(
      'UNAUTHORIZED',
      holdsAny
        ? `The ${foreignAuthorities.join(' and ')} of this token is held by another account. Revoking only part of the metadata authorities would leave the metadata editable or redirectable, so nothing was prepared and no fee was charged.`
        : 'You are not the metadata update authority for this token. Only the current update authority can revoke it.',
      403
    )
  }

  return {
    updateAuthority: updateAuthority !== null,
    metadataPointerAuthority: pointerAuthority !== null,
  }
}

/**
 * Builds the instructions that revoke the metadata authorities the wallet holds: the TokenMetadata
 * update authority (makes name, symbol and URI immutable) and the MetadataPointer authority (which
 * could otherwise redirect wallets to different metadata). Kit-native builders, converted to legacy
 * TransactionInstructions; NoopSigner marks the wallet as the required signer.
 *
 * @param tokenPublicKey - Token-2022 mint (it also holds the metadata).
 * @param walletPublicKey - The current authority.
 * @param revocations - Which authorities to revoke.
 * @returns Revocation instructions (one or two).
 */
function buildMetadataAuthorityRevocationInstructions(
  tokenPublicKey: PublicKey,
  walletPublicKey: PublicKey,
  revocations: MetadataAuthorityRevocations
): TransactionInstruction[] {
  const mintAddress = address(tokenPublicKey.toString())
  const walletSigner = createNoopSigner(address(walletPublicKey.toString()))
  const programConfig = { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
  const instructions: TransactionInstruction[] = []

  if (revocations.updateAuthority) {
    instructions.push(
      kitInstructionToWeb3Instruction(
        getUpdateTokenMetadataUpdateAuthorityInstruction(
          { metadata: mintAddress, updateAuthority: walletSigner, newUpdateAuthority: null },
          programConfig
        )
      )
    )
  }
  if (revocations.metadataPointerAuthority) {
    instructions.push(
      kitInstructionToWeb3Instruction(
        getSetAuthorityInstruction(
          { owned: mintAddress, owner: walletSigner, authorityType: AuthorityType.MetadataPointer, newAuthority: null },
          programConfig
        )
      )
    )
  }
  return instructions
}

/**
 * Creates a revoke metadata authority transaction for Token-2022 tokens.
 * Revokes the TokenMetadata update authority and the MetadataPointer authority — every one still
 * set, all of which the wallet must hold on-chain — so the metadata can neither be edited nor redirected.
 * This function constructs the transaction but does not send it.
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

    // Read the update authority (TokenMetadata extension) and the MetadataPointer authority from the
    // mint fetched above, so both decisions use the same on-chain state
    const { mint } = decodeMintAccount(tokenPublicKey, accountInfo)
    const revocations = resolveMetadataAuthorityRevocations(mint, walletPublicKey)

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

    // 3. Revoke the metadata authorities the wallet holds (update authority and/or MetadataPointer authority)
    transaction.add(...buildMetadataAuthorityRevocationInstructions(tokenPublicKey, walletPublicKey, revocations))

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
