import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, type PublicKey } from '@solana/web3.js'
import { AuthorityType, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, createSetAuthorityInstruction } from '@solana/spl-token'
import { createRevokeMetadataAuthorityTransaction } from '../createRevokeMetadataAuthorityTransaction'
import { AppError } from '@/lib/errors'
import { mintAccountInfo, mintExtension } from '@/__tests__/utils/mintAccountFixtures'

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

const mockGetCachedToolConfig = vi.fn()
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: (...args: unknown[]) => mockGetCachedToolConfig(...args),
}))

const mockApplyCouponToServiceFee = vi.fn()
vi.mock('../discountedServiceFee', () => ({
  applyCouponToServiceFee: (...args: unknown[]) => mockApplyCouponToServiceFee(...args),
}))

let mockGetAccountInfo: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>
let mockGetLatestBlockhash: ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>

vi.mock('@/lib/solana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/solana')>()
  return {
    ...actual,
    createConnectionPair: vi.fn(() => ({
      legacyConnection: {
        getAccountInfo: (...args: unknown[]) => mockGetAccountInfo(...args),
        getLatestBlockhash: (...args: unknown[]) => mockGetLatestBlockhash(...args),
      },
      kitRpc: {},
    })),
    calculateDynamicPriorityFee: vi.fn().mockResolvedValue(1500),
  }
})

const WALLET = Keypair.generate().publicKey
const TOKEN = Keypair.generate().publicKey
const OTHER = Keypair.generate().publicKey

/** Token-2022 mint with embedded metadata, as created by the Token Creator. */
const token2022Mint = ({ updateAuthority, pointerAuthority }: { updateAuthority: PublicKey | null; pointerAuthority: PublicKey | null }) =>
  mintAccountInfo({
    mintAuthority: WALLET,
    extensions: [
      mintExtension.metadataPointer(pointerAuthority, TOKEN),
      mintExtension.tokenMetadata({ updateAuthority, mint: TOKEN, name: 'Test Token', symbol: 'TST', uri: 'https://example.com/m.json' }),
    ],
  })

/** The SetAuthority(MetadataPointer → None) instruction as @solana/spl-token builds it. */
const expectedPointerRevocation = () =>
  createSetAuthorityInstruction(TOKEN, WALLET, AuthorityType.MetadataPointer, null, [], TOKEN_2022_PROGRAM_ID)

describe('createRevokeMetadataAuthorityTransaction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCachedToolConfig.mockResolvedValue({ baseFee: 0.1 })
    mockApplyCouponToServiceFee.mockResolvedValue({ feeSOL: 0.1, couponInstructions: [] })
    mockGetAccountInfo = vi.fn().mockResolvedValue(token2022Mint({ updateAuthority: WALLET, pointerAuthority: WALLET }))
    mockGetLatestBlockhash = vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toString() })
  })

  it('rejects a mint that is not owned by TOKEN_2022_PROGRAM_ID', async () => {
    mockGetAccountInfo.mockResolvedValue({ owner: TOKEN_PROGRAM_ID })
    await expect(createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    })
  })

  it('rejects when neither the update authority nor the metadata pointer authority is set (already immutable)', async () => {
    mockGetAccountInfo.mockResolvedValue(token2022Mint({ updateAuthority: null, pointerAuthority: null }))
    await expect(createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects when the wallet holds neither metadata authority', async () => {
    mockGetAccountInfo.mockResolvedValue(token2022Mint({ updateAuthority: OTHER, pointerAuthority: OTHER }))
    await expect(createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('rejects a Token-2022 mint without embedded metadata', async () => {
    mockGetAccountInfo.mockResolvedValue(mintAccountInfo({ extensions: [mintExtension.metadataPointer(WALLET, TOKEN)] }))
    await expect(createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'INVALID_INPUT',
    })
  })

  it('rejects an account that is owned by Token-2022 but is not a mint', async () => {
    mockGetAccountInfo.mockResolvedValue({
      ...token2022Mint({ updateAuthority: WALLET, pointerAuthority: WALLET }),
      data: Buffer.alloc(10),
    })
    await expect(createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'INVALID_MINT',
    })
  })

  it('passes the coupon code and payer, and surfaces coupon errors unchanged', async () => {
    mockApplyCouponToServiceFee.mockRejectedValue(new AppError('INVALID_INPUT', 'Discount coupon is invalid or no longer available', 400))

    await expect(
      createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN, couponCode: 'SAVE10' })
    ).rejects.toMatchObject({ code: 'INVALID_INPUT', message: 'Discount coupon is invalid or no longer available' })
    expect(mockApplyCouponToServiceFee).toHaveBeenCalledWith(expect.any(Number), 'SAVE10', WALLET)
  })

  it('revokes both the update authority and the metadata pointer authority when the wallet holds both', async () => {
    const { transaction } = await createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })

    // [computeLimit, computePrice, serviceMemo, feeTransfer, revokeUpdateAuthority, revokeMetadataPointerAuthority]
    expect(transaction.instructions).toHaveLength(6)

    const revokeIx = transaction.instructions[4]
    expect(revokeIx.programId.toString()).toBe(TOKEN_2022_PROGRAM_ID.toString())
    expect(revokeIx.keys[0].pubkey.toString()).toBe(TOKEN.toString())
    expect(revokeIx.keys[1].pubkey.toString()).toBe(WALLET.toString())

    // Byte-for-byte the instruction @solana/spl-token builds for SetAuthority(MetadataPointer, None)
    const pointerIx = transaction.instructions[5]
    const expected = expectedPointerRevocation()
    expect(pointerIx.programId.equals(TOKEN_2022_PROGRAM_ID)).toBe(true)
    expect(Buffer.from(pointerIx.data).equals(Buffer.from(expected.data))).toBe(true)
    expect(pointerIx.keys).toEqual(expected.keys)
    expect(() => transaction.serialize({ requireAllSignatures: false })).not.toThrow()
  })

  it('skips the metadata pointer when its authority is already revoked', async () => {
    mockGetAccountInfo.mockResolvedValue(token2022Mint({ updateAuthority: WALLET, pointerAuthority: null }))
    const { transaction } = await createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })

    expect(transaction.instructions).toHaveLength(5)
    expect(transaction.instructions.some((ix) => Buffer.from(ix.data).equals(Buffer.from(expectedPointerRevocation().data)))).toBe(false)
  })

  it('refuses when the wallet holds the metadata pointer authority but another account holds the update authority', async () => {
    mockGetAccountInfo.mockResolvedValue(token2022Mint({ updateAuthority: OTHER, pointerAuthority: WALLET }))

    const error = await createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN }).catch(
      (e: unknown) => e
    )

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({ code: 'UNAUTHORIZED', status: 403 })
    expect((error as AppError).message).toContain('metadata update authority')
    expect((error as AppError).message).not.toContain('metadata pointer authority')
    // Fails before any fee is calculated or instruction is built
    expect(mockApplyCouponToServiceFee).not.toHaveBeenCalled()
    expect(mockGetLatestBlockhash).not.toHaveBeenCalled()
  })

  it('refuses when the wallet holds the update authority but another account holds the metadata pointer authority', async () => {
    mockGetAccountInfo.mockResolvedValue(token2022Mint({ updateAuthority: WALLET, pointerAuthority: OTHER }))

    const error = await createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN }).catch(
      (e: unknown) => e
    )

    expect(error).toBeInstanceOf(AppError)
    expect(error).toMatchObject({ code: 'UNAUTHORIZED', status: 403 })
    expect((error as AppError).message).toContain('metadata pointer authority')
    expect((error as AppError).message).not.toContain('metadata update authority')
    expect(mockApplyCouponToServiceFee).not.toHaveBeenCalled()
    expect(mockGetLatestBlockhash).not.toHaveBeenCalled()
  })

  it('refuses when the only remaining authority is held by another account (update authority already revoked)', async () => {
    mockGetAccountInfo.mockResolvedValue(token2022Mint({ updateAuthority: null, pointerAuthority: OTHER }))
    await expect(createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    })
  })

  it('revokes only the metadata pointer authority when the update authority is already revoked', async () => {
    // Tokens created with "immutable metadata" before the pointer fix: name/symbol locked, pointer still redirectable
    mockGetAccountInfo.mockResolvedValue(token2022Mint({ updateAuthority: null, pointerAuthority: WALLET }))
    const { transaction } = await createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })

    expect(transaction.instructions).toHaveLength(5)
    const pointerIx = transaction.instructions[4]
    expect(Buffer.from(pointerIx.data).equals(Buffer.from(expectedPointerRevocation().data))).toBe(true)
    expect(pointerIx.keys).toEqual(expectedPointerRevocation().keys)
  })

  it('falls back to the default base fee when tool config lookup fails, and still builds a valid transaction', async () => {
    mockGetCachedToolConfig.mockRejectedValue(new Error('contentful down'))

    const result = await createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: TOKEN })

    expect(result.transaction.instructions.length).toBeGreaterThan(0)
    expect(() => result.transaction.serialize({ requireAllSignatures: false })).not.toThrow()
  })
})
