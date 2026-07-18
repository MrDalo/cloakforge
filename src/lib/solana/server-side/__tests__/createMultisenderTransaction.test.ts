import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, TransactionMessage, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { createMultisenderTransaction } from '../createMultisenderTransaction'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({
    rpcPrivateEndpoint: 'https://api.devnet.solana.com',
    feeWalletAddress: 'FeeWa11etAddre55111111111111111111111111111'.slice(0, 44),
  })),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
}))

vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: vi.fn().mockResolvedValue({ baseFee: 0.001 }),
}))

const mockApplyCouponToServiceFee = vi.fn()
vi.mock('../discountedServiceFee', () => ({
  applyCouponToServiceFee: (...args: unknown[]) => mockApplyCouponToServiceFee(...args),
}))

vi.mock('@solana/spl-token', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/spl-token')>()
  return { ...actual, getMint: (...args: unknown[]) => mockGetMint(...args) }
})

let mockGetMint: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
let mockGetLatestBlockhash: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>

vi.mock('@/lib/solana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/solana')>()
  return {
    ...actual,
    createConnectionPair: vi.fn(() => ({
      legacyConnection: { getLatestBlockhash: (...args: unknown[]) => mockGetLatestBlockhash(...args) },
      kitRpc: {},
    })),
    calculateDynamicPriorityFee: vi.fn().mockResolvedValue(1500),
  }
})

const WALLET = Keypair.generate().publicKey
const MINT = Keypair.generate().publicKey
const makeRecipients = (n: number) => Array.from({ length: n }, () => ({ address: Keypair.generate().publicKey.toString(), amount: 1 }))

describe('createMultisenderTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.001, couponMemoInstruction: null })
    // Default: mint resolves under classic Token program only
    mockGetMint = vi.fn().mockImplementation(async (_conn, _mint, _commitment, programId) => {
      if (programId === TOKEN_2022_PROGRAM_ID) throw new Error('not token-2022')
      return { decimals: 6 }
    })
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toString(), lastValidBlockHeight: 999 })
  })

  it('builds a single SOL transaction for a small recipient list', async () => {
    const recipients = makeRecipients(3)
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients, decimals: 9 })

    expect(result.transactions).toHaveLength(1)
    const decompiled = TransactionMessage.decompile(result.transactions[0].message)
    // [computeLimit, computePrice, serviceMemo, feeTransfer, transfer x3]
    expect(decompiled.instructions).toHaveLength(7)
    for (let i = 4; i < 7; i++) {
      expect(decompiled.instructions[i].programId.toString()).toBe(SystemProgram.programId.toString())
    }
  })

  it('splits recipients exceeding MAX_RECIPIENTS_PER_TRANSACTION (10) into multiple transactions', async () => {
    const recipients = makeRecipients(12)
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients, decimals: 9 })
    expect(result.transactions).toHaveLength(2)
  })

  it('builds SPL transfers with idempotent ATA creation for the classic Token program', async () => {
    const recipients = makeRecipients(2)
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients, decimals: 6 })

    const decompiled = TransactionMessage.decompile(result.transactions[0].message)
    // [computeLimit, computePrice, serviceMemo, feeTransfer, (createATA+transfer) x2] = 8
    expect(decompiled.instructions).toHaveLength(8)
    expect(decompiled.instructions[4].programId.toString()).toBe(ASSOCIATED_TOKEN_PROGRAM_ID.toString()) // createATA idempotent
    expect(decompiled.instructions[5].programId.toString()).toBe(TOKEN_PROGRAM_ID.toString()) // transfer

    const sourceATA = getAssociatedTokenAddressSync(MINT, WALLET, false, TOKEN_PROGRAM_ID)
    expect(decompiled.instructions[5].keys[0].pubkey.toString()).toBe(sourceATA.toString())
  })

  it('uses TOKEN_2022_PROGRAM_ID when the mint resolves under Token-2022', async () => {
    mockGetMint.mockImplementation(async (_conn, _mint, _commitment, programId) => {
      if (programId === TOKEN_2022_PROGRAM_ID) return { decimals: 6 }
      throw new Error('not classic')
    })

    const recipients = makeRecipients(1)
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients, decimals: 6 })
    const decompiled = TransactionMessage.decompile(result.transactions[0].message)
    expect(decompiled.instructions[5].programId.toString()).toBe(TOKEN_2022_PROGRAM_ID.toString())
  })

  it('scales the service fee transfer by the number of recipients in each chunk', async () => {
    const recipients = makeRecipients(12)
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients, decimals: 9 })
    // totalServiceFee = 0.001 * 12 recipients
    expect(result.totalServiceFee).toBeCloseTo(0.012, 6)
  })

  it('omits the service fee transfer when the fee resolves to zero', async () => {
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0, couponMemoInstruction: null })
    const recipients = makeRecipients(2)
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients, decimals: 9 })

    const decompiled = TransactionMessage.decompile(result.transactions[0].message)
    // [computeLimit, computePrice, serviceMemo, transfer x2] = 5 (no fee transfer)
    expect(decompiled.instructions).toHaveLength(5)
    expect(result.totalServiceFee).toBe(0)
  })

  it('rejects when the token mint cannot be found under either program', async () => {
    mockGetMint.mockRejectedValue(new Error('nope'))
    await expect(
      createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients: makeRecipients(1), decimals: 6 })
    ).rejects.toMatchObject({ code: 'TOKEN_NOT_FOUND' })
  })
})
