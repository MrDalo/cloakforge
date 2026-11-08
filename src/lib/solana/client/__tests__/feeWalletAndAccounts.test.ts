/**
 * Fee-wallet pinning (fail closed in production), token-account rent estimates and amount helpers.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { type Connection, Keypair, PublicKey } from '@solana/web3.js'
import {
  ACCOUNT_SIZE,
  ExtensionType,
  MINT_SIZE,
  MintLayout,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAccountLen,
  getMintLen,
} from '@solana/spl-token'
import { resolveFeeWalletForVerification } from '../feeWallet'
import { estimateNewTokenAccountRentLamports, fetchMint, getMaxTokenCreationRentLamports } from '../tokenAccounts'
import { acceptedRawAmounts, formatLamportsAsSol, solToLamportsCeil } from '../amounts'
import type { CreatedTokenAccount } from '../transactionExpectation'

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

const FEE_WALLET = Keypair.generate().publicKey.toBase58()
const rent = (length: number): number => (length + 128) * 6960

const mintAccount = (programId: PublicKey) => {
  const data = Buffer.alloc(MINT_SIZE)
  MintLayout.encode(
    {
      mintAuthorityOption: 0,
      mintAuthority: PublicKey.default,
      supply: BigInt(0),
      decimals: 6,
      isInitialized: true,
      freezeAuthorityOption: 0,
      freezeAuthority: PublicKey.default,
    },
    data
  )
  return { data, owner: programId, lamports: rent(MINT_SIZE), executable: false, rentEpoch: 0 }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('resolveFeeWalletForVerification', () => {
  it('should return the public fee wallet when it is a valid address', () => {
    vi.stubEnv('NEXT_PUBLIC_FEE_WALLET_ADDRESS', FEE_WALLET)
    expect(resolveFeeWalletForVerification()).toBe(FEE_WALLET)
  })

  it.each(['', 'not-a-wallet'])('should refuse to sign in production builds when the fee wallet is %j', (value) => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PUBLIC_FEE_WALLET_ADDRESS', value)

    expect(() => resolveFeeWalletForVerification()).toThrow(expect.objectContaining({ code: 'TRANSACTION_VERIFICATION_FAILED' }))
  })

  it('should leave the fee recipient unpinned in development when the variable is missing', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('NEXT_PUBLIC_FEE_WALLET_ADDRESS', '')

    expect(resolveFeeWalletForVerification()).toBeNull()
  })
})

describe('fetchMint', () => {
  it('should decode a mint read through the client connection', async () => {
    const mint = Keypair.generate().publicKey
    const connection = { getAccountInfo: vi.fn().mockResolvedValue(mintAccount(TOKEN_PROGRAM_ID)) } as unknown as Connection

    await expect(fetchMint(connection, mint.toBase58())).resolves.toMatchObject({ decimals: 6 })
  })

  it('should reject accounts that are missing or not owned by a token program', async () => {
    const mint = Keypair.generate().publicKey.toBase58()
    const missing = { getAccountInfo: vi.fn().mockResolvedValue(null) } as unknown as Connection
    const foreign = { getAccountInfo: vi.fn().mockResolvedValue(mintAccount(Keypair.generate().publicKey)) } as unknown as Connection

    await expect(fetchMint(missing, mint)).rejects.toMatchObject({ code: 'TOKEN_MINT_NOT_FOUND' })
    await expect(fetchMint(foreign, mint)).rejects.toMatchObject({ code: 'TOKEN_MINT_NOT_FOUND' })
  })
})

describe('estimateNewTokenAccountRentLamports', () => {
  const account = (tokenProgram: PublicKey, mint: string): CreatedTokenAccount => ({
    address: Keypair.generate().publicKey.toBase58(),
    owner: Keypair.generate().publicKey.toBase58(),
    mint,
    tokenProgram: tokenProgram.toBase58(),
  })

  it('should charge rent only for the token accounts that do not exist yet', async () => {
    const mint = Keypair.generate().publicKey.toBase58()
    const accounts = Array.from({ length: 150 }, () => account(TOKEN_PROGRAM_ID, mint))
    const getMultipleAccountsInfo = vi.fn(async (keys: PublicKey[]) => keys.map((_, i) => (i % 3 === 0 ? null : { lamports: 1 })))
    const getMinimumBalanceForRentExemption = vi.fn(async (length: number) => rent(length))
    const connection = { getMultipleAccountsInfo, getMinimumBalanceForRentExemption } as unknown as Connection

    // Chunks of 100 + 50: 34 + 17 missing accounts
    await expect(estimateNewTokenAccountRentLamports(connection, accounts)).resolves.toBe(BigInt(51 * rent(ACCOUNT_SIZE)))
    expect(getMultipleAccountsInfo).toHaveBeenCalledTimes(2)
    expect(getMinimumBalanceForRentExemption).toHaveBeenCalledWith(ACCOUNT_SIZE, 'confirmed')
  })

  it('should size Token-2022 accounts with the ImmutableOwner extension', async () => {
    const mint = Keypair.generate().publicKey.toBase58()
    const getMinimumBalanceForRentExemption = vi.fn(async (length: number) => rent(length))
    const connection = {
      getMultipleAccountsInfo: vi.fn(async (keys: PublicKey[]) => keys.map(() => null)),
      getAccountInfo: vi.fn().mockResolvedValue(mintAccount(TOKEN_2022_PROGRAM_ID)),
      getMinimumBalanceForRentExemption,
    } as unknown as Connection

    const accountLength = getAccountLen([ExtensionType.ImmutableOwner])
    await expect(estimateNewTokenAccountRentLamports(connection, [account(TOKEN_2022_PROGRAM_ID, mint)])).resolves.toBe(
      BigInt(rent(accountLength))
    )
  })

  it('should not query the RPC when nothing is created', async () => {
    const connection = { getMultipleAccountsInfo: vi.fn() } as unknown as Connection
    await expect(estimateNewTokenAccountRentLamports(connection, [])).resolves.toBe(BigInt(0))
    expect(connection.getMultipleAccountsInfo).not.toHaveBeenCalled()
  })
})

describe('getMaxTokenCreationRentLamports', () => {
  it('should bound the rent by the metadata space the server funds, counting UTF-8 bytes', async () => {
    const getMinimumBalanceForRentExemption = vi.fn(async (length: number) => rent(length))
    const connection = { getMinimumBalanceForRentExemption } as unknown as Connection

    await getMaxTokenCreationRentLamports(connection, { name: 'Tökén', symbol: 'TK', uri: 'ipfs://x' })

    // "Tökén" is 5 characters but 7 UTF-8 bytes
    expect(getMinimumBalanceForRentExemption).toHaveBeenCalledWith(
      getMintLen([ExtensionType.MetadataPointer]) + 700 + 7 + 2 + 8,
      'confirmed'
    )
  })
})

describe('amount helpers', () => {
  it('should accept the exact conversion and the float-scaled forms of an amount', () => {
    expect([...acceptedRawAmounts('1.5', 6)]).toEqual([BigInt(1_500_000)])
    // 0.29 * 10^2 = 28.999999999999996 in floating point: floor 28 (float builders) and round/exact 29
    expect([...acceptedRawAmounts(0.29, 2)].sort()).toEqual([BigInt(28), BigInt(29)])
    // More fractional digits than the token supports: only the float-scaled forms
    expect([...acceptedRawAmounts(0.1234567, 6)].sort()).toEqual([BigInt(123_456), BigInt(123_457)])
    expect(acceptedRawAmounts('abc', 6).size).toBe(0)
  })

  it('should round SOL up to whole lamports and format lamports exactly', () => {
    expect(solToLamportsCeil(0.0000000001)).toBe(BigInt(1))
    expect(solToLamportsCeil(0.009)).toBe(BigInt(9_000_000))
    expect(solToLamportsCeil(-1)).toBe(BigInt(0))
    expect(formatLamportsAsSol(BigInt(1_500_000))).toBe('0.0015 SOL')
  })
})
