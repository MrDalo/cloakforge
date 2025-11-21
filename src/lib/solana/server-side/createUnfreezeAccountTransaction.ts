import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { createThawAccountInstruction, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token'
import { addComputeBudgetInstructions, calculateDynamicPriorityFee, createConnectionPair } from '@/lib/solana'
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
  transaction: Transaction
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
    // Determine program ID
    let mintInfo
    let tokenProgramId = TOKEN_PROGRAM_ID

    try {
      mintInfo = await getMint(legacyConnection, mintAddress, 'confirmed', TOKEN_2022_PROGRAM_ID)
      tokenProgramId = TOKEN_2022_PROGRAM_ID
    } catch {
      try {
        mintInfo = await getMint(legacyConnection, mintAddress, 'confirmed', TOKEN_PROGRAM_ID)
        tokenProgramId = TOKEN_PROGRAM_ID
      } catch (error) {
        logger.error('Failed to get mint info', error, { mint: mintAddress.toString() })
        throw new AppError('TOKEN_NOT_FOUND', 'Token mint not found')
      }
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

    const transaction = new Transaction()
    const { blockhash } = await legacyConnection.getLatestBlockhash('confirmed')
    transaction.recentBlockhash = blockhash
    transaction.feePayer = walletPublicKey

    addComputeBudgetInstructions(transaction, 200_000, dynamicPriorityFee)

    transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.UNFREEZE_ACCOUNTS))

    if (totalServiceFeeSOL > 0) {
      const serviceFeeWallet = new PublicKey(serverConfig.feeWalletAddress)
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: serviceFeeWallet,
          lamports: Math.floor(totalServiceFeeSOL * LAMPORTS_PER_SOL),
        })
      )
    }

    transaction.add(createThawAccountInstruction(tokenAccount, mintAddress, walletPublicKey, [], tokenProgramId))

    if (transaction.instructions.length === 0) {
      throw new AppError('INVALID_INPUT', 'Transaction has no instructions')
    }

    try {
      transaction.serialize({ requireAllSignatures: false })
    } catch {
      throw new AppError('TRANSACTION_FAILED', 'Transaction preparation failed')
    }

    return { transaction }
  } catch (error: unknown) {
    logger.error('Failed to create unfreeze account transaction', error)
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare unfreeze account transaction')
  }
}
