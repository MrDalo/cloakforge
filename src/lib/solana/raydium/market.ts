import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { DexInstructions, MARKET_STATE_LAYOUT_V3 } from '@project-serum/serum'
import { getMint, TOKEN_PROGRAM_ID, createInitializeAccountInstruction } from '@solana/spl-token'
import BN from 'bn.js'
import { getLogger } from '@/lib/logger/logger'
import { CreateMarketInput } from '@/lib/schemas/createLiquiditySchema'
import { getRaydiumConfig } from './config'
import { calculateLotSizes } from './lotSizeHelper'
import getServerConfig from '@/lib/config/getServerConfig'

// Standard layouts for OpenBook markets
// Optimized for low cost (smaller queues)
const LOW_COST_LAYOUT = {
  eventQueueLength: 128,
  requestQueueLength: 63,
  orderbookLength: 201,
}

// Standard layouts (higher cost, higher throughput)
const STANDARD_LAYOUT = {
  eventQueueLength: 2978,
  requestQueueLength: 63,
  orderbookLength: 909,
}

export async function createMarketTransaction(
  connection: Connection,
  walletPublicKey: PublicKey,
  params: CreateMarketInput
) {
  const logger = getLogger({ context: 'raydium', service: 'create-market' })
  const serverConfig = getServerConfig()
  const network = serverConfig.solanaNetwork === 'mainnet-beta' ? 'mainnet-beta' : 'devnet'
  const { openBookProgramId } = getRaydiumConfig(network)

  try {
    const marketKeypair = Keypair.generate()
    const requestQueueKeypair = Keypair.generate()
    const eventQueueKeypair = Keypair.generate()
    const bidsKeypair = Keypair.generate()
    const asksKeypair = Keypair.generate()
    const baseVaultKeypair = Keypair.generate()
    const quoteVaultKeypair = Keypair.generate()

    const baseMint = new PublicKey(params.baseMint)
    const quoteMint = new PublicKey(params.quoteMint)

    // 1. Fetch Mint Info for Decimals
    const [baseMintInfo, quoteMintInfo] = await Promise.all([
      getMint(connection, baseMint),
      getMint(connection, quoteMint),
    ])

    // 2. Calculate Lot Sizes
    const { baseLotSize, quoteLotSize } = calculateLotSizes(
      baseMintInfo.decimals,
      quoteMintInfo.decimals,
      params.tickSize,
      params.lotSize
    )

    // 3. Determine Layout (Cost vs Performance)
    const layout = params.optimizeForLowCost ? LOW_COST_LAYOUT : STANDARD_LAYOUT

    // 4. Calculate Rent
    const [marketRent, requestQueueRent, eventQueueRent, bidsRent, asksRent, vaultRent] = await Promise.all([
      connection.getMinimumBalanceForRentExemption(MARKET_STATE_LAYOUT_V3.span),
      connection.getMinimumBalanceForRentExemption(layout.requestQueueLength),
      connection.getMinimumBalanceForRentExemption(layout.eventQueueLength),
      connection.getMinimumBalanceForRentExemption(layout.orderbookLength),
      connection.getMinimumBalanceForRentExemption(layout.orderbookLength),
      connection.getMinimumBalanceForRentExemption(165), // Token Account size
    ])

    const instructions: TransactionInstruction[] = []

    // Helper to create account
    const createAccount = (keypair: Keypair, space: number, lamports: number, programId: PublicKey) => {
      instructions.push(
        SystemProgram.createAccount({
          fromPubkey: walletPublicKey,
          newAccountPubkey: keypair.publicKey,
          lamports,
          space,
          programId,
        })
      )
    }

    // Create all accounts
    createAccount(marketKeypair, MARKET_STATE_LAYOUT_V3.span, marketRent, openBookProgramId)
    createAccount(requestQueueKeypair, layout.requestQueueLength, requestQueueRent, openBookProgramId)
    createAccount(eventQueueKeypair, layout.eventQueueLength, eventQueueRent, openBookProgramId)
    createAccount(bidsKeypair, layout.orderbookLength, bidsRent, openBookProgramId)
    createAccount(asksKeypair, layout.orderbookLength, asksRent, openBookProgramId)
    
    // Create Vaults (SPL Token Accounts owned by the Market PDA)
    const [vaultOwner, vaultSignerNonce] = await PublicKey.findProgramAddress(
      [marketKeypair.publicKey.toBuffer(), new BN(0).toArrayLike(Buffer, 'le', 8)],
      openBookProgramId
    )

    // Create Base Vault
    createAccount(baseVaultKeypair, 165, vaultRent, TOKEN_PROGRAM_ID)
    instructions.push(
      createInitializeAccountInstruction(
        baseVaultKeypair.publicKey,
        baseMint,
        vaultOwner
      )
    )

    // Create Quote Vault
    createAccount(quoteVaultKeypair, 165, vaultRent, TOKEN_PROGRAM_ID)
    instructions.push(
      createInitializeAccountInstruction(
        quoteVaultKeypair.publicKey,
        quoteMint,
        vaultOwner
      )
    )

    instructions.push(
      DexInstructions.initializeMarket({
        market: marketKeypair.publicKey,
        requestQueue: requestQueueKeypair.publicKey,
        eventQueue: eventQueueKeypair.publicKey,
        bids: bidsKeypair.publicKey,
        asks: asksKeypair.publicKey,
        baseVault: baseVaultKeypair.publicKey,
        quoteVault: quoteVaultKeypair.publicKey,
        baseMint,
        quoteMint,
        baseLotSize: new BN(baseLotSize),
        quoteLotSize: new BN(quoteLotSize),
        feeRateBps: 0, // Standard
        vaultSignerNonce: new BN(vaultSignerNonce),
        quoteDustThreshold: new BN(100), // Standard
        programId: openBookProgramId,
      })
    )

    return {
      transaction: new Transaction().add(...instructions),
      signers: [marketKeypair, requestQueueKeypair, eventQueueKeypair, bidsKeypair, asksKeypair, baseVaultKeypair, quoteVaultKeypair],
      marketId: marketKeypair.publicKey.toString(),
    }
  } catch (error) {
    logger.error('Failed to create market transaction', error)
    throw error
  }
}

