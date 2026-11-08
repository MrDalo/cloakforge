/**
 * Transaction-size tests for createRaydiumPoolTransaction using the REAL Raydium SDK (offline: the
 * RPC connection is mocked and the SDK's feature check / token list are disabled).
 *
 * The platform fee transfer, service memo and coupon instructions are added to the pool-creation
 * transaction itself (WEB3-05). These cases are the largest the tool can produce and must stay
 * within the 1232-byte packet limit minus the builder's headroom.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { type AccountInfo, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { getAssociatedTokenAddressSync, NATIVE_MINT, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { mintAccountInfo, tokenAccountInfo } from '@/__tests__/utils/mintAccountFixtures'
import type { CreateRaydiumPoolParams } from '../createRaydiumPool'

const FEE_WALLET = Keypair.generate().publicKey
vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({ rpcPrivateEndpoint: 'https://private-rpc.example', feeWalletAddress: FEE_WALLET.toBase58() })),
}))

vi.mock('@/lib/contentful/toolConfigCache', () => ({ getCachedToolConfig: vi.fn(async () => ({ baseFee: 0.1 })) }))

const WALLET = Keypair.generate().publicKey
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
/** Coupon instructions at least as large as the real ones (`coupon:` + HMAC tag, 0-lamport marker transfer). */
const couponInstructions = (): TransactionInstruction[] => [
  new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(`coupon:${'f'.repeat(64)}`) }),
  SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: Keypair.generate().publicKey, lamports: 0 }),
]
vi.mock('../discountedServiceFee', () => ({
  applyCouponToServiceFee: vi.fn(async (fee: number, couponCode?: string) => ({
    feeSOL: couponCode ? fee / 2 : fee,
    couponInstructions: couponCode ? couponInstructions() : [],
  })),
}))

const USDC = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

interface WalletFixture {
  mints: Record<string, AccountInfo<Buffer>>
  /** Token accounts the wallet already holds, by token program */
  tokenAccounts: Array<{ pubkey: PublicKey; account: AccountInfo<Buffer> }>
}

let fixture: WalletFixture

/** Minimal RPC surface the builder and the Raydium SDK use while building pool instructions. */
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
  getMinimumBalanceForRentExemption: vi.fn(async () => 2_039_280),
  getBalance: vi.fn(async () => 10_000_000_000),
  getLatestBlockhash: vi.fn(async () => ({ blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 100 })),
}
vi.mock('@/lib/solana', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/solana')>()),
  createConnectionPair: vi.fn(() => ({ legacyConnection, kitRpc: {} })),
}))

const { createRaydiumPoolTransaction, MAX_RAYDIUM_TRANSACTION_SIZE } = await import('../createRaydiumPool')

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

/** A user token the wallet holds, with its mint. */
const heldToken = (programId: PublicKey, mint = Keypair.generate().publicKey) => {
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

const params = (poolType: 'CPMM' | 'CLMM', tokenA: PublicKey, tokenB: PublicKey): CreateRaydiumPoolParams => ({
  walletPublicKey: WALLET,
  couponCode: 'SAVE50',
  poolConfig: {
    poolType,
    tokenA: tokenA.toBase58(),
    tokenB: tokenB.toBase58(),
    feeTier: '0.25',
    initialLiquidity: { amountA: '1000000', amountB: '1' },
    ...(poolType === 'CLMM' ? { priceRange: { minPrice: '0.0000005', maxPrice: '0.000002' }, initialPrice: '0.000001' } : {}),
  },
})

const wireSize = (base64: string): number => Buffer.from(base64, 'base64').length

describe('createRaydiumPoolTransaction — size with the real Raydium SDK', () => {
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
    ['CPMM, SPL token + SOL (wrapped in the transaction)', 'CPMM', TOKEN_PROGRAM_ID],
    ['CPMM, Token-2022 token + SOL (wrapped in the transaction)', 'CPMM', TOKEN_2022_PROGRAM_ID],
    ['CLMM, Token-2022 token + SOL', 'CLMM', TOKEN_2022_PROGRAM_ID],
  ] as const)('should keep %s with fee and coupon within the size limit', async (_label, poolType, programId) => {
    const tokenA = heldToken(programId)

    const result = await createRaydiumPoolTransaction(params(poolType, tokenA, NATIVE_MINT))

    expect(wireSize(result.serializedTransaction)).toBeLessThanOrEqual(MAX_RAYDIUM_TRANSACTION_SIZE)
    // Fee transfer, service memo and coupon memo are all in the same transaction as the pool
    const transaction = Transaction.from(Buffer.from(result.serializedTransaction, 'base64'))
    const keys = transaction.compileMessage().accountKeys
    expect(keys.some((key) => key.equals(FEE_WALLET))).toBe(true)
    expect(transaction.instructions.filter((ix) => ix.programId.equals(MEMO_PROGRAM_ID))).toHaveLength(2)
  })

  it('should keep a CPMM pool of two held tokens (no SOL wrapping) within the size limit', async () => {
    const tokenA = heldToken(TOKEN_2022_PROGRAM_ID)
    const tokenB = heldToken(TOKEN_PROGRAM_ID, USDC)

    const result = await createRaydiumPoolTransaction(params('CPMM', tokenA, tokenB))

    expect(wireSize(result.serializedTransaction)).toBeLessThanOrEqual(MAX_RAYDIUM_TRANSACTION_SIZE)
  })

  it('should leave headroom below the 1232-byte packet limit', () => {
    expect(MAX_RAYDIUM_TRANSACTION_SIZE).toBe(1232 - 32)
  })
})
