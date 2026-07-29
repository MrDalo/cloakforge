import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, TransactionMessage, SystemProgram } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token'
import { createDonationTransaction } from '../createDonationTransaction'
import getServerConfig from '@/lib/config/getServerConfig'

vi.mock('server-only', () => ({}))

const FEE_WALLET = Keypair.generate().publicKey

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({
    rpcPrivateEndpoint: 'https://api.devnet.solana.com',
    get feeWalletAddress() {
      return FEE_WALLET.toString()
    },
  })),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
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

describe('createDonationTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetMint = vi.fn().mockImplementation(async (_conn, _mint, _commitment, programId) => {
      if (programId === TOKEN_2022_PROGRAM_ID) throw new Error('not token-2022')
      return { decimals: 9 } // classic Token program resolves by default
    })
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toString(), lastValidBlockHeight: 999 })
  })

  it('builds a SOL transfer transaction when no mint is provided', async () => {
    const result = await createDonationTransaction({ walletPublicKey: WALLET, amount: 0.25 })

    const decompiled = TransactionMessage.decompile(result.transaction.message)
    // [computeLimit, computePrice, serviceMemo, transfer]
    expect(decompiled.instructions).toHaveLength(4)
    const transferIx = decompiled.instructions[3]
    expect(transferIx.programId.toString()).toBe(SystemProgram.programId.toString())
    expect(result.blockhash).toBeDefined()
    expect(result.lastValidBlockHeight).toBe(999)
  })

  it('builds an SPL transfer for the classic Token program when the mint is not Token-2022', async () => {
    const result = await createDonationTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, amount: 1 })

    const decompiled = TransactionMessage.decompile(result.transaction.message)
    // [computeLimit, computePrice, serviceMemo, createATA(idempotent), transfer]
    expect(decompiled.instructions).toHaveLength(5)
    expect(decompiled.instructions[4].programId.toString()).toBe(TOKEN_PROGRAM_ID.toString())
  })

  it('builds an SPL transfer for Token-2022 when the mint resolves under that program', async () => {
    mockGetMint.mockImplementation(async (_conn, _mint, _commitment, programId) => {
      if (programId === TOKEN_2022_PROGRAM_ID) return { decimals: 6 }
      throw new Error('not classic')
    })

    const result = await createDonationTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, amount: 1 })
    const decompiled = TransactionMessage.decompile(result.transaction.message)
    expect(decompiled.instructions[4].programId.toString()).toBe(TOKEN_2022_PROGRAM_ID.toString())
  })

  it('derives the source and destination ATAs from wallet and treasury addresses', async () => {
    const result = await createDonationTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, amount: 1 })
    const decompiled = TransactionMessage.decompile(result.transaction.message)
    const transferIx = decompiled.instructions[4]
    const expectedSource = getAssociatedTokenAddressSync(MINT, WALLET, false, TOKEN_PROGRAM_ID)
    const expectedDest = getAssociatedTokenAddressSync(MINT, FEE_WALLET, false, TOKEN_PROGRAM_ID)
    expect(transferIx.keys[0].pubkey.toString()).toBe(expectedSource.toString())
    expect(transferIx.keys[1].pubkey.toString()).toBe(expectedDest.toString())
  })

  it('rejects when the token mint cannot be found under either program', async () => {
    mockGetMint.mockRejectedValue(new Error('nope'))
    await expect(createDonationTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, amount: 1 })).rejects.toMatchObject({
      code: 'TOKEN_NOT_FOUND',
    })
  })

  it('rejects when the treasury wallet is not configured', async () => {
    vi.mocked(getServerConfig).mockReturnValueOnce({
      rpcPrivateEndpoint: 'https://api.devnet.solana.com',
      feeWalletAddress: '',
    } as ReturnType<typeof getServerConfig>)

    await expect(createDonationTransaction({ walletPublicKey: WALLET, amount: 1 })).rejects.toMatchObject({
      code: 'TRANSACTION_FAILED',
    })
  })
})
