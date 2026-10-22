/**
 * Rules for the Raydium liquidity provider transactions (pool creation and CLMM position opening).
 *
 * The Raydium instruction itself is the trusted part, but it must be exactly the expected one (program,
 * instruction, wallet as creator, the user's mints, NFT minted to the wallet). Everything around it is
 * bounded: SOL leaves the wallet only to the fee wallet and to the temporary wrapped-SOL account that
 * funds the user's SOL deposit, and token instructions only wrap, sync, move or close the wallet's own
 * wrapped-SOL accounts back to the wallet. Approve, SetAuthority and any other CloseAccount are rejected.
 */

import type { TransactionInstruction } from '@solana/web3.js'
import type { DecodedTokenInstruction } from './decodeTokenInstruction'
import type { AssociatedTokenAddressResolver, OperationRules } from './operationRules'
import {
  RAYDIUM_CLMM_PROGRAM_ADDRESS,
  RAYDIUM_CPMM_PROGRAM_ADDRESS,
  TOKEN_PROGRAM_ADDRESS,
  WRAPPED_SOL_MINT_ADDRESS,
} from './programAddresses'
import type { ExpectedOperation } from './transactionExpectation'

type RaydiumOperation = Extract<ExpectedOperation, { kind: 'raydium-create-pool' | 'raydium-open-position' }>

/** Size of a token account; the only size a wrapped-SOL account the transaction creates may have. */
const TOKEN_ACCOUNT_SIZE = 165
/** Rent-exempt minimum of a token account (2,039,280 lamports at the current rent rate). */
export const WRAPPED_SOL_ACCOUNT_RENT_LAMPORTS = BigInt(2_039_280)

/** Anchor discriminators (first 8 data bytes) of the only Raydium instructions the tool builds. */
const CPMM_INITIALIZE = [175, 175, 109, 31, 13, 152, 155, 237]
const CLMM_CREATE_POOL = [233, 146, 209, 142, 207, 104, 64, 188]
const CLMM_OPEN_POSITION_WITH_TOKEN22_NFT = [77, 255, 174, 82, 125, 29, 201, 46]

/** Account positions inside those instructions (from the Raydium SDK instruction builders). */
const CPMM_INITIALIZE_ACCOUNTS = { creator: 0, mintA: 4, mintB: 5 }
const CLMM_CREATE_POOL_ACCOUNTS = { creator: 0, mintA: 3, mintB: 4 }
const CLMM_OPEN_POSITION_ACCOUNTS = { payer: 0, nftOwner: 1, nftMint: 2, pool: 4, mintA: 18, mintB: 19 }

const hasDiscriminator = (instruction: TransactionInstruction, discriminator: readonly number[]): boolean =>
  instruction.data.length >= discriminator.length && discriminator.every((byte, index) => instruction.data[index] === byte)

const accountAt = (instruction: TransactionInstruction, index: number): string | undefined => instruction.keys[index]?.pubkey.toBase58()

const unexpectedTokenInstruction = (instruction: DecodedTokenInstruction): string =>
  `contains an unexpected token instruction (${instruction.type === 'unsupported' ? instruction.label : instruction.type})`

/**
 * Builds the rules for `raydium-create-pool` and `raydium-open-position` operations.
 *
 * @param operation - What the user asked for (mints, wrapped SOL bound, and for positions the pool and NFT).
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

  const hasExpectedMints = (instruction: TransactionInstruction, accounts: { mintA: number; mintB: number }): boolean => {
    const mints = [accountAt(instruction, accounts.mintA), accountAt(instruction, accounts.mintB)].sort()
    return mints[0] === expectedMints[0] && mints[1] === expectedMints[1]
  }

  const checkRaydiumInstruction = (instruction: TransactionInstruction): string | null => {
    raydiumInstructionCount++

    if (operation.kind === 'raydium-open-position') {
      const accounts = CLMM_OPEN_POSITION_ACCOUNTS
      if (!hasDiscriminator(instruction, CLMM_OPEN_POSITION_WITH_TOKEN22_NFT)) return 'contains an unexpected Raydium instruction'
      if (accountAt(instruction, accounts.payer) !== wallet) return 'opens the position with a payer other than your wallet'
      if (accountAt(instruction, accounts.nftOwner) !== wallet)
        return 'mints the liquidity position NFT to an account other than your wallet'
      if (accountAt(instruction, accounts.nftMint) !== operation.positionNftMint)
        return 'mints a position NFT other than the one the server announced'
      if (accountAt(instruction, accounts.pool) !== operation.poolId) return 'opens the position in a pool other than the one you created'
      return hasExpectedMints(instruction, accounts) ? null : 'opens a position for tokens other than the ones you selected'
    }

    const isCpmm = operation.poolType === 'CPMM'
    if (!hasDiscriminator(instruction, isCpmm ? CPMM_INITIALIZE : CLMM_CREATE_POOL)) return 'contains an unexpected Raydium instruction'
    const accounts = isCpmm ? CPMM_INITIALIZE_ACCOUNTS : CLMM_CREATE_POOL_ACCOUNTS
    if (accountAt(instruction, accounts.creator) !== wallet) return 'creates the pool with a creator other than your wallet'
    return hasExpectedMints(instruction, accounts) ? null : 'creates a pool for tokens other than the ones you selected'
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
