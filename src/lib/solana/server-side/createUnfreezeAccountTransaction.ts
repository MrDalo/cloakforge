import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
  ComputeBudgetProgram,
} from '@solana/web3.js'
import {
  createThawAccountInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getAssociatedTokenAddressSync,
  getAccount,
  TokenAccountNotFoundError,
} from '@solana/spl-token'
import { calculateDynamicPriorityFee, createConnectionPair } from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import 'server-only'

// Maximum wallets to unfreeze in a single transaction (to avoid tx size limits)
const MAX_WALLETS_PER_TRANSACTION = 10

export interface CreateBatchUnfreezeTransactionParams {
  walletPublicKey: PublicKey
  targetWallets: PublicKey[]
  mintAddress: PublicKey
}

export interface CreateBatchUnfreezeTransactionResult {
  transaction: VersionedTransaction
  unfrozenWallets: string[]
  derivedTokenAccounts: string[]
}

/**
 * Creates a batch unfreeze transaction for multiple wallet addresses
 * Derives ATAs from wallet addresses and batches unfreeze instructions
 */
export async function createBatchUnfreezeTransaction(
  params: CreateBatchUnfreezeTransactionParams
): Promise<CreateBatchUnfreezeTransactionResult> {
  const { walletPublicKey, targetWallets, mintAddress } = params

  const serverConfig = getServerConfig()
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'unfreeze-accounts',
    function: 'createBatchUnfreezeTransaction',
    wallet: walletPublicKey.toString(),
    targetWalletCount: targetWallets.length,
    mint: mintAddress.toString(),
  })

  try {
    // Validate wallet count
    if (targetWallets.length === 0) {
      throw new AppError('INVALID_INPUT', 'At least one wallet address is required')
    }

    if (targetWallets.length > MAX_WALLETS_PER_TRANSACTION) {
      throw new AppError(
        'INVALID_INPUT',
        `Maximum ${MAX_WALLETS_PER_TRANSACTION} wallets can be unfrozen in a single transaction. You provided ${targetWallets.length}.`
      )
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

    // Derive ATAs for all target wallets and verify they exist and are frozen
    const derivedAccounts: { wallet: PublicKey; tokenAccount: PublicKey }[] = []
    const skippedWallets: string[] = []

    for (const targetWallet of targetWallets) {
      // Derive the ATA for this wallet + mint combination
      const tokenAccount = getAssociatedTokenAddressSync(mintAddress, targetWallet, false, tokenProgramId)

      // Verify the token account exists
      try {
        const accountData = await getAccount(legacyConnection, tokenAccount, 'confirmed', tokenProgramId)

        // Check if already unfrozen (not frozen)
        if (!accountData.isFrozen) {
          logger.warn('Token account already unfrozen, skipping', {
            wallet: targetWallet.toString(),
            tokenAccount: tokenAccount.toString(),
          })
          skippedWallets.push(targetWallet.toString())
          continue
        }

        derivedAccounts.push({ wallet: targetWallet, tokenAccount })
      } catch (error) {
        if (error instanceof TokenAccountNotFoundError) {
          logger.warn('Token account does not exist for wallet, skipping', {
            wallet: targetWallet.toString(),
            derivedATA: tokenAccount.toString(),
          })
          skippedWallets.push(targetWallet.toString())
          continue
        }
        throw error
      }
    }

    if (derivedAccounts.length === 0) {
      throw new AppError(
        'INVALID_INPUT',
        'No valid frozen token accounts found for the provided wallet addresses. Make sure the wallets hold this token and their accounts are frozen.'
      )
    }

    logger.info('Derived token accounts for unfreeze', {
      validAccounts: derivedAccounts.length,
      skippedWallets: skippedWallets.length,
    })

    // Calculate fees - service fee is per wallet
    let serviceFeePerWallet = 0
    try {
      const toolConfig = await getCachedToolConfig('unfreeze-accounts')
      if (toolConfig) {
        serviceFeePerWallet = toolConfig.baseFee
      }
    } catch (error) {
      logger.warn('Failed to get tool config', { error: String(error) })
      serviceFeePerWallet = 0.01 // Fallback
    }

    const totalServiceFeeSOL = serviceFeePerWallet * derivedAccounts.length

    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch {
      dynamicPriorityFee = 1000
    }

    // Build instructions
    const instructions: TransactionInstruction[] = []

    // Compute budget - scale with number of accounts
    const computeUnits = 50_000 + derivedAccounts.length * 10_000
    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: Math.min(computeUnits, 400_000),
      })
    )
    instructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: dynamicPriorityFee,
      })
    )

    // Service memo
    instructions.push(createServiceMemoInstruction(SERVICE_IDENTIFIERS.UNFREEZE_ACCOUNTS))

    // Service fee transfer (if applicable)
    if (totalServiceFeeSOL > 0) {
      const serviceFeeWallet = new PublicKey(serverConfig.feeWalletAddress)
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: serviceFeeWallet,
          lamports: Math.floor(totalServiceFeeSOL * LAMPORTS_PER_SOL),
        })
      )
    }

    // Add unfreeze (thaw) instruction for each derived token account
    for (const { tokenAccount } of derivedAccounts) {
      instructions.push(createThawAccountInstruction(tokenAccount, mintAddress, walletPublicKey, [], tokenProgramId))
    }

    // Get blockhash and build transaction
    const { blockhash } = await legacyConnection.getLatestBlockhash('confirmed')

    const messageV0 = new TransactionMessage({
      payerKey: walletPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message()

    const transaction = new VersionedTransaction(messageV0)

    logger.info('Batch unfreeze transaction created', {
      instructionCount: instructions.length,
      accountsToUnfreeze: derivedAccounts.length,
      totalServiceFee: totalServiceFeeSOL,
    })

    return {
      transaction,
      unfrozenWallets: derivedAccounts.map((a) => a.wallet.toString()),
      derivedTokenAccounts: derivedAccounts.map((a) => a.tokenAccount.toString()),
    }
  } catch (error: unknown) {
    logger.error('Failed to create batch unfreeze transaction', error)
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare batch unfreeze transaction')
  }
}
