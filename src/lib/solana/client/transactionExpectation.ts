/**
 * What a tool hook expects a server-prepared transaction to do, derived ONLY from what the user
 * entered and saw (form values, displayed fee) — never from the server response.
 */

import type { FeeTier } from '@/types/liquidityProvider'
import type { RaydiumMintInfo } from './raydiumPoolAddresses'

/** A payment the user asked for: SOL to `recipient`, or tokens to the associated token account of `recipient`. */
export interface ExpectedPayment {
  /** Wallet that receives the payment (for tokens: the owner of the destination ATA) */
  recipient: string
  /** UI amount as entered (SOL, or token units) */
  amount: number | string
}

export type ExpectedOperation =
  /** Burn `amount` of `mint` from `tokenAccount` (BurnChecked) */
  | { kind: 'burn'; mint: string; tokenAccount: string; amount: number | string }
  /** Freeze / thaw the `mint` ATAs of `targetWallets` (the server may skip some) */
  | { kind: 'freeze' | 'thaw'; mint: string; targetWallets: readonly string[] }
  /** Revoke (set to none) the mint or freeze authority of `mint` */
  | { kind: 'revoke-authority'; mint: string; authority: 'mint' | 'freeze' }
  /** Revoke the Token-2022 metadata update authority of `mint` */
  | { kind: 'revoke-metadata-authority'; mint: string }
  /** Update Token-2022 metadata fields of `mint`; `uri` only when a new metadata JSON was uploaded */
  | { kind: 'update-metadata'; mint: string; name: string; symbol: string; uri?: string }
  /** Create a Token-2022 mint (client-generated keypair `mint`) with in-mint metadata */
  | {
      kind: 'create-token'
      mint: string
      decimals: number
      totalSupply: number
      name: string
      symbol: string
      uri: string
      revokeMintAuthority: boolean
      revokeFreezeAuthority: boolean
      immutableMetadata: boolean
      /** Upper bound for the lamports funding the new mint account (rent) */
      maxRentLamports: bigint
    }
  /** Pay SOL to each recipient, exactly once */
  | { kind: 'sol-transfers'; payments: readonly ExpectedPayment[] }
  /**
   * Pay `mint` tokens to each recipient's ATA, exactly once. `decimals` (read on-chain by the client)
   * is required to verify unchecked `Transfer` instructions; `TransferChecked` carries its own.
   */
  | { kind: 'token-transfers'; mint: string; payments: readonly ExpectedPayment[]; decimals?: number }
  /**
   * Create a Raydium CPMM or CLMM pool (CPMM also deposits the liquidity). The Raydium instruction is
   * checked field by field: creator, mints, config, pool, vaults, the user's token accounts, the deposit
   * amounts (CPMM) and the initial price (CLMM) must all be the ones derived from this request.
   */
  | ({
      kind: 'raydium-create-pool'
      poolType: 'CPMM' | 'CLMM'
      /** CLMM only: the price the pool opens at, token B per token A, as entered */
      initialPrice?: string
    } & RaydiumLiquidityRequest)
  /**
   * Open a Raydium CLMM position in `poolId`, co-signed server-side by the fresh position-NFT keypair
   * `positionNftMint`. `poolId` must be the pool address derived client-side, never the server's. The NFT
   * must be minted to the wallet and the ticks, liquidity and deposit maximums must fit this request.
   */
  | ({
      kind: 'raydium-open-position'
      poolId: string
      positionNftMint: string
      /** Price range bounds, token B per token A, as entered */
      minPrice: string
      maxPrice: string
    } & RaydiumLiquidityRequest)

/** What the user entered for a Raydium pool or position, plus the on-chain facts the client read. */
export interface RaydiumLiquidityRequest {
  tokenA: string
  tokenB: string
  feeTier: FeeTier
  /** Token amounts as entered (UI units) */
  amountA: string
  amountB: string
  /** Decimals and token program of each mint, read on-chain by the client */
  mintInfo: { tokenA: RaydiumMintInfo; tokenB: RaydiumMintInfo }
  maxWrappedSolLamports: bigint
}

export interface PreparedTransactionExpectation {
  /** Connected wallet: the only fee payer, SOL source and token authority */
  wallet: string
  /**
   * Service-fee recipient (`NEXT_PUBLIC_FEE_WALLET_ADDRESS`). `null` only in development builds without
   * the variable: fee transfers to any address are then accepted within `maxServiceFeeLamports`.
   */
  feeWallet: string | null
  /** Total service fee the user was shown, across all transactions (coupons only lower it) */
  maxServiceFeeLamports: bigint
  operation: ExpectedOperation
}

/** Associated token account a prepared transaction creates (idempotently). */
export interface CreatedTokenAccount {
  address: string
  owner: string
  mint: string
  tokenProgram: string
}

/** What the verified transactions will spend, for balance checks and result accounting. */
export interface PreparedTransactionSummary {
  transactionCount: number
  /** SOL sent to the fee wallet */
  serviceFeeLamports: bigint
  /** SOL sent to expected payment recipients */
  paymentLamports: bigint
  /** SOL funding accounts the transactions create (new mint) */
  rentLamports: bigint
  /** Upper bound of base + priority fees, from each message's signatures and compute budget */
  networkFeeLamports: bigint
  /** ATAs the transactions create if missing (their rent is paid by the wallet) */
  createdTokenAccounts: CreatedTokenAccount[]
  /** For each transaction, the indexes (into the expected payments) of the payments it makes */
  paymentIndexesByTransaction: number[][]
}

export type PreparedTransactionVerification =
  | { ok: true; summary: PreparedTransactionSummary; warnings: string[] }
  | { ok: false; reasons: string[]; warnings: string[] }
