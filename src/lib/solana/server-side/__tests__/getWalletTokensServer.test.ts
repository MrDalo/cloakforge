/**
 * Tests for the SSRF / DoS bounds on image fetching in getWalletTokensServer (SRV-06 / WEB3-10).
 * The RPC connection and safeFetchJson are mocked; parseSafeUrl stays real.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair, PublicKey } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({ rpcPrivateEndpoint: 'https://rpc.example.com' })),
}))

const mockSafeFetchJson = vi.hoisted(() => vi.fn())
vi.mock('@/lib/security/safeFetch', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/security/safeFetch')>()),
  safeFetchJson: mockSafeFetchJson,
}))

const mockConnection = vi.hoisted(() => ({
  getParsedTokenAccountsByOwner: vi.fn(),
  getMultipleAccountsInfo: vi.fn(),
}))
vi.mock('@solana/web3.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@solana/web3.js')>()),
  Connection: vi.fn().mockImplementation(function MockConnection() {
    return mockConnection
  }),
}))

import {
  MAX_METADATA_FETCHES_PER_REQUEST,
  fetchImageFromMetadataUri,
  getWalletTokensWithMetadataServer,
  toSafeImageUrl,
} from '../getWalletTokensServer'

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
const WALLET = Keypair.generate().publicKey.toBase58()

function borshString(value: string): Buffer {
  const bytes = Buffer.from(value, 'utf8')
  const length = Buffer.alloc(4)
  length.writeUInt32LE(bytes.length)
  return Buffer.concat([length, bytes])
}

function metaplexAccount(mint: PublicKey, uri: string) {
  return {
    data: Buffer.concat([
      Buffer.from([4]),
      Buffer.alloc(32, 1),
      mint.toBuffer(),
      borshString('Spam'),
      borshString('SPAM'),
      borshString(uri),
    ]),
    owner: METADATA_PROGRAM_ID,
    executable: false,
    lamports: 1,
  }
}

/** Wallet holding `count` tokens, each with its own metadata URI. */
function setupWallet(count: number, uriFor: (index: number) => string = (i) => `https://spam${i}.example.com/meta.json`) {
  const mints = Array.from({ length: count }, () => Keypair.generate().publicKey)
  const uriByMint = new Map(mints.map((mint, index) => [mint.toBase58(), uriFor(index)]))

  mockConnection.getParsedTokenAccountsByOwner.mockImplementation(async (_owner: PublicKey, { programId }: { programId: PublicKey }) => ({
    value: programId.equals(TOKEN_PROGRAM_ID)
      ? mints.map((mint) => ({
          pubkey: Keypair.generate().publicKey,
          account: {
            data: {
              program: 'spl-token',
              parsed: {
                info: {
                  mint: mint.toBase58(),
                  tokenAmount: { amount: '1', decimals: 0, uiAmount: 1, uiAmountString: '1' },
                  state: 'initialized',
                },
              },
            },
            owner: TOKEN_PROGRAM_ID,
          },
        }))
      : [],
  }))

  // Index-aligned with the requested keys: both the mint and the metadata-PDA lookups get a
  // Metaplex account back (the mint lookup ignores it because the owner is not a token program).
  mockConnection.getMultipleAccountsInfo.mockImplementation(async (keys: PublicKey[]) =>
    keys.map((_, index) => metaplexAccount(mints[index], uriFor(index)))
  )

  return { mints, uriByMint }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getWalletTokensWithMetadataServer image fetching', () => {
  it('should not fetch any metadata URI when includeImages is false', async () => {
    setupWallet(5)

    const result = await getWalletTokensWithMetadataServer(WALLET, { toolType: 'burn-tokens', includeImages: false })

    expect(result.tokens).toHaveLength(5)
    expect(result.tokens[0].uri).toMatch(/^https:\/\/spam\d\.example\.com/)
    expect(mockSafeFetchJson).not.toHaveBeenCalled()
  })

  it('should cap metadata fetches per request and keep at most 5 in flight', async () => {
    setupWallet(60)
    let inFlight = 0
    let maxInFlight = 0
    mockSafeFetchJson.mockImplementation(async (uri: string) => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 5))
      inFlight--
      return { image: `${uri.replace('/meta.json', '')}/logo.png` }
    })

    const result = await getWalletTokensWithMetadataServer(WALLET, { toolType: 'burn-tokens', includeImages: true })

    expect(MAX_METADATA_FETCHES_PER_REQUEST).toBe(20)
    expect(mockSafeFetchJson).toHaveBeenCalledTimes(MAX_METADATA_FETCHES_PER_REQUEST)
    expect(maxInFlight).toBeLessThanOrEqual(5)
    expect(result.tokens).toHaveLength(60)
    expect(result.tokens.filter((token) => token.image)).toHaveLength(MAX_METADATA_FETCHES_PER_REQUEST)
  })

  it('should fetch a shared URI once and pass the request budget signal', async () => {
    setupWallet(10, () => 'https://shared.example.com/meta.json')
    mockSafeFetchJson.mockResolvedValue({ image: 'https://shared.example.com/logo.png' })

    const result = await getWalletTokensWithMetadataServer(WALLET, { toolType: 'burn-tokens', includeImages: true })

    expect(mockSafeFetchJson).toHaveBeenCalledOnce()
    expect(mockSafeFetchJson).toHaveBeenCalledWith(
      'https://shared.example.com/meta.json',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
    expect(result.tokens.every((token) => token.image === 'https://shared.example.com/logo.png')).toBe(true)
  })

  it('should drop unsafe image URLs returned by metadata and survive fetch failures', async () => {
    setupWallet(3)
    mockSafeFetchJson
      .mockResolvedValueOnce({ image: 'javascript:alert(1)' })
      .mockResolvedValueOnce({ image: 'https://169.254.169.254/latest' })
      .mockRejectedValueOnce(new Error('blocked'))

    const result = await getWalletTokensWithMetadataServer(WALLET, { toolType: 'burn-tokens', includeImages: true })

    expect(result.tokens).toHaveLength(3)
    expect(result.tokens.every((token) => token.image === undefined)).toBe(true)
  })
})

describe('toSafeImageUrl', () => {
  it('should keep https URLs and rewrite ipfs:// to the trusted gateway', () => {
    expect(toSafeImageUrl('https://arweave.net/abc')).toBe('https://arweave.net/abc')
    expect(toSafeImageUrl('ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG')).toBe(
      'https://gateway.pinata.cloud/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
    )
  })

  it('should drop non-https, IP-literal, local and non-string values', () => {
    for (const value of [
      'http://example.com/a.png',
      'javascript:alert(1)',
      'data:image/png;base64,AAAA',
      'https://10.0.0.1/a.png',
      'https://localhost/a.png',
      42,
      null,
      '',
    ]) {
      expect(toSafeImageUrl(value)).toBeNull()
    }
  })
})

describe('fetchImageFromMetadataUri', () => {
  it('should read image, imageUri or logo fields', async () => {
    mockSafeFetchJson.mockResolvedValueOnce({ image: '', logo: 'https://cdn.example.com/logo.png' })
    await expect(fetchImageFromMetadataUri('https://meta.example.com/a.json')).resolves.toBe('https://cdn.example.com/logo.png')
  })

  it('should return null for non-object metadata and on errors', async () => {
    mockSafeFetchJson.mockResolvedValueOnce(['https://cdn.example.com/logo.png'])
    await expect(fetchImageFromMetadataUri('https://meta.example.com/a.json')).resolves.toBeNull()

    mockSafeFetchJson.mockRejectedValueOnce(new Error('timeout'))
    await expect(fetchImageFromMetadataUri('https://meta.example.com/a.json')).resolves.toBeNull()
  })
})
