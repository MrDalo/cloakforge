import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
  type TransactionInstruction,
} from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getAssociatedTokenAddressSync,
  getAccount,
  TokenAccountNotFoundError,
} from '@solana/spl-token'
import { address, createNoopSigner } from '@solana/kit'
import { getFreezeAccountInstruction } from '@solana-program/token'
import {
  addComputeBudgetInstructionsVersioned,
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

// Maximum wallets to freeze in a single transaction (to avoid tx size limits)
const MAX_WALLETS_PER_TRANSACTION = 10

export interface CreateBatchFreezeTransactionParams {
  walletPublicKey: PublicKey
  targetWallets: PublicKey[]
  mintAddress: PublicKey
  /** Optional discount coupon code to apply to the service fee */
  couponCode?: string
}

export interface CreateBatchFreezeTransactionResult {
  transactions: VersionedTransaction[]
  frozenWallets: string[]
  derivedTokenAccounts: string[]
  blockhash: string
  lastValidBlockHeight: number
}

/**
 * Creates batch freeze transactions for multiple wallet addresses
 * Derives ATAs from wallet addresses and batches freeze instructions
 * Returns an array of transactions if wallet count > MAX_WALLETS_PER_TRANSACTION
 *
 * @param params.walletPublicKey - The freeze authority's public key
 * @param params.targetWallets - Array of wallet addresses to freeze (ATAs derived server-side)
 * @param params.mintAddress - The token mint address
 * @returns Object containing the transactions array, frozen wallets, derived ATAs, blockhash, and lastValidBlockHeight
 */
export async function createBatchFreezeTransaction(
  params: CreateBatchFreezeTransactionParams
): Promise<CreateBatchFreezeTransactionResult> {
  const { walletPublicKey, targetWallets, mintAddress, couponCode } = params

  const serverConfig = getServerConfig()
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'freeze-wallets',
    function: 'createBatchFreezeTransaction',
    wallet: walletPublicKey.toString(),
    targetWalletCount: targetWallets.length,
    mint: mintAddress.toString(),
  })

  try {
    // Validate wallet count
    if (targetWallets.length === 0) {
      throw new AppError('INVALID_INPUT', 'At least one wallet address is required')
    }

    // Get mint account info to determine the program ID
    const accountInfo = await legacyConnection.getAccountInfo(mintAddress, 'confirmed')

    if (!accountInfo) {
      throw new AppError('TOKEN_NOT_FOUND', 'Token mint not found')
    }

    let tokenProgramId: PublicKey
    if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
      tokenProgramId = TOKEN_PROGRAM_ID
    } else if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      tokenProgramId = TOKEN_2022_PROGRAM_ID
    } else {
      logger.error('Token owned by unknown program', {
        mint: mintAddress.toString(),
        owner: accountInfo.owner.toString(),
      })
      throw new AppError('INVALID_INPUT', `Token is owned by an unknown program: ${accountInfo.owner.toString()}`)
    }

    // Fetch mint info to validate freeze authority
    let mintInfo
    try {
      mintInfo = await getMint(legacyConnection, mintAddress, 'confirmed', tokenProgramId)
    } catch (error) {
      logger.error('Failed to get mint info', error, {
        mint: mintAddress.toString(),
        programId: tokenProgramId.toString(),
      })

      if (error instanceof Error && (error.name === 'TokenInvalidMintError' || error.message.includes('Invalid mint'))) {
        throw new AppError(
          'INVALID_INPUT',
          'The provided address is not a valid Token Mint. You may have provided a Token Account address instead.'
        )
      }

      throw new AppError('TOKEN_NOT_FOUND', 'Failed to retrieve mint information')
    }

    // Validate freeze authority
    if (!mintInfo.freezeAuthority) {
      throw new AppError('UNAUTHORIZED', 'This token has no freeze authority. Freeze authority has been revoked.')
    }

    if (!mintInfo.freezeAuthority.equals(walletPublicKey)) {
      throw new AppError('UNAUTHORIZED', 'You are not the freeze authority for this token.')
    }

    // Derive ATAs for all target wallets and verify they exist
    const derivedAccounts: { wallet: PublicKey; tokenAccount: PublicKey }[] = []
    const skippedWallets: string[] = []

    for (const targetWallet of targetWallets) {
      // Derive the ATA for this wallet + mint combination
      const tokenAccount = getAssociatedTokenAddressSync(mintAddress, targetWallet, false, tokenProgramId)

      // Verify the token account exists
      try {
        const accountData = await getAccount(legacyConnection, tokenAccount, 'confirmed', tokenProgramId)

        // Check if already frozen
        if (accountData.isFrozen) {
          skippedWallets.push(targetWallet.toString())
          continue
        }

        derivedAccounts.push({ wallet: targetWallet, tokenAccount })
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError) {
          skippedWallets.push(targetWallet.toString())
          continue
        }
        throw error
      }
    }

    if (derivedAccounts.length === 0) {
      throw new AppError(
        'INVALID_INPUT',
        'No valid token accounts found for the provided wallet addresses. Make sure the wallets hold this token.'
      )
    }

    // Calculate fees - service fee is per wallet
    let serviceFeePerWallet = 0
    try {
      const toolConfig = await getCachedToolConfig('freeze-wallets')
      if (toolConfig) {
        serviceFeePerWallet = toolConfig.baseFee
      }
    } catch (error) {
      logger.error('Failed to get tool config', { error: String(error) })
      serviceFeePerWallet = 0.01 // Fallback
    }

    // Apply discount coupon to the per-wallet service fee (validates the coupon server-side)
    const { feeSOL: discountedFeePerWallet, couponMemoInstruction } = await applyCouponToServiceFee(serviceFeePerWallet, couponCode)
    serviceFeePerWallet = discountedFeePerWallet

    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch {
      dynamicPriorityFee = 1000
    }

    // Get blockhash once for all transactions (with lastValidBlockHeight for expiry-aware confirmation)
    const { blockhash, lastValidBlockHeight } = await legacyConnection.getLatestBlockhash('confirmed')

    const transactions: VersionedTransaction[] = []
    const frozenWallets: string[] = []
    const derivedTokenAccounts: string[] = []

    // Chunk the derived accounts and create transactions
    for (let i = 0; i < derivedAccounts.length; i += MAX_WALLETS_PER_TRANSACTION) {
      const chunk = derivedAccounts.slice(i, i + MAX_WALLETS_PER_TRANSACTION)

      // Calculate service fee for this chunk
      const chunkServiceFeeSOL = serviceFeePerWallet * chunk.length

      // Build instructions for this chunk
      const instructions: TransactionInstruction[] = []

      // Compute budget - differentiate Token-2022 vs standard SPL
      // Token-2022 freeze/thaw may trigger extensions (less complex than transfers with hooks)
      const cuPerWallet = tokenProgramId === TOKEN_2022_PROGRAM_ID ? 20_000 : 10_000
      const computeUnits = 50_000 + chunk.length * cuPerWallet
      addComputeBudgetInstructionsVersioned(instructions, Math.min(computeUnits, 400_000), dynamicPriorityFee)

      // Service memo
      instructions.push(createServiceMemoInstruction(SERVICE_IDENTIFIERS.FREEZE_WALLETS))

      // Coupon memo so the redeem endpoint can verify the coupon was used in this transaction
      if (couponMemoInstruction) {
        instructions.push(couponMemoInstruction)
      }

      // Service fee transfer for this chunk
      if (chunkServiceFeeSOL > 0) {
        const serviceFeeWallet = new PublicKey(serverConfig.feeWalletAddress)
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: serviceFeeWallet,
            lamports: Math.floor(chunkServiceFeeSOL * LAMPORTS_PER_SOL),
          })
        )
      }

      // Add freeze instruction for each derived token account in this chunk (kit-native builder,
      // converted to a legacy TransactionInstruction — see kitInstructionToWeb3Instruction)
      for (const { tokenAccount } of chunk) {
        instructions.push(
          kitInstructionToWeb3Instruction(
            getFreezeAccountInstruction(
              {
                account: address(tokenAccount.toString()),
                mint: address(mintAddress.toString()),
                owner: createNoopSigner(address(walletPublicKey.toString())),
              },
              { programAddress: address(tokenProgramId.toString()) }
            )
          )
        )
      }

      const messageV0 = new TransactionMessage({
        payerKey: walletPublicKey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message()

      const transaction = new VersionedTransaction(messageV0)
      transactions.push(transaction)

      // Accumulate results
      chunk.forEach((a) => {
        frozenWallets.push(a.wallet.toString())
        derivedTokenAccounts.push(a.tokenAccount.toString())
      })
    }

    return {
      transactions,
      frozenWallets,
      derivedTokenAccounts,
      blockhash,
      lastValidBlockHeight,
    }
  } catch (error: unknown) {
    logger.error('Failed to create batch freeze transaction', error)
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare batch freeze transaction')
  }
}
