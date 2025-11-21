import { Liquidity, Token, TokenAmount } from '@raydium-io/raydium-sdk'
import { Connection, PublicKey, Transaction, Signer } from '@solana/web3.js'
import { getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import BN from 'bn.js'
import { CreatePoolInput } from '@/lib/schemas/createLiquiditySchema'
import { getRaydiumConfig } from './config'
import getServerConfig from '@/lib/config/getServerConfig'

export async function createPoolTransaction(connection: Connection, walletPublicKey: PublicKey, params: CreatePoolInput) {
  const serverConfig = getServerConfig()
  const network = serverConfig.solanaNetwork === 'mainnet-beta' ? 'mainnet-beta' : 'devnet'
  const { ammProgramId, openBookProgramId, feeDestinationId } = getRaydiumConfig(network)

  const { marketId, baseMint: baseMintStr, quoteMint: quoteMintStr, baseAmount, quoteAmount, startTime } = params

  const marketIdPubkey = new PublicKey(marketId)
  const baseMint = new PublicKey(baseMintStr)
  const quoteMint = new PublicKey(quoteMintStr)

  // 1. Fetch Mint Info to get decimals
  const [baseMintInfo, quoteMintInfo] = await Promise.all([getMint(connection, baseMint), getMint(connection, quoteMint)])

  const baseToken = new Token(TOKEN_PROGRAM_ID, baseMint, baseMintInfo.decimals)
  const quoteToken = new Token(TOKEN_PROGRAM_ID, quoteMint, quoteMintInfo.decimals)

  // 3. Prepare Amounts
  const baseAmountParsed = new TokenAmount(baseToken, baseAmount.toString())
  const quoteAmountParsed = new TokenAmount(quoteToken, quoteAmount.toString())
  const startTimeParsed = new BN(Math.floor((startTime?.getTime() || Date.now()) / 1000))

  // 4. Generate Instructions
  const { innerTransactions } = await Liquidity.makeCreatePoolV4InstructionV2Simple({
    connection,
    programId: ammProgramId,
    marketInfo: {
      marketId: marketIdPubkey,
      programId: openBookProgramId,
    },
    baseMintInfo: baseToken,
    quoteMintInfo: quoteToken,
    baseAmount: baseAmountParsed.raw,
    quoteAmount: quoteAmountParsed.raw,
    startTime: startTimeParsed,
    ownerInfo: {
      feePayer: walletPublicKey,
      wallet: walletPublicKey,
      tokenAccounts: [], // We'll let the SDK handle finding/creating accounts or assume they exist
      useSOLBalance: true, // Allow using SOL if quote is WSOL
    },
    associatedOnly: false,
    checkCreateATAOwner: true,
    makeTxVersion: 0,
    feeDestinationId,
  })

  // 5. Combine Instructions
  const transaction = new Transaction()
  const signers: Signer[] = []

  for (const innerTx of innerTransactions) {
    transaction.add(...innerTx.instructions)
    signers.push(...innerTx.signers)
  }

  transaction.feePayer = walletPublicKey
  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash

  return {
    transaction,
    signers,
  }
}
