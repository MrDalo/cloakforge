/**
 * verifyPreparedTransactions for the Raydium liquidity provider (CTV-01): pool-creation transactions built
 * by the REAL server builder and Raydium SDK (RPC mocked, as in createRaydiumPool.size.test.ts), a CLMM
 * open-position transaction assembled from the SDK's own instruction builders, and malicious variants:
 * extra SOL transfer, SPL Approve / SetAuthority / CloseAccount, extra signer, unknown program, wrong
 * mints, NFT minted to an attacker, inflated wrapped-SOL funding.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { type AccountInfo, type Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import {
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  AuthorityType,
  createApproveInstruction,
  createCloseAccountInstruction,
  createSetAuthorityInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'
import BN from 'bn.js'
import { ClmmInstrument, createWSolAccountInstructions } from '@raydium-io/raydium-sdk-v2'
import { mintAccountInfo, tokenAccountInfo } from '@/__tests__/utils/mintAccountFixtures'
import { verifyPreparedTransactions } from '../verifyPreparedTransactions'
import { RAYDIUM_CLMM_PROGRAM_ADDRESS, RAYDIUM_CPMM_PROGRAM_ADDRESS } from '../programAddresses'
import type { ExpectedOperation, PreparedTransactionExpectation } from '../transactionExpectation'

const FEE_WALLET = Keypair.generate().publicKey
vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({ rpcPrivateEndpoint: 'https://private-rpc.example', feeWalletAddress: FEE_WALLET.toBase58() })),
}))
vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))
vi.mock('@/lib/contentful/toolConfigCache', () => ({ getCachedToolConfig: vi.fn(async () => ({ baseFee: 0.1 })) }))
vi.mock('@/lib/solana/server-side/discountedServiceFee', () => ({
  applyCouponToServiceFee: vi.fn(async (fee: number) => ({ feeSOL: fee, couponInstructions: [] })),
}))

const WALLET = Keypair.generate().publicKey
const ATTACKER = Keypair.generate().publicKey
const WSOL_RENT = 2_039_280

interface WalletFixture {
  mints: Record<string, AccountInfo<Buffer>>
  tokenAccounts: Array<{ pubkey: PublicKey; account: AccountInfo<Buffer> }>
}
let fixture: WalletFixture

const legacyConnection = {
  rpcEndpoint: 'https://private-rpc.example',
  commitment: 'confirmed',
  getMultipleAccountsInfo: vi.fn(async (keys: PublicKey[]) => keys.map((key) => fixture.mints[key.toBase58()] ?? null)),
  getTokenAccountsByOwner: vi.fn(async (_owner: PublicKey, filter: { programId: PublicKey }) => ({
    context: { slot: 1 },
    value: fixture.tokenAccounts.filter(({ account }) => account.owner.equals(filter.programId)),
  })),
  getAccountInfo: vi.fn(async () => ({
    data: Buffer.alloc(0),
    owner: SystemProgram.programId,
    lamports: 10_000_000_000,
    executable: false,
  })),
  getMinimumBalanceForRentExemption: vi.fn(async () => WSOL_RENT),
  getBalance: vi.fn(async () => 10_000_000_000),
  getLatestBlockhash: vi.fn(async () => ({ blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 100 })),
}
vi.mock('@/lib/solana', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/solana')>()),
  createConnectionPair: vi.fn(() => ({ legacyConnection, kitRpc: {} })),
}))

const { createRaydiumPoolTransaction } = await import('@/lib/solana/server-side/createRaydiumPool')

const CPMM_CONFIGS = [
  {
    id: 'D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2',
    index: 0,
    protocolFeeRate: 120000,
    tradeFeeRate: 2500,
    fundFeeRate: 40000,
    createPoolFee: '150000000',
    creatorFeeRate: 500,
  },
]
const CLMM_CONFIGS = [
  {
    id: 'E64NGkDLLCdQ2yFNPcavaKptrEgmiQaNykUuLC1Qgwyp',
    index: 1,
    protocolFeeRate: 120000,
    tradeFeeRate: 2500,
    tickSpacing: 60,
    fundFeeRate: 40000,
  },
]

const heldToken = (programId: PublicKey): PublicKey => {
  const mint = Keypair.generate().publicKey
  fixture.mints[mint.toBase58()] = mintAccountInfo({
    decimals: 6,
    program: programId.equals(TOKEN_2022_PROGRAM_ID) ? 'token-2022' : 'spl-token',
  })
  fixture.tokenAccounts.push({
    pubkey: getAssociatedTokenAddressSync(mint, WALLET, false, programId),
    account: tokenAccountInfo(mint, WALLET, BigInt(10) ** BigInt(15), programId),
  })
  return mint
}

type PoolType = 'CPMM' | 'CLMM'

/** Builds a pool-creation transaction with the real server builder: `tokenA` + SOL (1 SOL deposit). */
const buildPool = async (poolType: PoolType, tokenA: PublicKey): Promise<Transaction> => {
  const result = await createRaydiumPoolTransaction({
    walletPublicKey: WALLET,
    poolConfig: {
      poolType,
      tokenA: tokenA.toBase58(),
      tokenB: NATIVE_MINT.toBase58(),
      feeTier: '0.25',
      initialLiquidity: { amountA: '1000000', amountB: '1' },
      ...(poolType === 'CLMM' ? { priceRange: { minPrice: '0.0000005', maxPrice: '0.000002' }, initialPrice: '0.000001' } : {}),
    },
  })
  return Transaction.from(Buffer.from(result.serializedTransaction, 'base64'))
}

const poolOperation = (poolType: PoolType, tokenA: PublicKey, maxWrappedSolLamports = BigInt(1e9)): ExpectedOperation => ({
  kind: 'raydium-create-pool',
  poolType,
  tokenA: tokenA.toBase58(),
  tokenB: NATIVE_MINT.toBase58(),
  maxWrappedSolLamports,
})

const expectation = (
  operation: ExpectedOperation,
  overrides: Partial<PreparedTransactionExpectation> = {}
): PreparedTransactionExpectation => ({
  wallet: WALLET.toBase58(),
  feeWallet: FEE_WALLET.toBase58(),
  maxServiceFeeLamports: BigInt(0.1 * 1e9),
  operation,
  ...overrides,
})

const reasonsOf = (result: ReturnType<typeof verifyPreparedTransactions>): string[] => (result.ok ? [] : result.reasons)

/** A copy of `transaction` with its instructions replaced (same fee payer and blockhash). */
const withInstructions = (
  transaction: Transaction,
  change: (instructions: TransactionInstruction[]) => TransactionInstruction[]
): Transaction =>
  new Transaction({ feePayer: WALLET, recentBlockhash: transaction.recentBlockhash ?? undefined }).add(...change(transaction.instructions))

const isProgram = (instruction: TransactionInstruction, programId: PublicKey): boolean => instruction.programId.equals(programId)

describe('verifyPreparedTransactions — Raydium pool creation (real server builder)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fixture = { mints: { [NATIVE_MINT.toBase58()]: mintAccountInfo({ decimals: 9 }) }, tokenAccounts: [] }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        status: 200,
        json: async () => ({ data: url.includes('cpmm-config') ? CPMM_CONFIGS : CLMM_CONFIGS }),
      }))
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    ['CPMM, SPL token + SOL', 'CPMM', TOKEN_PROGRAM_ID],
    ['CPMM, Token-2022 token + SOL', 'CPMM', TOKEN_2022_PROGRAM_ID],
    ['CLMM, SPL token + SOL', 'CLMM', TOKEN_PROGRAM_ID],
  ] as const)(
    'should accept the real %s transaction (fee transfer, wrapped SOL, Raydium instruction)',
    async (_label, poolType, programId) => {
      const tokenA = heldToken(programId)
      const transaction = await buildPool(poolType, tokenA)

      const result = verifyPreparedTransactions([transaction], expectation(poolOperation(poolType, tokenA)))

      expect(reasonsOf(result)).toEqual([])
      expect(result).toMatchObject({ ok: true, summary: { serviceFeeLamports: BigInt(0.1 * 1e9), paymentLamports: BigInt(0) } })
    }
  )

  it('should report the wrapped SOL funding as rent', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const result = verifyPreparedTransactions([await buildPool('CPMM', tokenA)], expectation(poolOperation('CPMM', tokenA)))

    expect(result).toMatchObject({ ok: true, summary: { rentLamports: BigInt(1e9 + WSOL_RENT) } })
  })

  it('should reject an extra SOL transfer to an attacker', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const transaction = withInstructions(await buildPool('CPMM', tokenA), (ixs) => [
      SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: ATTACKER, lamports: 5_000_000_000 }),
      ...ixs,
    ])

    const reasons = reasonsOf(verifyPreparedTransactions([transaction], expectation(poolOperation('CPMM', tokenA))))

    expect(reasons).toContain(
      `The transaction sends 5 SOL to ${ATTACKER.toBase58()}, which is neither the fee wallet nor a recipient you entered`
    )
  })

  it('should reject a wrapped SOL account funded with more than the SOL deposit', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const transaction = await buildPool('CPMM', tokenA)

    const reasons = reasonsOf(verifyPreparedTransactions([transaction], expectation(poolOperation('CPMM', tokenA, BigInt(0.5 * 1e9)))))

    expect(reasons).toEqual([
      expect.stringMatching(/^New accounts are funded with 1\.00203928 SOL, more than the expected 0\.50203928 SOL$/),
    ])
  })

  it('should reject SOL wrapping when the user entered no SOL amount', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const transaction = await buildPool('CPMM', tokenA)

    expect(verifyPreparedTransactions([transaction], expectation(poolOperation('CPMM', tokenA, BigInt(0)))).ok).toBe(false)
  })

  it('should reject a platform fee above the displayed fee', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const transaction = await buildPool('CPMM', tokenA)

    const reasons = reasonsOf(
      verifyPreparedTransactions([transaction], expectation(poolOperation('CPMM', tokenA), { maxServiceFeeLamports: BigInt(50_000_000) }))
    )

    expect(reasons).toEqual(['The service fee is 0.1 SOL, more than the 0.05 SOL you were shown'])
  })

  it('should reject an SPL Approve of the wallet token account to an attacker', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const source = getAssociatedTokenAddressSync(tokenA, WALLET)
    const transaction = withInstructions(await buildPool('CPMM', tokenA), (ixs) => [
      createApproveInstruction(source, ATTACKER, WALLET, BigInt(1e12)),
      ...ixs,
    ])

    const reasons = reasonsOf(verifyPreparedTransactions([transaction], expectation(poolOperation('CPMM', tokenA))))

    expect(reasons).toEqual(['The transaction contains an unexpected token instruction (token instruction #4)'])
  })

  it('should reject a SetAuthority on the wallet token account', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const source = getAssociatedTokenAddressSync(tokenA, WALLET)
    const transaction = withInstructions(await buildPool('CPMM', tokenA), (ixs) => [
      createSetAuthorityInstruction(source, WALLET, AuthorityType.AccountOwner, ATTACKER),
      ...ixs,
    ])

    expect(reasonsOf(verifyPreparedTransactions([transaction], expectation(poolOperation('CPMM', tokenA))))).toEqual([
      'The transaction contains an unexpected token instruction (setAuthority)',
    ])
  })

  it('should reject a CloseAccount that sends the wrapped SOL to an attacker, and one for another account', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const base = await buildPool('CPMM', tokenA)
    const wrappedSol = base.instructions.find((ix) => isProgram(ix, TOKEN_PROGRAM_ID) && ix.data[0] === 9)?.keys[0].pubkey
    expect(wrappedSol).toBeDefined()
    if (!wrappedSol) return

    const toAttacker = withInstructions(base, (ixs) => [...ixs.slice(0, -1), createCloseAccountInstruction(wrappedSol, ATTACKER, WALLET)])
    const otherAccount = withInstructions(base, (ixs) => [
      ...ixs,
      createCloseAccountInstruction(getAssociatedTokenAddressSync(tokenA, WALLET), WALLET, WALLET),
    ])
    const expected = expectation(poolOperation('CPMM', tokenA))

    expect(reasonsOf(verifyPreparedTransactions([toAttacker], expected))).toEqual([
      `The transaction sends the closed account's SOL to ${ATTACKER.toBase58()} instead of your wallet`,
    ])
    expect(reasonsOf(verifyPreparedTransactions([otherAccount], expected))).toEqual([
      expect.stringContaining('which is not your wrapped SOL account'),
    ])
  })

  it('should reject an unexpected extra signer', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const extraSigner = Keypair.generate().publicKey
    const transaction = withInstructions(await buildPool('CPMM', tokenA), (ixs) => [
      ...ixs,
      new TransactionInstruction({
        programId: new PublicKey(RAYDIUM_CPMM_PROGRAM_ADDRESS),
        keys: [{ pubkey: extraSigner, isSigner: true, isWritable: false }],
        data: Buffer.alloc(8),
      }),
    ])

    const reasons = reasonsOf(verifyPreparedTransactions([transaction], expectation(poolOperation('CPMM', tokenA))))

    expect(reasons).toContain(`The transaction requires an unexpected signer ${extraSigner.toBase58()}`)
  })

  it('should reject an unknown program', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const unknown = Keypair.generate().publicKey
    const transaction = withInstructions(await buildPool('CPMM', tokenA), (ixs) => [
      ...ixs,
      new TransactionInstruction({ programId: unknown, keys: [], data: Buffer.alloc(1) }),
    ])

    expect(reasonsOf(verifyPreparedTransactions([transaction], expectation(poolOperation('CPMM', tokenA))))).toEqual([
      `The transaction invokes an unexpected program ${unknown.toBase58()}`,
    ])
  })

  it('should reject the Raydium CLMM program in a CPMM pool creation, and a second Raydium instruction', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const base = await buildPool('CPMM', tokenA)
    const raydium = base.instructions.find((ix) => isProgram(ix, new PublicKey(RAYDIUM_CPMM_PROGRAM_ADDRESS)))
    expect(raydium).toBeDefined()
    if (!raydium) return
    const expected = expectation(poolOperation('CPMM', tokenA))

    const clmm = withInstructions(base, (ixs) => [
      ...ixs,
      new TransactionInstruction({ programId: new PublicKey(RAYDIUM_CLMM_PROGRAM_ADDRESS), keys: raydium.keys, data: raydium.data }),
    ])
    const doubled = withInstructions(base, (ixs) => [...ixs, raydium])

    expect(reasonsOf(verifyPreparedTransactions([clmm], expected))).toEqual([
      `The transaction invokes an unexpected program ${RAYDIUM_CLMM_PROGRAM_ADDRESS}`,
    ])
    expect(reasonsOf(verifyPreparedTransactions([doubled], expected))).toEqual(['Expected 1 Raydium instruction, found 2'])
  })

  it('should reject a pool for tokens other than the selected ones', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const transaction = await buildPool('CPMM', tokenA)
    const otherToken = Keypair.generate().publicKey

    expect(reasonsOf(verifyPreparedTransactions([transaction], expectation(poolOperation('CPMM', otherToken))))).toEqual([
      'The transaction creates a pool for tokens other than the ones you selected',
    ])
  })

  it('should reject a pool creation transaction that only wraps SOL and pays the fee (no Raydium instruction)', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const transaction = withInstructions(await buildPool('CPMM', tokenA), (ixs) =>
      ixs.filter((ix) => !isProgram(ix, new PublicKey(RAYDIUM_CPMM_PROGRAM_ADDRESS)))
    )

    expect(reasonsOf(verifyPreparedTransactions([transaction], expectation(poolOperation('CPMM', tokenA))))).toContain(
      'Expected 1 Raydium instruction, found 0'
    )
  })

  it('should reject a different fee payer', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const base = await buildPool('CPMM', tokenA)
    const transaction = new Transaction({ feePayer: ATTACKER, recentBlockhash: base.recentBlockhash ?? undefined }).add(
      ...base.instructions
    )

    expect(reasonsOf(verifyPreparedTransactions([transaction], expectation(poolOperation('CPMM', tokenA))))).toContain(
      `The transaction makes ${ATTACKER.toBase58()} pay the network fee instead of your wallet`
    )
  })
})

describe('verifyPreparedTransactions — Raydium CLMM open position', () => {
  const POOL = Keypair.generate().publicKey
  const NFT_MINT = Keypair.generate().publicKey
  const TOKEN_A = Keypair.generate().publicKey

  /** The position transaction as the server returns it: SDK wrapped-SOL helpers around the SDK's open-position instruction. */
  const buildPosition = async (
    options: { nftOwner?: PublicKey; pool?: PublicKey; mintB?: PublicKey; wrapLamports?: number } = {}
  ): Promise<Transaction> => {
    const wrapped = await createWSolAccountInstructions({
      connection: { getMinimumBalanceForRentExemption: async () => WSOL_RENT } as unknown as Connection,
      payer: WALLET,
      owner: WALLET,
      amount: options.wrapLamports ?? 1e9,
    })
    const address = () => Keypair.generate().publicKey
    const open = ClmmInstrument.openPositionFromLiquidityInstruction22(
      new PublicKey(RAYDIUM_CLMM_PROGRAM_ADDRESS),
      WALLET,
      options.pool ?? POOL,
      options.nftOwner ?? WALLET,
      NFT_MINT,
      address(),
      address(),
      address(),
      address(),
      address(),
      getAssociatedTokenAddressSync(TOKEN_A, WALLET),
      wrapped.addresses.newAccount,
      address(),
      address(),
      TOKEN_A,
      options.mintB ?? NATIVE_MINT,
      -100,
      100,
      -120,
      120,
      new BN(1_000),
      new BN(1_000_000),
      new BN(1e9),
      'create'
    )
    return new Transaction({ feePayer: WALLET, recentBlockhash: Keypair.generate().publicKey.toBase58() }).add(
      ...(wrapped.instructions ?? []),
      open,
      ...(wrapped.endInstructions ?? [])
    )
  }

  const positionOperation = (
    overrides: Partial<Extract<ExpectedOperation, { kind: 'raydium-open-position' }>> = {}
  ): ExpectedOperation => ({
    kind: 'raydium-open-position',
    tokenA: TOKEN_A.toBase58(),
    tokenB: NATIVE_MINT.toBase58(),
    poolId: POOL.toBase58(),
    positionNftMint: NFT_MINT.toBase58(),
    maxWrappedSolLamports: BigInt(1e9),
    ...overrides,
  })

  /** No platform fee instructions are part of the position transaction. */
  const positionExpectation = (operation: ExpectedOperation): PreparedTransactionExpectation =>
    expectation(operation, { maxServiceFeeLamports: BigInt(0) })

  it('should accept the position transaction with the NFT keypair as the only co-signer', async () => {
    const transaction = await buildPosition()
    expect(transaction.compileMessage().header.numRequiredSignatures).toBe(2)

    const result = verifyPreparedTransactions([transaction], positionExpectation(positionOperation()))

    expect(reasonsOf(result)).toEqual([])
    expect(result).toMatchObject({ ok: true, summary: { serviceFeeLamports: BigInt(0), rentLamports: BigInt(1e9 + WSOL_RENT) } })
  })

  it('should reject the NFT co-signer when the response announced another position NFT mint', async () => {
    const transaction = await buildPosition()
    const announced = Keypair.generate().publicKey.toBase58()

    const reasons = reasonsOf(
      verifyPreparedTransactions([transaction], positionExpectation(positionOperation({ positionNftMint: announced })))
    )

    expect(reasons).toContain(`The transaction requires an unexpected signer ${NFT_MINT.toBase58()}`)
    expect(reasons).toContain('The transaction mints a position NFT other than the one the server announced')
  })

  it('should reject a position NFT minted to an attacker', async () => {
    const reasons = reasonsOf(
      verifyPreparedTransactions([await buildPosition({ nftOwner: ATTACKER })], positionExpectation(positionOperation()))
    )

    expect(reasons).toEqual(['The transaction mints the liquidity position NFT to an account other than your wallet'])
  })

  it('should reject a position in another pool, or for other tokens', async () => {
    const otherPool = await buildPosition({ pool: Keypair.generate().publicKey })
    const otherToken = await buildPosition({ mintB: Keypair.generate().publicKey })
    const expected = positionExpectation(positionOperation())

    expect(reasonsOf(verifyPreparedTransactions([otherPool], expected))).toEqual([
      'The transaction opens the position in a pool other than the one you created',
    ])
    expect(reasonsOf(verifyPreparedTransactions([otherToken], expected))).toEqual([
      'The transaction opens a position for tokens other than the ones you selected',
    ])
  })

  it('should reject an extra SOL transfer to an attacker and a platform fee in the position transaction', async () => {
    const base = await buildPosition()
    const stolen = withInstructions(base, (ixs) => [
      SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: ATTACKER, lamports: 1e9 }),
      ...ixs,
    ])
    const fee = withInstructions(base, (ixs) => [
      SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: FEE_WALLET, lamports: 1e8 }),
      ...ixs,
    ])
    const expected = positionExpectation(positionOperation())

    expect(reasonsOf(verifyPreparedTransactions([stolen], expected))).toEqual([
      `The transaction sends 1 SOL to ${ATTACKER.toBase58()}, which is neither the fee wallet nor a recipient you entered`,
    ])
    expect(reasonsOf(verifyPreparedTransactions([fee], expected))).toEqual([
      'The service fee is 0.1 SOL, more than the 0 SOL you were shown',
    ])
  })

  it('should reject an SPL Approve and a wrapped SOL account initialized for an attacker', async () => {
    const base = await buildPosition()
    const approve = withInstructions(base, (ixs) => [
      createApproveInstruction(getAssociatedTokenAddressSync(TOKEN_A, WALLET), ATTACKER, WALLET, BigInt(1e12)),
      ...ixs,
    ])
    const attackerOwned = withInstructions(base, (ixs) =>
      ixs.map((ix) =>
        isProgram(ix, TOKEN_PROGRAM_ID) && ix.data[0] === 1
          ? new TransactionInstruction({
              programId: TOKEN_PROGRAM_ID,
              keys: [ix.keys[0], ix.keys[1], { ...ix.keys[2], pubkey: ATTACKER }, ix.keys[3]],
              data: ix.data,
            })
          : ix
      )
    )
    const expected = positionExpectation(positionOperation())

    expect(reasonsOf(verifyPreparedTransactions([approve], expected))).toEqual([
      'The transaction contains an unexpected token instruction (token instruction #4)',
    ])
    expect(reasonsOf(verifyPreparedTransactions([attackerOwned], expected))).toEqual([
      `The transaction assigns the new wrapped SOL account to ${ATTACKER.toBase58()} instead of your wallet`,
      expect.stringContaining('which is not your wrapped SOL account'),
      'A wrapped SOL account the transaction creates is not initialized for your wallet',
    ])
  })

  it('should accept wrapping through the wallet wSOL token account (SOL transfer + SyncNative)', async () => {
    const wsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, WALLET)
    const base = await buildPosition({ wrapLamports: 0 })
    const open = base.instructions.find((ix) => isProgram(ix, new PublicKey(RAYDIUM_CLMM_PROGRAM_ADDRESS)))
    expect(open).toBeDefined()
    if (!open) return
    const transaction = withInstructions(base, () => [
      SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: wsolAta, lamports: 1e9 }),
      createSyncNativeInstruction(wsolAta),
      open,
    ])

    expect(reasonsOf(verifyPreparedTransactions([transaction], positionExpectation(positionOperation())))).toEqual([])
  })

  it('should reject syncing or wrapping into an attacker token account', async () => {
    const base = await buildPosition()

    const reasons = reasonsOf(
      verifyPreparedTransactions(
        [withInstructions(base, (ixs) => [createSyncNativeInstruction(ATTACKER), ...ixs])],
        positionExpectation(positionOperation())
      )
    )

    expect(reasons).toEqual([`The transaction syncs ${ATTACKER.toBase58()}, which is not your wrapped SOL account`])
  })
})
