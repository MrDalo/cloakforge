import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
  ComputeBudgetProgram,
} from '@solana/web3.js'
import { createThawAccountInstruction, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token'
import { calculateDynamicPriorityFee, createConnectionPair } from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import 'server-only'

export interface CreateUnfreezeAccountTransactionParams {
  walletPublicKey: PublicKey
  tokenAccount: PublicKey
  mintAddress: PublicKey
}

export interface CreateUnfreezeAccountTransactionResult {
  transaction: VersionedTransaction
}

export async function createUnfreezeAccountTransaction(
  params: CreateUnfreezeAccountTransactionParams
): Promise<CreateUnfreezeAccountTransactionResult> {
  const { walletPublicKey, tokenAccount, mintAddress } = params

  const serverConfig = getServerConfig()
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'unfreeze-accounts',
    function: 'createUnfreezeAccountTransaction',
    wallet: walletPublicKey.toString(),
    tokenAccount: tokenAccount.toString(),
    mint: mintAddress.toString(),
    rpcEndpoint: serverConfig.rpcPrivateEndpoint,
  })

  try {
    // First, get account info to determine the program ID
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

    // Now fetch the mint info with the correct program ID
    let mintInfo
    try {
      mintInfo = await getMint(legacyConnection, mintAddress, 'confirmed', tokenProgramId)
    } catch (error) {
      logger.error('Failed to get mint info', error, {
        mint: mintAddress.toString(),
        programId: tokenProgramId.toString(),
      })

      // Check for TokenInvalidMintError (indicates address is not a mint)
      if (error instanceof Error && (error.name === 'TokenInvalidMintError' || error.message.includes('Invalid mint'))) {
        throw new AppError(
          'INVALID_INPUT',
          'The provided address is not a valid Token Mint. You may have provided a Token Account address instead.'
        )
      }

      throw new AppError('TOKEN_NOT_FOUND', 'Failed to retrieve mint information')
    }

    // Validate authority
    if (!mintInfo.freezeAuthority) {
      throw new AppError('UNAUTHORIZED', 'This token has no freeze authority.')
    }

    if (!mintInfo.freezeAuthority.equals(walletPublicKey)) {
      throw new AppError('UNAUTHORIZED', 'You are not the freeze authority for this token.')
    }

    // Calculate fees
    let totalServiceFeeSOL = 0
    try {
      const toolConfig = await getCachedToolConfig('unfreeze-accounts')
      if (toolConfig) {
        totalServiceFeeSOL += toolConfig.baseFee
      }
    } catch (error) {
      logger.warn('Failed to get tool config', { error: String(error) })
      totalServiceFeeSOL += 0.1
    }

    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch {
      dynamicPriorityFee = 1000
    }

    const instructions: TransactionInstruction[] = []

    // Add compute budget instructions
    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 200_000,
      })
    )
    instructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: dynamicPriorityFee,
      })
    )

    instructions.push(createServiceMemoInstruction(SERVICE_IDENTIFIERS.UNFREEZE_ACCOUNTS))

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

    instructions.push(createThawAccountInstruction(tokenAccount, mintAddress, walletPublicKey, [], tokenProgramId))

    if (instructions.length === 0) {
      throw new AppError('INVALID_INPUT', 'Transaction has no instructions')
    }

    const { blockhash } = await legacyConnection.getLatestBlockhash('confirmed')

    const messageV0 = new TransactionMessage({
      payerKey: walletPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message()

    const transaction = new VersionedTransaction(messageV0)

    return { transaction }
  } catch (error: unknown) {
    logger.error('Failed to create unfreeze account transaction', error)
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare unfreeze account transaction')
  }
}
