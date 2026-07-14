import {
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  TransactionMessage,
  type TransactionInstruction,
} from '@solana/web3.js'
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
} from '@solana/spl-token'
import { addComputeBudgetInstructionsVersioned, calculateDynamicPriorityFee, createConnectionPair } from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import 'server-only'

export interface CreateDonationTransactionParams {
  walletPublicKey: PublicKey
  tokenMintAddress?: PublicKey // Optional, if undefined it's SOL
  amount: number
}

export interface CreateDonationTransactionResult {
  transaction: VersionedTransaction
  blockhash: string
  lastValidBlockHeight: number
}

/**
 * Builds a single unsigned donation transaction transferring SOL or an SPL token
 * from the connected wallet directly to the platform treasury wallet. Donations
 * carry no separate service fee — the donated amount is the payment.
 *
 * @param params - Wallet, donated amount, and optional SPL token mint.
 * @returns Prepared versioned transaction with blockhash metadata.
 */
export async function createDonationTransaction(params: CreateDonationTransactionParams): Promise<CreateDonationTransactionResult> {
  const { walletPublicKey, tokenMintAddress, amount } = params

  const serverConfig = getServerConfig()
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'donation',
    function: 'createDonationTransaction',
    wallet: walletPublicKey.toString(),
    mint: tokenMintAddress?.toString() || 'SOL',
  })

  if (!serverConfig.feeWalletAddress) {
    logger.error('Donation treasury wallet is not configured')
    throw new AppError('TRANSACTION_FAILED', 'Donations are temporarily unavailable')
  }

  try {
    const treasuryWallet = new PublicKey(serverConfig.feeWalletAddress)

    // 1. Determine Token Program (if SPL) and read decimals from the mint itself —
    // decimals must never be trusted from the client, since it directly scales the transfer amount
    let tokenProgramId = TOKEN_PROGRAM_ID
    let mintDecimals = 9
    if (tokenMintAddress) {
      try {
        const mintInfo = await getMint(legacyConnection, tokenMintAddress, 'confirmed', TOKEN_2022_PROGRAM_ID)
        tokenProgramId = TOKEN_2022_PROGRAM_ID
        mintDecimals = mintInfo.decimals
      } catch {
        try {
          const mintInfo = await getMint(legacyConnection, tokenMintAddress, 'confirmed', TOKEN_PROGRAM_ID)
          tokenProgramId = TOKEN_PROGRAM_ID
          mintDecimals = mintInfo.decimals
        } catch (error) {
          logger.error('Failed to get mint info', error, { mint: tokenMintAddress.toString() })
          throw new AppError('TOKEN_NOT_FOUND', 'Token mint not found')
        }
      }
    }

    // 2. Calculate Priority Fee
    let dynamicPriorityFee: number
    try {
      dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger)
    } catch {
      dynamicPriorityFee = 1000
    }

    // 3. Get Blockhash
    const { blockhash, lastValidBlockHeight } = await legacyConnection.getLatestBlockhash('confirmed')

    const instructions: TransactionInstruction[] = []

    // SOL: simple transfer, ~10K CU. SPL: create-ATA + transfer, higher for Token-2022 (transfer hooks).
    const computeUnitLimit = tokenMintAddress ? (tokenProgramId === TOKEN_2022_PROGRAM_ID ? 200_000 : 110_000) : 30_000

    addComputeBudgetInstructionsVersioned(instructions, computeUnitLimit, dynamicPriorityFee)

    instructions.push(createServiceMemoInstruction(SERVICE_IDENTIFIERS.DONATION))

    if (tokenMintAddress) {
      const amountBigInt = BigInt(Math.round(amount * Math.pow(10, mintDecimals)))

      const sourceATA = await getAssociatedTokenAddress(tokenMintAddress, walletPublicKey, false, tokenProgramId)
      const destATA = await getAssociatedTokenAddress(tokenMintAddress, treasuryWallet, false, tokenProgramId)

      instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(walletPublicKey, destATA, treasuryWallet, tokenMintAddress, tokenProgramId)
      )

      instructions.push(createTransferInstruction(sourceATA, destATA, walletPublicKey, amountBigInt, [], tokenProgramId))
    } else {
      const amountLamports = Math.floor(amount * LAMPORTS_PER_SOL)
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: treasuryWallet,
          lamports: amountLamports,
        })
      )
    }

    const messageV0 = new TransactionMessage({
      payerKey: walletPublicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message()

    const transaction = new VersionedTransaction(messageV0)

    return { transaction, blockhash, lastValidBlockHeight }
  } catch (error: unknown) {
    logger.error('Failed to create donation transaction', error)
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare donation transaction')
  }
}
