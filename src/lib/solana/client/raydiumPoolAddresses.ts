/**
 * Client-side derivation of the Raydium accounts a liquidity-provider transaction must use, from what the
 * user entered only (token pair, fee tier, pool type) and what the client read on-chain (mint programs and
 * decimals) — never from the server response.
 *
 * Pure PublicKey.findProgramAddressSync derivations, so the Raydium SDK (heavy) stays out of the browser
 * bundle. Seeds are copied from @raydium-io/raydium-sdk-v2 0.2.39-alpha:
 * `src/raydium/cpmm/pda.ts` (getCpmmPdaAmmConfigId, getCpmmPdaPoolId, getPdaLpMint, getPdaVault,
 * getPdaObservationId, getPdaPoolAuthority) and `src/raydium/clmm/utils/pda.ts` (getPdaAmmConfigId,
 * getPdaPoolId, getPdaPoolVaultId, getPdaObservationAccount, getPdaExBitmapAccount, getPdaTickArrayAddress,
 * getPdaProtocolPositionAddress, getPdaPersonalPositionAddress).
 */

import { PublicKey, type Connection } from '@solana/web3.js'
import { unpackMint } from '@solana/spl-token'
import { AppError } from '@/lib/errors'
import type { FeeTier, PoolType } from '@/types/liquidityProvider'
import { RAYDIUM_CLMM_PROGRAM_ADDRESS, RAYDIUM_CPMM_PROGRAM_ADDRESS, TOKEN_PROGRAM_ADDRESSES } from './programAddresses'

/**
 * Raydium AMM configs per fee tier (mainnet; the tool builds mainnet transactions only).
 *
 * The server picks "the config with this trade fee rate and the lowest index" from Raydium's config API
 * (`raydiumFeeConfigs.ts`). The same choice is pinned here by index, and the account is derived from it:
 *
 * | Tier  | CPMM index (id)                                              | CLMM index (id, tick spacing)                                |
 * | ----- | ------------------------------------------------------------ | ------------------------------------------------------------ |
 * | 0.01  | not offered                                                  | 4 (9iFER3bpjf1PTTCQCfTRu17EJgvsxo9pVyA9QWwEuX4x, 1)          |
 * | 0.05  | not offered                                                  | 5 (3XCQJQryqpDvvZBfGxR7CLAw5dpGJ9aa7kt1jRLdyxuZ, 1)          |
 * | 0.25  | 0 (D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2)             | 1 (E64NGkDLLCdQ2yFNPcavaKptrEgmiQaNykUuLC1Qgwyp, 60)         |
 * | 1.00  | 1 (G95xxie3XbkCqtE39GgQ9Ggc7xBC8Uceve7HFDEFApkc)             | 3 (A1BBtTYJd4i3xU8D6Tc2FzU6ZN4oXZWXKZnCxwbHXr8x, 120)        |
 *
 * A tier Raydium later serves from a lower-index config makes verification fail closed (the transaction
 * is rejected, never signed) until this table is updated.
 */
const CPMM_CONFIG_INDEX: Partial<Record<FeeTier, number>> = { '0.25': 0, '1.00': 1 }
const CLMM_CONFIG: Record<FeeTier, { index: number; tickSpacing: number }> = {
  '0.01': { index: 4, tickSpacing: 1 },
  '0.05': { index: 5, tickSpacing: 1 },
  '0.25': { index: 1, tickSpacing: 60 },
  '1.00': { index: 3, tickSpacing: 120 },
}

/** Raydium CPMM pool-creation fee receiver (CREATE_CPMM_POOL_FEE_ACC; the server passes the same account). */
export const RAYDIUM_CPMM_POOL_FEE_ACCOUNT = 'DNXgeM9EiiaAbaWvwjHj9fQQLAX5ZsfHyvmYUNRAdNC8'

/** Ticks per tick array (TICK_ARRAY_SIZE in the SDK). */
const TICK_ARRAY_SIZE = 60

const seed = (text: string): Buffer => Buffer.from(text, 'utf8')

const u16BigEndian = (value: number): Buffer => {
  const bytes = Buffer.alloc(2)
  bytes.writeUInt16BE(value)
  return bytes
}

const i32BigEndian = (value: number): Buffer => {
  const bytes = Buffer.alloc(4)
  bytes.writeInt32BE(value)
  return bytes
}

/** The PDA of `seeds` under `programAddress`, base58. */
const pda = (programAddress: string, ...seeds: Buffer[]): string =>
  PublicKey.findProgramAddressSync(seeds, new PublicKey(programAddress))[0].toBase58()

const keyBytes = (address: string): Buffer => new PublicKey(address).toBuffer()

/** Orders two mints the way Raydium does: ascending public key bytes. */
const compareMintBytes = (a: string, b: string): number => {
  const [bytesA, bytesB] = [keyBytes(a), keyBytes(b)]
  for (let index = 0; index < bytesA.length; index++) {
    if (bytesA[index] !== bytesB[index]) return bytesA[index] - bytesB[index]
  }
  return 0
}

export interface SortedMintPair {
  /** Raydium's first mint (smaller public key) */
  mint0: string
  mint1: string
  /** True when Raydium's order is the reverse of the user's (tokenA is mint1) */
  swapped: boolean
}

/**
 * Raydium's canonical mint order for the user's pair (CPMM and CLMM both order by ascending public key).
 *
 * @param tokenA - The user's token A mint.
 * @param tokenB - The user's token B mint.
 */
export function sortMintPair(tokenA: string, tokenB: string): SortedMintPair {
  const swapped = compareMintBytes(tokenA, tokenB) > 0
  return swapped ? { mint0: tokenB, mint1: tokenA, swapped } : { mint0: tokenA, mint1: tokenB, swapped }
}

export interface CpmmPoolAddresses extends SortedMintPair {
  config: string
  /** Vault and LP-mint authority PDA of the CPMM program */
  authority: string
  pool: string
  lpMint: string
  vault0: string
  vault1: string
  observation: string
}

/**
 * Derives the accounts of a CPMM pool for the user's pair and fee tier.
 *
 * @returns The addresses, or null when Raydium offers no CPMM config for the fee tier.
 */
export function deriveCpmmPoolAddresses(feeTier: FeeTier, tokenA: string, tokenB: string): CpmmPoolAddresses | null {
  const configIndex = CPMM_CONFIG_INDEX[feeTier]
  if (configIndex === undefined) return null

  const program = RAYDIUM_CPMM_PROGRAM_ADDRESS
  const pair = sortMintPair(tokenA, tokenB)
  const config = pda(program, seed('amm_config'), u16BigEndian(configIndex))
  const pool = pda(program, seed('pool'), keyBytes(config), keyBytes(pair.mint0), keyBytes(pair.mint1))
  return {
    ...pair,
    config,
    authority: pda(program, seed('vault_and_lp_mint_auth_seed')),
    pool,
    lpMint: pda(program, seed('pool_lp_mint'), keyBytes(pool)),
    vault0: pda(program, seed('pool_vault'), keyBytes(pool), keyBytes(pair.mint0)),
    vault1: pda(program, seed('pool_vault'), keyBytes(pool), keyBytes(pair.mint1)),
    observation: pda(program, seed('observation'), keyBytes(pool)),
  }
}

export interface ClmmPoolAddresses extends SortedMintPair {
  config: string
  /** Tick spacing of the fee tier's config */
  tickSpacing: number
  pool: string
  vault0: string
  vault1: string
  observation: string
  bitmapExtension: string
}

/** Derives the accounts of a CLMM pool for the user's pair and fee tier. */
export function deriveClmmPoolAddresses(feeTier: FeeTier, tokenA: string, tokenB: string): ClmmPoolAddresses {
  const program = RAYDIUM_CLMM_PROGRAM_ADDRESS
  const pair = sortMintPair(tokenA, tokenB)
  const { index, tickSpacing } = CLMM_CONFIG[feeTier]
  const config = pda(program, seed('amm_config'), u16BigEndian(index))
  const pool = pda(program, seed('pool'), keyBytes(config), keyBytes(pair.mint0), keyBytes(pair.mint1))
  return {
    ...pair,
    config,
    tickSpacing,
    pool,
    vault0: pda(program, seed('pool_vault'), keyBytes(pool), keyBytes(pair.mint0)),
    vault1: pda(program, seed('pool_vault'), keyBytes(pool), keyBytes(pair.mint1)),
    observation: pda(program, seed('observation'), keyBytes(pool)),
    bitmapExtension: pda(program, seed('pool_tick_array_bitmap_extension'), keyBytes(pool)),
  }
}

/**
 * The pool address the user's pair and fee tier must produce. Hooks compare it with the pool the server
 * announced and fail closed on a difference.
 *
 * @throws AppError INVALID_INPUT when Raydium offers no CPMM pool for the fee tier.
 */
export function deriveRaydiumPoolAddress(params: { poolType: PoolType; feeTier: FeeTier; tokenA: string; tokenB: string }): string {
  const { poolType, feeTier, tokenA, tokenB } = params
  if (poolType === 'CLMM') return deriveClmmPoolAddresses(feeTier, tokenA, tokenB).pool

  const cpmm = deriveCpmmPoolAddresses(feeTier, tokenA, tokenB)
  if (!cpmm) {
    throw new AppError('INVALID_INPUT', `Raydium does not offer a ${feeTier}% fee tier for CPMM pools. Please choose a different fee tier.`)
  }
  return cpmm.pool
}

/** First tick of the tick array holding `tick` (SDK TickUtils.getTickArrayStartIndexByTick). */
export function getTickArrayStartIndex(tick: number, tickSpacing: number): number {
  const ticksInArray = tickSpacing * TICK_ARRAY_SIZE
  return Math.floor(tick / ticksInArray) * ticksInArray
}

export interface ClmmPositionAddresses {
  tickArrayLower: string
  tickArrayUpper: string
  protocolPosition: string
  personalPosition: string
}

/**
 * Derives the CLMM accounts that depend on the position's ticks and NFT.
 *
 * @param pool - The CLMM pool address.
 * @param nftMint - Position NFT mint.
 * @param ticks - Lower and upper tick indexes and the start indexes of their tick arrays.
 */
export function deriveClmmPositionAddresses(
  pool: string,
  nftMint: string,
  ticks: { lower: number; upper: number; arrayLowerStart: number; arrayUpperStart: number }
): ClmmPositionAddresses {
  const program = RAYDIUM_CLMM_PROGRAM_ADDRESS
  return {
    tickArrayLower: pda(program, seed('tick_array'), keyBytes(pool), i32BigEndian(ticks.arrayLowerStart)),
    tickArrayUpper: pda(program, seed('tick_array'), keyBytes(pool), i32BigEndian(ticks.arrayUpperStart)),
    protocolPosition: pda(program, seed('position'), keyBytes(pool), i32BigEndian(ticks.lower), i32BigEndian(ticks.upper)),
    personalPosition: pda(program, seed('position'), keyBytes(nftMint)),
  }
}

/** What the client read on-chain about a pool mint. */
export interface RaydiumMintInfo {
  decimals: number
  /** SPL Token or Token-2022 program that owns the mint */
  tokenProgram: string
}

/**
 * Reads both pool mints through the client RPC: their token programs (for associated token account
 * derivation) and decimals (for exact base-unit amounts and prices).
 *
 * @throws AppError TOKEN_MINT_NOT_FOUND when a mint cannot be read, so the transaction cannot be checked.
 */
export async function fetchRaydiumPoolMints(
  connection: Connection,
  tokenA: string,
  tokenB: string
): Promise<{ tokenA: RaydiumMintInfo; tokenB: RaydiumMintInfo }> {
  const unreadable = (): AppError =>
    new AppError('TOKEN_MINT_NOT_FOUND', 'The token mint could not be read, so the transaction cannot be checked')

  const keys = [new PublicKey(tokenA), new PublicKey(tokenB)]
  const accounts = await connection.getMultipleAccountsInfo(keys, 'confirmed')
  const [infoA, infoB] = keys.map((key, index): RaydiumMintInfo => {
    const account = accounts[index]
    if (!account || !TOKEN_PROGRAM_ADDRESSES.has(account.owner.toBase58())) throw unreadable()
    try {
      return { decimals: unpackMint(key, account, account.owner).decimals, tokenProgram: account.owner.toBase58() }
    } catch {
      throw unreadable()
    }
  })
  return { tokenA: infoA, tokenB: infoB }
}
