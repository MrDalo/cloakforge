/**
 * Rules for the Raydium liquidity provider transactions (pool creation and CLMM position opening).
 *
 * The Raydium program is the only trusted code, not its instruction: every Raydium instruction is decoded and
 * checked field by field against what the user entered. Creator/payer, mints, AMM config, pool, vaults,
 * LP/NFT accounts and the user's token accounts must be the addresses derived client-side
 * (raydiumPoolAddresses.ts); CPMM deposit amounts, the CLMM initial price (sqrt price), the position's ticks
 * and its deposit maximums must match the form (raydiumInstructionData.ts, raydiumPriceMath.ts). Around it,
 * SOL leaves the wallet only to the fee wallet and to the temporary wrapped-SOL account that funds the user's
 * SOL deposit, and token instructions only wrap, sync, move or close the wallet's own wrapped-SOL accounts
 * back to the wallet. Approve, SetAuthority and any other CloseAccount are rejected.
 */

import type { TransactionInstruction } from '@solana/web3.js'
import { parseTokenAmount } from '@/lib/solana'
import type { DecodedTokenInstruction } from './decodeTokenInstruction'
import type { AssociatedTokenAddressResolver, OperationRules } from './operationRules'
import { decodeClmmCreatePool, decodeClmmOpenPosition, decodeCpmmInitialize } from './raydiumInstructionData'
import {
  deriveClmmPoolAddresses,
  deriveClmmPositionAddresses,
  deriveCpmmPoolAddresses,
  getTickArrayStartIndex,
  RAYDIUM_CPMM_POOL_FEE_ACCOUNT,
  type RaydiumMintInfo,
} from './raydiumPoolAddresses'
import { expectedSqrtPriceX64, expectedTicks, isExpectedSqrtPrice } from './raydiumPriceMath'
import {
  RAYDIUM_CLMM_PROGRAM_ADDRESS,
  RAYDIUM_CPMM_PROGRAM_ADDRESS,
  TOKEN_2022_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
  WRAPPED_SOL_MINT_ADDRESS,
} from './programAddresses'
import type { ExpectedOperation } from './transactionExpectation'

type RaydiumOperation = Extract<ExpectedOperation, { kind: 'raydium-create-pool' | 'raydium-open-position' }>
type CreatePoolOperation = Extract<ExpectedOperation, { kind: 'raydium-create-pool' }>
type OpenPositionOperation = Extract<ExpectedOperation, { kind: 'raydium-open-position' }>

/** Size of a token account; the only size a wrapped-SOL account the transaction creates may have. */
const TOKEN_ACCOUNT_SIZE = 165
/** Rent-exempt minimum of a token account (2,039,280 lamports at the current rent rate). */
export const WRAPPED_SOL_ACCOUNT_RENT_LAMPORTS = BigInt(2_039_280)

/** Anchor discriminators (first 8 data bytes) of the only Raydium instructions the tool builds. */
const CPMM_INITIALIZE = [175, 175, 109, 31, 13, 152, 155, 237]
const CLMM_CREATE_POOL = [233, 146, 209, 142, 207, 104, 64, 188]
const CLMM_OPEN_POSITION_WITH_TOKEN22_NFT = [77, 255, 174, 82, 125, 29, 201, 46]

/** Account positions inside those instructions (from the Raydium SDK instruction builders). */
const CPMM_INITIALIZE_ACCOUNTS = {
  creator: 0,
  config: 1,
  authority: 2,
  pool: 3,
  mint0: 4,
  mint1: 5,
  lpMint: 6,
  creatorToken0: 7,
  creatorToken1: 8,
  creatorLpToken: 9,
  vault0: 10,
  vault1: 11,
  createPoolFee: 12,
  observation: 13,
  mintProgram0: 15,
  mintProgram1: 16,
}
const CLMM_CREATE_POOL_ACCOUNTS = {
  creator: 0,
  config: 1,
  pool: 2,
  mint0: 3,
  mint1: 4,
  vault0: 5,
  vault1: 6,
  observation: 7,
  bitmapExtension: 8,
  mintProgram0: 9,
  mintProgram1: 10,
}
const CLMM_OPEN_POSITION_ACCOUNTS = {
  payer: 0,
  nftOwner: 1,
  nftMint: 2,
  nftAccount: 3,
  pool: 4,
  protocolPosition: 5,
  tickArrayLower: 6,
  tickArrayUpper: 7,
  personalPosition: 8,
  tokenAccount0: 9,
  tokenAccount1: 10,
  vault0: 11,
  vault1: 12,
  mint0: 18,
  mint1: 19,
}

const hasDiscriminator = (instruction: TransactionInstruction, discriminator: readonly number[]): boolean =>
  instruction.data.length >= discriminator.length && discriminator.every((byte, index) => instruction.data[index] === byte)

const accountAt = (instruction: TransactionInstruction, index: number): string | undefined => instruction.keys[index]?.pubkey.toBase58()

/** An account slot that must hold `expected`, and what to report when it does not. */
type AccountExpectation = readonly [index: number, expected: string, problem: string]

const firstAccountProblem = (instruction: TransactionInstruction, expectations: readonly AccountExpectation[]): string | null => {
  const wrong = expectations.find(([index, expected]) => accountAt(instruction, index) !== expected)
  return wrong ? wrong[2] : null
}

/** UI amount → base units, or null when it is not representable at `decimals`. */
const toBaseUnits = (amount: string, decimals: number): bigint | null => {
  try {
    return parseTokenAmount(amount, decimals)
  } catch {
    return null
  }
}

const unexpectedTokenInstruction = (instruction: DecodedTokenInstruction): string =>
  `contains an unexpected token instruction (${instruction.type === 'unsupported' ? instruction.label : instruction.type})`

/**
 * Builds the rules for `raydium-create-pool` and `raydium-open-position` operations.
 *
 * @param operation - What the user asked for (mints, amounts, fee tier, prices, on-chain mint facts and,
 *   for positions, the derived pool and the announced NFT).
 * @param wallet - Connected wallet.
 * @param resolveAta - Associated token address derivation.
 */
export function createRaydiumLiquidityRules(
  operation: RaydiumOperation,
  wallet: string,
  resolveAta: AssociatedTokenAddressResolver
): OperationRules {
  const isPosition = operation.kind === 'raydium-open-position'
  const programAddress =
    operation.kind === 'raydium-create-pool' && operation.poolType === 'CPMM' ? RAYDIUM_CPMM_PROGRAM_ADDRESS : RAYDIUM_CLMM_PROGRAM_ADDRESS
  const expectedMints = [operation.tokenA, operation.tokenB].sort()
  const walletWsolAta = resolveAta(wallet, WRAPPED_SOL_MINT_ADDRESS, TOKEN_PROGRAM_ADDRESS)
  const wrapsSol = operation.maxWrappedSolLamports > BigInt(0)

  /** Temporary wrapped-SOL accounts created with a seed, and those initialized for the wallet. */
  const createdSeedAccounts = new Set<string>()
  const initializedSeedAccounts = new Set<string>()
  let raydiumInstructionCount = 0

  const isOwnedWrappedSolAccount = (account: string): boolean => account === walletWsolAta || initializedSeedAccounts.has(account)

  const hasExpectedMints = (instruction: TransactionInstruction, accounts: { mint0: number; mint1: number }): boolean => {
    const mints = [accountAt(instruction, accounts.mint0), accountAt(instruction, accounts.mint1)].sort()
    return mints[0] === expectedMints[0] && mints[1] === expectedMints[1]
  }

  /** The user's entered amount and on-chain facts for one of the pair's mints. */
  const sideOf = (mint: string): { info: RaydiumMintInfo; amount: string } =>
    mint === operation.tokenA
      ? { info: operation.mintInfo.tokenA, amount: operation.amountA }
      : { info: operation.mintInfo.tokenB, amount: operation.amountB }

  const baseUnitsOf = (mint: string): bigint | null => toBaseUnits(sideOf(mint).amount, sideOf(mint).info.decimals)

  /** The wallet's own token account for `mint`: its associated token account, or its (temporary) wrapped-SOL account. */
  const isOwnTokenAccount = (account: string | undefined, mint: string): boolean => {
    if (account === undefined) return false
    if (mint === WRAPPED_SOL_MINT_ADDRESS) return isOwnedWrappedSolAccount(account)
    return account === resolveAta(wallet, mint, sideOf(mint).info.tokenProgram)
  }

  const checkCpmmInitialize = (instruction: TransactionInstruction, request: CreatePoolOperation): string | null => {
    const accounts = CPMM_INITIALIZE_ACCOUNTS
    if (accountAt(instruction, accounts.creator) !== wallet) return 'creates the pool with a creator other than your wallet'
    if (!hasExpectedMints(instruction, accounts)) return 'creates a pool for tokens other than the ones you selected'

    const pool = deriveCpmmPoolAddresses(request.feeTier, request.tokenA, request.tokenB)
    if (!pool) return `uses the ${request.feeTier}% fee tier, which Raydium does not offer for CPMM pools`

    const problem = firstAccountProblem(instruction, [
      [accounts.config, pool.config, 'uses a pool configuration other than the one for your fee tier'],
      [accounts.authority, pool.authority, 'uses a pool authority other than the Raydium CPMM one'],
      [accounts.pool, pool.pool, 'creates a pool at an address other than the one derived from your tokens and fee tier'],
      [accounts.mint0, pool.mint0, 'lists the pool tokens in a different order than Raydium requires'],
      [accounts.mint1, pool.mint1, 'lists the pool tokens in a different order than Raydium requires'],
      [accounts.lpMint, pool.lpMint, 'uses an LP token other than the one derived for this pool'],
      [
        accounts.creatorLpToken,
        resolveAta(wallet, pool.lpMint, TOKEN_PROGRAM_ADDRESS),
        'sends the LP tokens to an account other than your own LP token account',
      ],
      [accounts.vault0, pool.vault0, 'uses a pool vault other than the one derived for this pool'],
      [accounts.vault1, pool.vault1, 'uses a pool vault other than the one derived for this pool'],
      [
        accounts.createPoolFee,
        RAYDIUM_CPMM_POOL_FEE_ACCOUNT,
        'sends the pool creation fee to an account other than the Raydium fee account',
      ],
      [accounts.observation, pool.observation, 'uses an observation account other than the one derived for this pool'],
      [accounts.mintProgram0, sideOf(pool.mint0).info.tokenProgram, 'uses a token program other than the one that owns the token'],
      [accounts.mintProgram1, sideOf(pool.mint1).info.tokenProgram, 'uses a token program other than the one that owns the token'],
    ])
    if (problem) return problem

    if (
      !isOwnTokenAccount(accountAt(instruction, accounts.creatorToken0), pool.mint0) ||
      !isOwnTokenAccount(accountAt(instruction, accounts.creatorToken1), pool.mint1)
    ) {
      return 'funds the pool from a token account that is not your own'
    }

    const data = decodeCpmmInitialize(instruction.data)
    if (!data) return 'has pool-creation data of an unexpected size'
    const [amount0, amount1] = [baseUnitsOf(pool.mint0), baseUnitsOf(pool.mint1)]
    if (amount0 === null || amount1 === null) return 'deposits token amounts that cannot be checked against what you entered'
    if (data.amount0 !== amount0 || data.amount1 !== amount1) return 'deposits different token amounts than the ones you entered'
    return data.openTime === BigInt(0) ? null : 'delays the pool opening instead of opening it immediately'
  }

  const checkClmmCreatePool = (instruction: TransactionInstruction, request: CreatePoolOperation): string | null => {
    const accounts = CLMM_CREATE_POOL_ACCOUNTS
    if (accountAt(instruction, accounts.creator) !== wallet) return 'creates the pool with a creator other than your wallet'
    if (!hasExpectedMints(instruction, accounts)) return 'creates a pool for tokens other than the ones you selected'

    const pool = deriveClmmPoolAddresses(request.feeTier, request.tokenA, request.tokenB)
    const problem = firstAccountProblem(instruction, [
      [accounts.config, pool.config, 'uses a pool configuration other than the one for your fee tier'],
      [accounts.pool, pool.pool, 'creates a pool at an address other than the one derived from your tokens and fee tier'],
      [accounts.mint0, pool.mint0, 'lists the pool tokens in a different order than Raydium requires'],
      [accounts.mint1, pool.mint1, 'lists the pool tokens in a different order than Raydium requires'],
      [accounts.vault0, pool.vault0, 'uses a pool vault other than the one derived for this pool'],
      [accounts.vault1, pool.vault1, 'uses a pool vault other than the one derived for this pool'],
      [accounts.observation, pool.observation, 'uses an observation account other than the one derived for this pool'],
      [accounts.bitmapExtension, pool.bitmapExtension, 'uses a tick bitmap account other than the one derived for this pool'],
      [accounts.mintProgram0, sideOf(pool.mint0).info.tokenProgram, 'uses a token program other than the one that owns the token'],
      [accounts.mintProgram1, sideOf(pool.mint1).info.tokenProgram, 'uses a token program other than the one that owns the token'],
    ])
    if (problem) return problem

    const data = decodeClmmCreatePool(instruction.data)
    if (!data) return 'has pool-creation data of an unexpected size'
    const expectedSqrtPrice = expectedSqrtPriceX64(
      request.initialPrice ?? '',
      pool.swapped,
      sideOf(pool.mint0).info.decimals,
      sideOf(pool.mint1).info.decimals
    )
    if (expectedSqrtPrice === null) return 'opens the pool at a price that cannot be checked against what you entered'
    if (!isExpectedSqrtPrice(data.sqrtPriceX64, expectedSqrtPrice)) return 'opens the pool at a different price than the one you entered'
    return data.openTime === BigInt(0) ? null : 'delays the pool opening instead of opening it immediately'
  }

  const checkClmmOpenPosition = (instruction: TransactionInstruction, request: OpenPositionOperation): string | null => {
    const accounts = CLMM_OPEN_POSITION_ACCOUNTS
    if (accountAt(instruction, accounts.payer) !== wallet) return 'opens the position with a payer other than your wallet'
    if (accountAt(instruction, accounts.nftOwner) !== wallet) return 'mints the liquidity position NFT to an account other than your wallet'
    if (accountAt(instruction, accounts.nftMint) !== request.positionNftMint)
      return 'mints a position NFT other than the one the server announced'
    if (accountAt(instruction, accounts.pool) !== request.poolId) return 'opens the position in a pool other than the one you created'
    if (!hasExpectedMints(instruction, accounts)) return 'opens a position for tokens other than the ones you selected'

    const pool = deriveClmmPoolAddresses(request.feeTier, request.tokenA, request.tokenB)
    const data = decodeClmmOpenPosition(instruction.data)
    if (!data) return 'has position data of an unexpected size'

    const problem = firstAccountProblem(instruction, [
      [accounts.pool, pool.pool, 'opens the position in a pool other than the one derived from your tokens and fee tier'],
      [accounts.mint0, pool.mint0, 'lists the pool tokens in a different order than Raydium requires'],
      [accounts.mint1, pool.mint1, 'lists the pool tokens in a different order than Raydium requires'],
      [accounts.vault0, pool.vault0, 'uses a pool vault other than the one derived for this pool'],
      [accounts.vault1, pool.vault1, 'uses a pool vault other than the one derived for this pool'],
      [
        accounts.nftAccount,
        resolveAta(wallet, request.positionNftMint, TOKEN_2022_PROGRAM_ADDRESS),
        'puts the position NFT in an account other than your own',
      ],
    ])
    if (problem) return problem
    if (
      !isOwnTokenAccount(accountAt(instruction, accounts.tokenAccount0), pool.mint0) ||
      !isOwnTokenAccount(accountAt(instruction, accounts.tokenAccount1), pool.mint1)
    ) {
      return 'deposits from a token account that is not your own'
    }

    if (data.baseFlagIsSome !== 0) return 'sizes the position by a token amount instead of the liquidity computed for your range'
    if (data.liquidity <= BigInt(0)) return 'opens a position without liquidity'

    const [amount0, amount1] = [baseUnitsOf(pool.mint0), baseUnitsOf(pool.mint1)]
    if (amount0 === null || amount1 === null) return 'deposits token amounts that cannot be checked against what you entered'
    if (data.amount0Max > amount0 || data.amount1Max > amount1) return 'may deposit more tokens than the amounts you entered'

    // The server inverts the range when Raydium's mint order is the reverse of the user's
    const [lowerPrice, upperPrice] = pool.swapped ? [request.maxPrice, request.minPrice] : [request.minPrice, request.maxPrice]
    const [decimals0, decimals1] = [sideOf(pool.mint0).info.decimals, sideOf(pool.mint1).info.decimals]
    const lowerTicks = expectedTicks(lowerPrice, pool.swapped, pool.tickSpacing, decimals0, decimals1)
    const upperTicks = expectedTicks(upperPrice, pool.swapped, pool.tickSpacing, decimals0, decimals1)
    if (!lowerTicks.has(data.tickLower) || !upperTicks.has(data.tickUpper) || data.tickLower >= data.tickUpper) {
      return 'uses a price range different from the one you entered'
    }

    const arrayLowerStart = getTickArrayStartIndex(data.tickLower, pool.tickSpacing)
    const arrayUpperStart = getTickArrayStartIndex(data.tickUpper, pool.tickSpacing)
    if (data.tickArrayLowerStart !== arrayLowerStart || data.tickArrayUpperStart !== arrayUpperStart) {
      return 'uses tick arrays that do not hold the ticks of the position'
    }
    const position = deriveClmmPositionAddresses(pool.pool, request.positionNftMint, {
      lower: data.tickLower,
      upper: data.tickUpper,
      arrayLowerStart,
      arrayUpperStart,
    })
    return firstAccountProblem(instruction, [
      [accounts.tickArrayLower, position.tickArrayLower, 'uses a tick array other than the one derived for the position range'],
      [accounts.tickArrayUpper, position.tickArrayUpper, 'uses a tick array other than the one derived for the position range'],
      [accounts.protocolPosition, position.protocolPosition, 'uses a position account other than the one derived for the position range'],
      [accounts.personalPosition, position.personalPosition, 'uses a position account other than the one derived for the position NFT'],
    ])
  }

  const checkRaydiumInstruction = (instruction: TransactionInstruction): string | null => {
    raydiumInstructionCount++

    if (operation.kind === 'raydium-open-position') {
      return hasDiscriminator(instruction, CLMM_OPEN_POSITION_WITH_TOKEN22_NFT)
        ? checkClmmOpenPosition(instruction, operation)
        : 'contains an unexpected Raydium instruction'
    }

    const isCpmm = operation.poolType === 'CPMM'
    if (!hasDiscriminator(instruction, isCpmm ? CPMM_INITIALIZE : CLMM_CREATE_POOL)) return 'contains an unexpected Raydium instruction'
    return isCpmm ? checkCpmmInitialize(instruction, operation) : checkClmmCreatePool(instruction, operation)
  }

  return {
    newAccountOwners: new Map(wrapsSol ? [[walletWsolAta, new Set([TOKEN_PROGRAM_ADDRESS])]] : []),
    maxRentLamports: wrapsSol ? operation.maxWrappedSolLamports + WRAPPED_SOL_ACCOUNT_RENT_LAMPORTS : BigInt(0),
    additionalSigners: new Set(isPosition ? [operation.positionNftMint] : []),
    opaquePrograms: new Set([programAddress]),
    checkOpaqueInstruction: checkRaydiumInstruction,
    settleSolPayment: () => -1,
    checkSeedAccountCreation: ({ address, owner, space }) => {
      if (!wrapsSol) return `creates an unexpected account ${address}`
      if (owner !== TOKEN_PROGRAM_ADDRESS || space !== TOKEN_ACCOUNT_SIZE) return `creates account ${address} that is not a token account`
      if (createdSeedAccounts.size > 0) return 'creates more than one wrapped SOL account'
      createdSeedAccounts.add(address)
      return null
    },
    checkTokenInstruction: (instruction) => {
      switch (instruction.type) {
        case 'initializeAccount':
          if (instruction.programAddress !== TOKEN_PROGRAM_ADDRESS || !createdSeedAccounts.has(instruction.account)) {
            return `initializes the token account ${instruction.account}, which this transaction did not create`
          }
          if (instruction.mint !== WRAPPED_SOL_MINT_ADDRESS) return 'initializes the new token account for a token other than wrapped SOL'
          if (instruction.owner !== wallet) return `assigns the new wrapped SOL account to ${instruction.owner} instead of your wallet`
          initializedSeedAccounts.add(instruction.account)
          return null
        case 'syncNative':
          return isOwnedWrappedSolAccount(instruction.account)
            ? null
            : `syncs ${instruction.account}, which is not your wrapped SOL account`
        case 'closeAccount':
          if (!isOwnedWrappedSolAccount(instruction.account)) return `closes ${instruction.account}, which is not your wrapped SOL account`
          if (instruction.authority !== wallet) return `close authority ${instruction.authority} is not your wallet`
          return instruction.destination === wallet
            ? null
            : `sends the closed account's SOL to ${instruction.destination} instead of your wallet`
        case 'transfer':
        case 'transferChecked':
          if (instruction.programAddress !== TOKEN_PROGRAM_ADDRESS) return unexpectedTokenInstruction(instruction)
          if (instruction.type === 'transferChecked' && instruction.mint !== WRAPPED_SOL_MINT_ADDRESS)
            return unexpectedTokenInstruction(instruction)
          if (instruction.authority !== wallet) return `transfer authority ${instruction.authority} is not your wallet`
          if (!isOwnedWrappedSolAccount(instruction.source) || !isOwnedWrappedSolAccount(instruction.destination)) {
            return 'moves tokens other than between your own wrapped SOL accounts'
          }
          return null
        default:
          return unexpectedTokenInstruction(instruction)
      }
    },
    checkCreatedTokenAccount: (account) => {
      const allowedMints = [operation.tokenA, operation.tokenB, WRAPPED_SOL_MINT_ADDRESS]
      return account.owner === wallet && allowedMints.includes(account.mint)
        ? null
        : `creates an unexpected token account for ${account.owner}`
    },
    finalize: () => {
      const reasons: string[] = []
      if (raydiumInstructionCount !== 1) {
        reasons.push(`Expected 1 Raydium instruction, found ${String(raydiumInstructionCount)}`)
      }
      if (initializedSeedAccounts.size !== createdSeedAccounts.size) {
        reasons.push('A wrapped SOL account the transaction creates is not initialized for your wallet')
      }
      return reasons
    },
  }
}
