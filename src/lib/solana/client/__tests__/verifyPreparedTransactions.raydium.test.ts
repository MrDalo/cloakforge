/**
 * verifyPreparedTransactions for the Raydium liquidity provider (CTV-01): pool-creation transactions built
 * by the REAL server builder and Raydium SDK (RPC mocked, as in createRaydiumPool.size.test.ts), a CLMM
 * open-position transaction assembled from the SDK's own instruction builders and PDA/tick helpers, and
 * malicious variants: extra SOL transfer, SPL Approve / SetAuthority / CloseAccount, extra signer, unknown
 * program, wrong mints, NFT minted to an attacker, inflated wrapped-SOL funding, and a Raydium instruction
 * whose amounts, price, ticks, config, pool or token accounts differ from what the user entered.
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
import Decimal from 'decimal.js'
import {
  ClmmInstrument,
  createWSolAccountInstructions,
  getPdaAmmConfigId,
  getPdaPersonalPositionAddress,
  getPdaPoolId,
  getPdaPoolVaultId,
  getPdaProtocolPositionAddress,
  getPdaTickArrayAddress,
  TickMath,
  TickUtils,
} from '@raydium-io/raydium-sdk-v2'
import { mintAccountInfo, tokenAccountInfo } from '@/__tests__/utils/mintAccountFixtures'
import { verifyPreparedTransactions } from '../verifyPreparedTransactions'
import { RAYDIUM_CLMM_PROGRAM_ADDRESS, RAYDIUM_CPMM_PROGRAM_ADDRESS } from '../programAddresses'
import { deriveRaydiumPoolAddress } from '../raydiumPoolAddresses'
import type { ExpectedOperation, PreparedTransactionExpectation, RaydiumLiquidityRequest } from '../transactionExpectation'

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

const TOKEN_DECIMALS = 6
const SOL_DECIMALS = 9
const AMOUNT_TOKEN = '1000000'
const AMOUNT_SOL = '1'
const INITIAL_PRICE = '0.000001'
const MIN_PRICE = '0.0000005'
const MAX_PRICE = '0.000002'

const liquidityRequest = (
  tokenA: PublicKey,
  tokenProgram: PublicKey = TOKEN_PROGRAM_ID,
  maxWrappedSolLamports = BigInt(1e9)
): RaydiumLiquidityRequest => ({
  tokenA: tokenA.toBase58(),
  tokenB: NATIVE_MINT.toBase58(),
  feeTier: '0.25',
  amountA: AMOUNT_TOKEN,
  amountB: AMOUNT_SOL,
  mintInfo: {
    tokenA: { decimals: TOKEN_DECIMALS, tokenProgram: tokenProgram.toBase58() },
    tokenB: { decimals: SOL_DECIMALS, tokenProgram: TOKEN_PROGRAM_ID.toBase58() },
  },
  maxWrappedSolLamports,
})

const poolOperation = (
  poolType: PoolType,
  tokenA: PublicKey,
  maxWrappedSolLamports = BigInt(1e9),
  tokenProgram: PublicKey = TOKEN_PROGRAM_ID,
  overrides: Partial<RaydiumLiquidityRequest> = {}
): ExpectedOperation => ({
  kind: 'raydium-create-pool',
  poolType,
  ...(poolType === 'CLMM' ? { initialPrice: INITIAL_PRICE } : {}),
  ...liquidityRequest(tokenA, tokenProgram, maxWrappedSolLamports),
  ...overrides,
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

      const result = verifyPreparedTransactions([transaction], expectation(poolOperation(poolType, tokenA, BigInt(1e9), programId)))

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

const CLMM_PROGRAM = new PublicKey(RAYDIUM_CLMM_PROGRAM_ADDRESS)
const CPMM_PROGRAM = new PublicKey(RAYDIUM_CPMM_PROGRAM_ADDRESS)

/** A copy of `instruction` with one account replaced. */
const withKey = (instruction: TransactionInstruction, index: number, pubkey: PublicKey): TransactionInstruction =>
  new TransactionInstruction({
    programId: instruction.programId,
    data: instruction.data,
    keys: instruction.keys.map((key, keyIndex) => (keyIndex === index ? { ...key, pubkey } : key)),
  })

/** A copy of `instruction` whose data was edited in place by `edit`. */
const withData = (instruction: TransactionInstruction, edit: (data: Buffer) => void): TransactionInstruction => {
  const data = Buffer.from(instruction.data)
  edit(data)
  return new TransactionInstruction({ programId: instruction.programId, keys: instruction.keys, data })
}

const U64_MASK = (BigInt(1) << BigInt(64)) - BigInt(1)

/** Multiplies the little-endian u128 at `offset` by `factor` (a price manipulation). */
const scaleU128 = (data: Buffer, offset: number, factor: number): void => {
  const value = (data.readBigUInt64LE(offset + 8) << BigInt(64)) + data.readBigUInt64LE(offset)
  const scaled = value * BigInt(factor)
  data.writeBigUInt64LE(scaled & U64_MASK, offset)
  data.writeBigUInt64LE(scaled >> BigInt(64), offset + 8)
}

/** Replaces the transaction's Raydium instruction with `change(instruction)`. */
const alterRaydium = (
  transaction: Transaction,
  poolType: PoolType,
  change: (instruction: TransactionInstruction) => TransactionInstruction
): Transaction =>
  withInstructions(transaction, (ixs) =>
    ixs.map((ix) => (isProgram(ix, poolType === 'CPMM' ? CPMM_PROGRAM : CLMM_PROGRAM) ? change(ix) : ix))
  )

describe('verifyPreparedTransactions — Raydium pool instruction fields (real server builder)', () => {
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

  const reasonsFor = async (
    poolType: PoolType,
    change: (instruction: TransactionInstruction) => TransactionInstruction,
    overrides: Partial<RaydiumLiquidityRequest> = {}
  ): Promise<string[]> => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    const transaction = alterRaydium(await buildPool(poolType, tokenA), poolType, change)
    return reasonsOf(
      verifyPreparedTransactions([transaction], expectation(poolOperation(poolType, tokenA, BigInt(1e9), TOKEN_PROGRAM_ID, overrides)))
    )
  }

  describe('CPMM initialize', () => {
    it('should reject manipulated init amounts (the price-manipulation attack)', async () => {
      const reasons = await reasonsFor('CPMM', (ix) =>
        withData(ix, (data) => {
          data.writeBigUInt64LE(BigInt(10) ** BigInt(15), 8)
          data.writeBigUInt64LE(BigInt(1), 16)
        })
      )

      expect(reasons).toEqual(['The transaction deposits different token amounts than the ones you entered'])
    })

    it('should reject a deposit that differs by a single base unit, and a delayed opening time', async () => {
      const reasons = await reasonsFor('CPMM', (ix) =>
        withData(ix, (data) => data.writeBigUInt64LE(data.readBigUInt64LE(8) + BigInt(1), 8))
      )
      const delayed = await reasonsFor('CPMM', (ix) => withData(ix, (data) => data.writeBigUInt64LE(BigInt(4_102_444_800), 24)))

      expect(reasons).toEqual(['The transaction deposits different token amounts than the ones you entered'])
      expect(delayed).toEqual(['The transaction delays the pool opening instead of opening it immediately'])
    })

    it('should reject instruction data with trailing bytes', async () => {
      const reasons = await reasonsFor(
        'CPMM',
        (ix) => new TransactionInstruction({ programId: ix.programId, keys: ix.keys, data: Buffer.concat([ix.data, Buffer.from([1])]) })
      )

      expect(reasons).toEqual(['The transaction has pool-creation data of an unexpected size'])
    })

    it('should reject an attacker AMM config, and a config of another fee tier', async () => {
      const attackerConfig = await reasonsFor('CPMM', (ix) => withKey(ix, 1, ATTACKER))
      const otherTier = await reasonsFor('CPMM', (ix) => ix, { feeTier: '1.00' })

      expect(attackerConfig).toEqual(['The transaction uses a pool configuration other than the one for your fee tier'])
      expect(otherTier).toEqual(['The transaction uses a pool configuration other than the one for your fee tier'])
    })

    it('should reject LP tokens sent to an attacker, and a pool at another address', async () => {
      const lp = await reasonsFor('CPMM', (ix) => withKey(ix, 9, ATTACKER))
      const pool = await reasonsFor('CPMM', (ix) => withKey(ix, 3, ATTACKER))

      expect(lp).toEqual(['The transaction sends the LP tokens to an account other than your own LP token account'])
      expect(pool).toEqual(['The transaction creates a pool at an address other than the one derived from your tokens and fee tier'])
    })

    it('should reject an attacker LP mint, vault, fee account and observation account', async () => {
      const lpMint = await reasonsFor('CPMM', (ix) => withKey(ix, 6, ATTACKER))
      const vault = await reasonsFor('CPMM', (ix) => withKey(ix, 10, ATTACKER))
      const feeAccount = await reasonsFor('CPMM', (ix) => withKey(ix, 12, ATTACKER))
      const observation = await reasonsFor('CPMM', (ix) => withKey(ix, 13, ATTACKER))

      expect(lpMint).toEqual(['The transaction uses an LP token other than the one derived for this pool'])
      expect(vault).toEqual(['The transaction uses a pool vault other than the one derived for this pool'])
      expect(feeAccount).toEqual(['The transaction sends the pool creation fee to an account other than the Raydium fee account'])
      expect(observation).toEqual(['The transaction uses an observation account other than the one derived for this pool'])
    })

    it('should reject source token accounts that are not the wallet’s own', async () => {
      const first = await reasonsFor('CPMM', (ix) => withKey(ix, 7, ATTACKER))
      const second = await reasonsFor('CPMM', (ix) => withKey(ix, 8, ATTACKER))

      expect(first).toEqual(['The transaction funds the pool from a token account that is not your own'])
      expect(second).toEqual(['The transaction funds the pool from a token account that is not your own'])
    })

    it('should reject a fee tier Raydium does not offer for CPMM pools', async () => {
      expect(await reasonsFor('CPMM', (ix) => ix, { feeTier: '0.01' })).toEqual([
        'The transaction uses the 0.01% fee tier, which Raydium does not offer for CPMM pools',
      ])
    })

    it('should reject a token program other than the mint’s owner', async () => {
      expect(
        await reasonsFor('CPMM', (ix) => ix, {
          mintInfo: {
            tokenA: { decimals: TOKEN_DECIMALS, tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58() },
            tokenB: { decimals: SOL_DECIMALS, tokenProgram: TOKEN_PROGRAM_ID.toBase58() },
          },
        })
      ).toEqual(expect.arrayContaining([expect.stringMatching(/token program other than the one that owns the token/)]))
    })

    it('should reject amounts that differ from the entered ones', async () => {
      expect(await reasonsFor('CPMM', (ix) => ix, { amountA: '1000001' })).toEqual([
        'The transaction deposits different token amounts than the ones you entered',
      ])
    })
  })

  describe('CLMM create_pool', () => {
    it('should reject a manipulated initial price', async () => {
      const doubled = await reasonsFor('CLMM', (ix) => withData(ix, (data) => scaleU128(data, 8, 2)))
      const tripled = await reasonsFor('CLMM', (ix) => withData(ix, (data) => scaleU128(data, 8, 3)))

      expect(doubled).toEqual(['The transaction opens the pool at a different price than the one you entered'])
      expect(tripled).toEqual(['The transaction opens the pool at a different price than the one you entered'])
    })

    it('should reject a pool opened at another price than the entered one (expectation side)', async () => {
      const tokenA = heldToken(TOKEN_PROGRAM_ID)
      const transaction = await buildPool('CLMM', tokenA)
      const operation = { ...poolOperation('CLMM', tokenA), initialPrice: '0.000002' } as ExpectedOperation

      expect(reasonsOf(verifyPreparedTransactions([transaction], expectation(operation)))).toEqual([
        'The transaction opens the pool at a different price than the one you entered',
      ])
    })

    it('should reject an attacker AMM config, a pool at another address, and an attacker vault', async () => {
      const config = await reasonsFor('CLMM', (ix) => withKey(ix, 1, ATTACKER))
      const pool = await reasonsFor('CLMM', (ix) => withKey(ix, 2, ATTACKER))
      const vault = await reasonsFor('CLMM', (ix) => withKey(ix, 5, ATTACKER))

      expect(config).toEqual(['The transaction uses a pool configuration other than the one for your fee tier'])
      expect(pool).toEqual(['The transaction creates a pool at an address other than the one derived from your tokens and fee tier'])
      expect(vault).toEqual(['The transaction uses a pool vault other than the one derived for this pool'])
    })

    it('should reject a pool created for another fee tier, and a delayed opening time', async () => {
      const otherTier = await reasonsFor('CLMM', (ix) => ix, { feeTier: '1.00' })
      const delayed = await reasonsFor('CLMM', (ix) => withData(ix, (data) => data.writeBigUInt64LE(BigInt(4_102_444_800), 24)))

      expect(otherTier).toEqual(['The transaction uses a pool configuration other than the one for your fee tier'])
      expect(delayed).toEqual(['The transaction delays the pool opening instead of opening it immediately'])
    })
  })

  it('should derive the pool address the real builder announces', async () => {
    const tokenA = heldToken(TOKEN_PROGRAM_ID)
    for (const poolType of ['CPMM', 'CLMM'] as const) {
      const result = await createRaydiumPoolTransaction({
        walletPublicKey: WALLET,
        poolConfig: {
          poolType,
          tokenA: tokenA.toBase58(),
          tokenB: NATIVE_MINT.toBase58(),
          feeTier: '0.25',
          initialLiquidity: { amountA: AMOUNT_TOKEN, amountB: AMOUNT_SOL },
          ...(poolType === 'CLMM' ? { priceRange: { minPrice: MIN_PRICE, maxPrice: MAX_PRICE }, initialPrice: INITIAL_PRICE } : {}),
        },
      })

      expect(deriveRaydiumPoolAddress({ poolType, feeTier: '0.25', tokenA: tokenA.toBase58(), tokenB: NATIVE_MINT.toBase58() })).toBe(
        result.poolPublicKey
      )
    }
  })
})

/** A fresh public key that sorts before (swapped = false) or after wrapped SOL in Raydium's mint order. */
const tokenWithMintOrder = (swapped: boolean): PublicKey => {
  for (;;) {
    const candidate = Keypair.generate().publicKey
    if (Buffer.compare(candidate.toBuffer(), NATIVE_MINT.toBuffer()) > 0 === swapped) return candidate
  }
}

describe.each([[false], [true]])('verifyPreparedTransactions — Raydium CLMM open position (token A sorts after SOL: %s)', (swapped) => {
  const NFT_MINT = Keypair.generate().publicKey
  const TOKEN_A = tokenWithMintOrder(swapped)
  const CONFIG_INDEX = 1
  const TICK_SPACING = 60

  // Raydium's order (ascending public key bytes) decides which of the two is mint0
  const [MINT_0, MINT_1] = swapped ? [NATIVE_MINT, TOKEN_A] : [TOKEN_A, NATIVE_MINT]
  const [DECIMALS_0, DECIMALS_1] = swapped ? [SOL_DECIMALS, TOKEN_DECIMALS] : [TOKEN_DECIMALS, SOL_DECIMALS]
  const [RAW_AMOUNT_0, RAW_AMOUNT_1] = swapped ? [BigInt(1e9), BigInt(1e12)] : [BigInt(1e12), BigInt(1e9)]

  // Everything below is computed with the Raydium SDK's own helpers, independently of the client code
  const AMM_CONFIG = getPdaAmmConfigId(CLMM_PROGRAM, CONFIG_INDEX).publicKey
  const POOL = getPdaPoolId(CLMM_PROGRAM, AMM_CONFIG, MINT_0, MINT_1).publicKey
  const sdkTick = (price: string): number =>
    TickMath.getTickWithPriceAndTickspacing(new Decimal(price), TICK_SPACING, DECIMALS_0, DECIMALS_1)
  // The server inverts the user's range when the mint order is swapped
  const TICK_LOWER = swapped ? sdkTick(new Decimal(1).div(MAX_PRICE).toString()) : sdkTick(MIN_PRICE)
  const TICK_UPPER = swapped ? sdkTick(new Decimal(1).div(MIN_PRICE).toString()) : sdkTick(MAX_PRICE)
  const ARRAY_LOWER = TickUtils.getTickArrayStartIndexByTick(TICK_LOWER, TICK_SPACING)
  const ARRAY_UPPER = TickUtils.getTickArrayStartIndexByTick(TICK_UPPER, TICK_SPACING)

  interface PositionOverrides {
    nftOwner?: PublicKey
    pool?: PublicKey
    nftAccount?: PublicKey
    /** The wallet account for the non-SOL token */
    tokenAccount?: PublicKey
    /** The wallet account for wrapped SOL (default: the temporary account the transaction creates) */
    solAccount?: PublicKey
    mint1?: PublicKey
    wrapLamports?: number
    tickLower?: number
    tickUpper?: number
    arrayLowerStart?: number
    arrayUpperStart?: number
    tickArrayLower?: PublicKey
    personalPosition?: PublicKey
    vault0?: PublicKey
    liquidity?: BN
    amount0Max?: BN
    amount1Max?: BN
  }

  /** The position transaction as the server returns it: SDK wrapped-SOL helpers around the SDK's open-position instruction. */
  const buildPosition = async (overrides: PositionOverrides = {}): Promise<Transaction> => {
    const wrapped = await createWSolAccountInstructions({
      connection: { getMinimumBalanceForRentExemption: async () => WSOL_RENT } as unknown as Connection,
      payer: WALLET,
      owner: WALLET,
      amount: overrides.wrapLamports ?? 1e9,
    })
    const tickLower = overrides.tickLower ?? TICK_LOWER
    const tickUpper = overrides.tickUpper ?? TICK_UPPER
    const arrayLowerStart = overrides.arrayLowerStart ?? ARRAY_LOWER
    const arrayUpperStart = overrides.arrayUpperStart ?? ARRAY_UPPER
    const tokenAccount = overrides.tokenAccount ?? getAssociatedTokenAddressSync(TOKEN_A, WALLET)
    const solAccount = overrides.solAccount ?? wrapped.addresses.newAccount
    const [account0, account1] = swapped ? [solAccount, tokenAccount] : [tokenAccount, solAccount]

    const open = ClmmInstrument.openPositionFromLiquidityInstruction22(
      CLMM_PROGRAM,
      WALLET,
      overrides.pool ?? POOL,
      overrides.nftOwner ?? WALLET,
      NFT_MINT,
      overrides.nftAccount ?? getAssociatedTokenAddressSync(NFT_MINT, WALLET, false, TOKEN_2022_PROGRAM_ID),
      getPdaProtocolPositionAddress(CLMM_PROGRAM, POOL, tickLower, tickUpper).publicKey,
      overrides.tickArrayLower ?? getPdaTickArrayAddress(CLMM_PROGRAM, POOL, arrayLowerStart).publicKey,
      getPdaTickArrayAddress(CLMM_PROGRAM, POOL, arrayUpperStart).publicKey,
      overrides.personalPosition ?? getPdaPersonalPositionAddress(CLMM_PROGRAM, NFT_MINT).publicKey,
      account0,
      account1,
      overrides.vault0 ?? getPdaPoolVaultId(CLMM_PROGRAM, POOL, MINT_0).publicKey,
      getPdaPoolVaultId(CLMM_PROGRAM, POOL, MINT_1).publicKey,
      MINT_0,
      overrides.mint1 ?? MINT_1,
      tickLower,
      tickUpper,
      arrayLowerStart,
      arrayUpperStart,
      overrides.liquidity ?? new BN(1_000_000),
      overrides.amount0Max ?? new BN(RAW_AMOUNT_0.toString()),
      overrides.amount1Max ?? new BN(RAW_AMOUNT_1.toString()),
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
    ...liquidityRequest(TOKEN_A),
    poolId: POOL.toBase58(),
    positionNftMint: NFT_MINT.toBase58(),
    minPrice: MIN_PRICE,
    maxPrice: MAX_PRICE,
    ...overrides,
  })

  /** No platform fee instructions are part of the position transaction. */
  const positionExpectation = (operation: ExpectedOperation): PreparedTransactionExpectation =>
    expectation(operation, { maxServiceFeeLamports: BigInt(0) })

  const reasonsOfPosition = async (overrides: PositionOverrides, operation: ExpectedOperation = positionOperation()): Promise<string[]> =>
    reasonsOf(verifyPreparedTransactions([await buildPosition(overrides)], positionExpectation(operation)))

  it('should accept the position transaction with the NFT keypair as the only co-signer', async () => {
    const transaction = await buildPosition()
    expect(transaction.compileMessage().header.numRequiredSignatures).toBe(2)

    const result = verifyPreparedTransactions([transaction], positionExpectation(positionOperation()))

    expect(reasonsOf(result)).toEqual([])
    expect(result).toMatchObject({ ok: true, summary: { serviceFeeLamports: BigInt(0), rentLamports: BigInt(1e9 + WSOL_RENT) } })
  })

  it('should accept deposit maximums below the entered amounts (the server caps them at the entered amounts)', async () => {
    expect(await reasonsOfPosition({ amount0Max: new BN(1), amount1Max: new BN(1) })).toEqual([])
  })

  it('should reject the NFT co-signer when the response announced another position NFT mint', async () => {
    const announced = Keypair.generate().publicKey.toBase58()

    const reasons = await reasonsOfPosition({}, positionOperation({ positionNftMint: announced }))

    expect(reasons).toContain(`The transaction requires an unexpected signer ${NFT_MINT.toBase58()}`)
    expect(reasons).toContain('The transaction mints a position NFT other than the one the server announced')
  })

  it('should reject a position NFT minted to an attacker', async () => {
    expect(await reasonsOfPosition({ nftOwner: ATTACKER })).toEqual([
      'The transaction mints the liquidity position NFT to an account other than your wallet',
    ])
  })

  it('should reject a position NFT account that is not the wallet’s associated Token-2022 account', async () => {
    expect(
      await reasonsOfPosition({ nftAccount: getAssociatedTokenAddressSync(NFT_MINT, ATTACKER, false, TOKEN_2022_PROGRAM_ID) })
    ).toEqual(['The transaction puts the position NFT in an account other than your own'])
    expect(await reasonsOfPosition({ nftAccount: ATTACKER })).toEqual([
      'The transaction puts the position NFT in an account other than your own',
    ])
  })

  it('should reject a position in another pool, or for other tokens', async () => {
    const otherPool = Keypair.generate().publicKey

    expect(await reasonsOfPosition({ pool: otherPool })).toEqual([
      'The transaction opens the position in a pool other than the one you created',
    ])
    expect(await reasonsOfPosition({ mint1: Keypair.generate().publicKey })).toEqual([
      'The transaction opens a position for tokens other than the ones you selected',
    ])
  })

  it('should reject a position in an attacker pool that the server announced as the pool (the pool must be the derived one)', async () => {
    const attackerPool = Keypair.generate().publicKey

    expect(await reasonsOfPosition({ pool: attackerPool }, positionOperation({ poolId: attackerPool.toBase58() }))).toEqual([
      'The transaction opens the position in a pool other than the one derived from your tokens and fee tier',
    ])
  })

  it('should reject a position with a fee tier whose pool differs from the one opened', async () => {
    expect(await reasonsOfPosition({}, positionOperation({ feeTier: '1.00' }))).toEqual(
      expect.arrayContaining([expect.stringContaining('pool other than the one derived')])
    )
  })

  it('should reject deposit maximums above the entered amounts', async () => {
    const tooMuch0 = await reasonsOfPosition({ amount0Max: new BN((RAW_AMOUNT_0 + BigInt(1)).toString()) })
    const tooMuch1 = await reasonsOfPosition({ amount1Max: new BN((RAW_AMOUNT_1 * BigInt(1000)).toString()) })

    expect(tooMuch0).toEqual(['The transaction may deposit more tokens than the amounts you entered'])
    expect(tooMuch1).toEqual(['The transaction may deposit more tokens than the amounts you entered'])
  })

  it('should reject zero liquidity', async () => {
    expect(await reasonsOfPosition({ liquidity: new BN(0) })).toEqual(['The transaction opens a position without liquidity'])
  })

  it('should reject ticks that do not match the entered price range', async () => {
    const wideRange = await reasonsOfPosition({ tickLower: TICK_LOWER - 6000, arrayLowerStart: ARRAY_LOWER - 3600 })
    const inverted = await reasonsOfPosition({ tickLower: TICK_UPPER, tickUpper: TICK_LOWER })
    const otherRange = await reasonsOfPosition({}, positionOperation({ minPrice: '0.00000001' }))

    expect(wideRange).toEqual(['The transaction uses a price range different from the one you entered'])
    expect(inverted).toEqual(['The transaction uses a price range different from the one you entered'])
    expect(otherRange).toEqual(['The transaction uses a price range different from the one you entered'])
  })

  it('should reject tick arrays and position accounts that do not belong to the position', async () => {
    const wrongStart = await reasonsOfPosition({ arrayLowerStart: ARRAY_LOWER - TICK_SPACING * 60 })
    const wrongArray = await reasonsOfPosition({ tickArrayLower: ATTACKER })
    const wrongPersonal = await reasonsOfPosition({ personalPosition: ATTACKER })
    const wrongVault = await reasonsOfPosition({ vault0: ATTACKER })

    expect(wrongStart).toEqual(['The transaction uses tick arrays that do not hold the ticks of the position'])
    expect(wrongArray).toEqual(['The transaction uses a tick array other than the one derived for the position range'])
    expect(wrongPersonal).toEqual(['The transaction uses a position account other than the one derived for the position NFT'])
    expect(wrongVault).toEqual(['The transaction uses a pool vault other than the one derived for this pool'])
  })

  it('should reject token accounts that are not the wallet’s own', async () => {
    const attackerAta = getAssociatedTokenAddressSync(TOKEN_A, ATTACKER)

    expect(await reasonsOfPosition({ tokenAccount: attackerAta })).toEqual([
      'The transaction deposits from a token account that is not your own',
    ])
    expect(await reasonsOfPosition({ tokenAccount: ATTACKER })).toEqual([
      'The transaction deposits from a token account that is not your own',
    ])
  })

  it('should reject a position sized by a token amount (Option<bool> base_flag set)', async () => {
    const transaction = withInstructions(await buildPosition(), (ixs) =>
      ixs.map((ix) => (isProgram(ix, CLMM_PROGRAM) ? withData(ix, (data) => data.writeUInt8(1, 57)) : ix))
    )

    expect(reasonsOf(verifyPreparedTransactions([transaction], positionExpectation(positionOperation())))).toEqual([
      'The transaction sizes the position by a token amount instead of the liquidity computed for your range',
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
    expect(reasonsOf(verifyPreparedTransactions([attackerOwned], expected))).toEqual(
      expect.arrayContaining([
        `The transaction assigns the new wrapped SOL account to ${ATTACKER.toBase58()} instead of your wallet`,
        'A wrapped SOL account the transaction creates is not initialized for your wallet',
      ])
    )
  })

  it('should accept wrapping through the wallet wSOL token account (SOL transfer + SyncNative)', async () => {
    const wsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, WALLET)
    const base = await buildPosition({ wrapLamports: 0, solAccount: wsolAta })
    const open = base.instructions.find((ix) => isProgram(ix, CLMM_PROGRAM))
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
