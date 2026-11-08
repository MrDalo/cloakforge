import { describe, it, expect, vi } from 'vitest'
import { Keypair, PublicKey, SystemProgram, type Connection } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, MINT_SIZE, ACCOUNT_SIZE, MintLayout } from '@solana/spl-token'
import { decodeMintAccount, getMintAccountInfo } from '../getMintAccountInfo'
import { mintAccountInfo, mintExtension } from '@/__tests__/utils/mintAccountFixtures'

vi.mock('server-only', () => ({}))

const MINT = Keypair.generate().publicKey

const makeMintData = (decimals: number, isInitialized = true): Buffer => {
  const data = Buffer.alloc(MINT_SIZE)
  MintLayout.encode(
    {
      mintAuthorityOption: 0,
      mintAuthority: PublicKey.default,
      supply: BigInt(0),
      decimals,
      isInitialized,
      freezeAuthorityOption: 0,
      freezeAuthority: PublicKey.default,
    },
    data
  )
  return data
}

const connectionReturning = (accountInfo: unknown): Connection =>
  ({ getAccountInfo: vi.fn().mockResolvedValue(accountInfo) }) as unknown as Connection

const account = (data: Buffer, owner: PublicKey) => ({ data, owner, lamports: 1, executable: false, rentEpoch: 0 })

describe('getMintAccountInfo', () => {
  it.each([
    [TOKEN_PROGRAM_ID, 0],
    [TOKEN_PROGRAM_ID, 6],
    [TOKEN_2022_PROGRAM_ID, 9],
  ])('should return the owning program (%s) and on-chain decimals (%i)', async (owner, decimals) => {
    const info = await getMintAccountInfo(connectionReturning(account(makeMintData(decimals), owner)), MINT)
    expect(info.programId.equals(owner)).toBe(true)
    expect(info.decimals).toBe(decimals)
  })

  it('should reject a missing account with TOKEN_NOT_FOUND', async () => {
    await expect(getMintAccountInfo(connectionReturning(null), MINT)).rejects.toMatchObject({ code: 'TOKEN_NOT_FOUND' })
  })

  it('should reject accounts not owned by a token program', async () => {
    await expect(getMintAccountInfo(connectionReturning(account(makeMintData(6), SystemProgram.programId)), MINT)).rejects.toMatchObject({
      code: 'INVALID_MINT',
    })
  })

  it('should reject a token account passed as a mint', async () => {
    await expect(
      getMintAccountInfo(connectionReturning(account(Buffer.alloc(ACCOUNT_SIZE), TOKEN_PROGRAM_ID)), MINT)
    ).rejects.toMatchObject({ code: 'INVALID_MINT' })
  })

  it('should reject an uninitialized mint', async () => {
    await expect(getMintAccountInfo(connectionReturning(account(makeMintData(6, false), TOKEN_PROGRAM_ID)), MINT)).rejects.toMatchObject({
      code: 'INVALID_MINT',
    })
  })
})

describe('decodeMintAccount', () => {
  it('should decode an already-fetched mint without an RPC call, including Token-2022 extension data', () => {
    const authority = Keypair.generate().publicKey
    const info = decodeMintAccount(
      MINT,
      mintAccountInfo({ decimals: 9, mintAuthority: authority, extensions: [mintExtension.metadataPointer(authority, MINT)] })
    )
    expect(info.programId.equals(TOKEN_2022_PROGRAM_ID)).toBe(true)
    expect(info.decimals).toBe(9)
    expect(info.mint.mintAuthority?.equals(authority)).toBe(true)
    expect(info.mint.tlvData.length).toBeGreaterThan(0)
  })

  it('should reject a missing account with TOKEN_NOT_FOUND', () => {
    expect(() => decodeMintAccount(MINT, null)).toThrow(expect.objectContaining({ code: 'TOKEN_NOT_FOUND' }))
  })
})
