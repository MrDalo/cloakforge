import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { type AccountInfo, type Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js'
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'
import {
  metaplexMetadataData,
  mintAccountInfo,
  mintExtension,
  tokenAccountInfo,
  type MintFixtureOptions,
} from '@/__tests__/utils/mintAccountFixtures'
import { deriveMetadataPDA, TOKEN_METADATA_PROGRAM_ID } from '@/lib/solana/getTokenMetadata'
import {
  AUDIT_RPC_TIMEOUT_MS,
  collectTokenAuditFacts,
  createAuditConnection,
  fetchWithAuditTimeout,
  TOP_HOLDER_LIMIT,
} from '../collectTokenAuditFacts'

const MINT = Keypair.generate().publicKey
const METAPLEX_PDA = deriveMetadataPDA(MINT)
const CREATOR = Keypair.generate().publicKey

interface LargestAccount {
  address: PublicKey
  amount: bigint
  account: AccountInfo<Buffer> | null
}

interface ConnectionFixture {
  mint?: AccountInfo<Buffer> | null
  metaplex?: AccountInfo<Buffer> | null
  largest?: LargestAccount[] | Error
  epoch?: number | Error
}

/** Mock connection serving one mint; records every RPC request. */
function createConnection({ mint = mintAccountInfo(), metaplex = null, largest = [], epoch = 500 }: ConnectionFixture = {}) {
  const getMultipleAccountsInfo = vi.fn(async (keys: PublicKey[]) => {
    if (keys[0].equals(MINT)) {
      return [mint, metaplex]
    }
    const accounts = largest instanceof Error ? [] : largest
    return keys.map((key) => accounts.find((entry) => entry.address.equals(key))?.account ?? null)
  })
  const getTokenLargestAccounts = vi.fn(async () => {
    if (largest instanceof Error) throw largest
    return {
      context: { slot: 1 },
      value: largest.map(({ address, amount }) => ({
        address,
        amount: amount.toString(),
        decimals: 6,
        uiAmount: null,
        uiAmountString: '',
      })),
    }
  })
  const getEpochInfo = vi.fn(async () => {
    if (epoch instanceof Error) throw epoch
    return { epoch, slotIndex: 0, slotsInEpoch: 432_000, absoluteSlot: 1, blockHeight: 1 }
  })
  const connection = { getMultipleAccountsInfo, getTokenLargestAccounts, getEpochInfo } as unknown as Connection
  const requestCount = (): number =>
    getMultipleAccountsInfo.mock.calls.length + getTokenLargestAccounts.mock.calls.length + getEpochInfo.mock.calls.length
  return { connection, getMultipleAccountsInfo, getTokenLargestAccounts, getEpochInfo, requestCount }
}

/** A top-holder entry whose token account is owned by `owner`. */
const holder = (owner: PublicKey, amount: bigint, programId?: PublicKey): LargestAccount => ({
  address: Keypair.generate().publicKey,
  amount,
  account: tokenAccountInfo(MINT, owner, amount, programId),
})

const metaplexAccount = (overrides: Partial<Parameters<typeof metaplexMetadataData>[0]> = {}): AccountInfo<Buffer> => ({
  data: metaplexMetadataData({ updateAuthority: CREATOR, mint: MINT, ...overrides }),
  owner: TOKEN_METADATA_PROGRAM_ID,
  lamports: 1,
  executable: false,
  rentEpoch: 0,
})

const token2022Mint = (options: MintFixtureOptions): AccountInfo<Buffer> => mintAccountInfo({ program: 'token-2022', ...options })

describe('collectTokenAuditFacts', () => {
  it('should read a classic SPL mint with Metaplex metadata in three requests', async () => {
    const { connection, requestCount, getEpochInfo } = createConnection({
      mint: mintAccountInfo({ decimals: 6, supply: BigInt('1000000500000'), mintAuthority: CREATOR }),
      metaplex: metaplexAccount({ isMutable: false }),
      largest: [holder(Keypair.generate().publicKey, BigInt(10))],
    })

    const facts = await collectTokenAuditFacts(connection, MINT)

    expect(facts).toMatchObject({
      mint: MINT.toBase58(),
      tokenProgram: 'spl-token',
      decimals: 6,
      supplyRaw: '1000000500000',
      supplyDisplay: '1,000,000.5',
      mintAuthority: CREATOR.toBase58(),
      freezeAuthority: null,
      extensions: null,
      externalMetadataAddress: null,
    })
    // NUL padding stripped from the stored strings
    expect(facts.metadata).toEqual({
      source: 'metaplex',
      name: 'Test Token',
      symbol: 'TST',
      uri: 'https://example.com/m.json',
      updateAuthority: CREATOR.toBase58(),
      isMutable: false,
    })
    expect(requestCount()).toBe(3)
    expect(getEpochInfo).not.toHaveBeenCalled()
  })

  it('should read the largest accounts only after the account fetch showed a valid mint', async () => {
    const { connection, getMultipleAccountsInfo, getTokenLargestAccounts } = createConnection({
      largest: [holder(Keypair.generate().publicKey, BigInt(10))],
    })
    getTokenLargestAccounts.mockImplementation(async () => {
      expect(getMultipleAccountsInfo).toHaveBeenCalledTimes(1)
      return { context: { slot: 1 }, value: [] }
    })

    await collectTokenAuditFacts(connection, MINT)

    expect(getTokenLargestAccounts).toHaveBeenCalledTimes(1)
  })

  it('should not read the largest accounts of a mint with zero supply', async () => {
    const { connection, requestCount, getTokenLargestAccounts } = createConnection({ mint: mintAccountInfo({ supply: BigInt(0) }) })
    expect((await collectTokenAuditFacts(connection, MINT)).holders).toBeNull()
    expect(getTokenLargestAccounts).not.toHaveBeenCalled()
    expect(requestCount()).toBe(1)
  })

  it('should fetch the mint and its Metaplex PDA together', async () => {
    const { connection, getMultipleAccountsInfo } = createConnection()
    await collectTokenAuditFacts(connection, MINT)
    const [keys] = getMultipleAccountsInfo.mock.calls[0]
    expect(keys.map((key: PublicKey) => key.toBase58())).toEqual([MINT.toBase58(), METAPLEX_PDA.toBase58()])
  })

  it.each([
    ['owned by another program', { ...metaplexAccount(), owner: SystemProgram.programId }],
    ['for a different mint', { ...metaplexAccount(), data: metaplexMetadataData({ updateAuthority: CREATOR, mint: CREATOR }) }],
    ['malformed', { ...metaplexAccount(), data: Buffer.from([4, 1, 2]) }],
  ])('should ignore a Metaplex account that is %s', async (_label, metaplex) => {
    const { connection } = createConnection({ metaplex })
    expect((await collectTokenAuditFacts(connection, MINT)).metadata).toBeNull()
  })

  it('should strip spoofing characters from creator-controlled metadata and cap its length', async () => {
    const { connection } = createConnection({
      metaplex: metaplexAccount({ name: 'US‮DC​', symbol: 'ABCDEFGHIJ' }),
    })
    const facts = await collectTokenAuditFacts(connection, MINT)
    expect(facts.metadata?.name).toBe('USDC')

    const long = createConnection({
      mint: token2022Mint({
        extensions: [
          mintExtension.metadataPointer(null, MINT),
          mintExtension.tokenMetadata({ updateAuthority: null, mint: MINT, name: 'N'.repeat(80), symbol: 'S', uri: '' }),
        ],
      }),
    })
    expect((await collectTokenAuditFacts(long.connection, MINT)).metadata?.name).toBe(`${'N'.repeat(64)}…`)
  })

  it('should read Token-2022 metadata stored in the mint when the pointer targets the mint', async () => {
    const { connection } = createConnection({
      mint: token2022Mint({
        extensions: [
          mintExtension.metadataPointer(CREATOR, MINT),
          mintExtension.tokenMetadata({ updateAuthority: CREATOR, mint: MINT, name: 'Embedded', symbol: 'EMB', uri: 'ipfs://x' }),
        ],
      }),
      metaplex: metaplexAccount(),
    })

    const facts = await collectTokenAuditFacts(connection, MINT)

    expect(facts.tokenProgram).toBe('token-2022')
    expect(facts.metadata).toMatchObject({ source: 'token-2022', name: 'Embedded', updateAuthority: CREATOR.toBase58(), isMutable: true })
    expect(facts.extensions?.metadataPointer).toEqual({ authority: CREATOR.toBase58(), metadataAddress: MINT.toBase58() })
  })

  it('should report a pointer to another account as external instead of reading it', async () => {
    const external = Keypair.generate().publicKey
    const { connection } = createConnection({
      mint: token2022Mint({ extensions: [mintExtension.metadataPointer(null, external)] }),
      metaplex: metaplexAccount(),
    })

    const facts = await collectTokenAuditFacts(connection, MINT)
    expect(facts.metadata).toBeNull()
    expect(facts.externalMetadataAddress).toBe(external.toBase58())
  })

  it('should read the Metaplex account when the pointer targets it', async () => {
    const { connection } = createConnection({
      mint: token2022Mint({ extensions: [mintExtension.metadataPointer(null, METAPLEX_PDA)] }),
      metaplex: metaplexAccount(),
    })
    expect((await collectTokenAuditFacts(connection, MINT)).metadata?.source).toBe('metaplex')
  })

  it('should read the epoch only for transfer-fee mints, and degrade to an unknown current fee', async () => {
    const feeMint = token2022Mint({
      extensions: [mintExtension.transferFeeConfig({ authority: null, older: { basisPoints: 100 }, newer: { basisPoints: 100 } })],
    })
    const ok = createConnection({ mint: feeMint })
    expect((await collectTokenAuditFacts(ok.connection, MINT)).extensions?.transferFee?.inForce.basisPoints).toBe(100)
    expect(ok.getEpochInfo).toHaveBeenCalledTimes(1)
    expect(ok.requestCount()).toBeLessThanOrEqual(4)

    const failing = createConnection({ mint: feeMint, epoch: new Error('rpc down') })
    expect((await collectTokenAuditFacts(failing.connection, MINT)).extensions?.transferFee?.epochKnown).toBe(false)
  })

  describe('holder concentration', () => {
    const SUPPLY = BigInt(1_000_000)

    it('should classify owners as wallet, program-controlled or unknown and sum shares per wallet', async () => {
      const whale = Keypair.generate().publicKey
      const [poolAuthority] = PublicKey.findProgramAddressSync([Buffer.from('pool')], SystemProgram.programId)
      const unreadable: LargestAccount = { address: Keypair.generate().publicKey, amount: BigInt(50_000), account: null }
      const { connection } = createConnection({
        mint: mintAccountInfo({ supply: SUPPLY }),
        largest: [holder(poolAuthority, BigInt(300_000)), holder(whale, BigInt(150_000)), holder(whale, BigInt(100_000)), unreadable],
      })

      const { holders } = await collectTokenAuditFacts(connection, MINT)

      expect(holders?.topHolders.map((entry) => entry.kind)).toEqual(['program-controlled', 'wallet', 'wallet', 'unknown'])
      expect(holders?.topHolders[3].owner).toBeNull()
      expect(holders).toMatchObject({
        top10SharePercent: 60,
        walletSharePercent: 25,
        largestWalletSharePercent: 25,
        unclassifiedSharePercent: 35,
      })
      expect(holders?.topHolders[0]).toMatchObject({ amountRaw: '300000', sharePercent: 30, owner: poolAuthority.toBase58() })
    })

    it('should not trust a token account that belongs to another mint', async () => {
      const foreign: LargestAccount = {
        address: Keypair.generate().publicKey,
        amount: BigInt(10),
        account: tokenAccountInfo(Keypair.generate().publicKey, Keypair.generate().publicKey, BigInt(10)),
      }
      const { connection } = createConnection({ mint: mintAccountInfo({ supply: SUPPLY }), largest: [foreign] })
      expect((await collectTokenAuditFacts(connection, MINT)).holders?.topHolders[0].kind).toBe('unknown')
    })

    it('should read Token-2022 token accounts with the Token-2022 program', async () => {
      const wallet = Keypair.generate().publicKey
      const { connection } = createConnection({
        mint: token2022Mint({ supply: SUPPLY }),
        largest: [holder(wallet, BigInt(1_000), TOKEN_2022_PROGRAM_ID)],
      })
      expect((await collectTokenAuditFacts(connection, MINT)).holders?.topHolders[0]).toMatchObject({
        kind: 'wallet',
        owner: wallet.toBase58(),
      })
    })

    it(`should analyze at most ${TOP_HOLDER_LIMIT} accounts`, async () => {
      const largest = Array.from({ length: 20 }, () => holder(Keypair.generate().publicKey, BigInt(1_000)))
      const { connection, getMultipleAccountsInfo } = createConnection({ mint: mintAccountInfo({ supply: SUPPLY }), largest })

      const { holders } = await collectTokenAuditFacts(connection, MINT)

      expect(holders?.topHolders).toHaveLength(TOP_HOLDER_LIMIT)
      expect(getMultipleAccountsInfo.mock.calls[1][0]).toHaveLength(TOP_HOLDER_LIMIT)
    })

    it('should report holders as not analyzed when the largest accounts cannot be read', async () => {
      const { connection } = createConnection({ largest: new Error('method not supported') })
      const facts = await collectTokenAuditFacts(connection, MINT)
      expect(facts.holders).toBeNull()
      expect(facts.mint).toBe(MINT.toBase58())
    })

    it('should not query owners for a mint with zero supply', async () => {
      const { connection, getMultipleAccountsInfo } = createConnection({ mint: mintAccountInfo({ supply: BigInt(0) }) })
      expect((await collectTokenAuditFacts(connection, MINT)).holders).toBeNull()
      expect(getMultipleAccountsInfo).toHaveBeenCalledTimes(1)
    })
  })

  describe('errors', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should reject a missing account with TOKEN_NOT_FOUND after exactly one RPC request', async () => {
      const { connection, requestCount, getTokenLargestAccounts } = createConnection({ mint: null })
      await expect(collectTokenAuditFacts(connection, MINT)).rejects.toMatchObject({ code: 'TOKEN_NOT_FOUND' })
      expect(getTokenLargestAccounts).not.toHaveBeenCalled()
      expect(requestCount()).toBe(1)
    })

    it('should reject an account that is not a mint with INVALID_MINT after exactly one RPC request', async () => {
      const { connection, requestCount, getTokenLargestAccounts } = createConnection({ mint: tokenAccountInfo(MINT, CREATOR, BigInt(1)) })
      await expect(collectTokenAuditFacts(connection, MINT)).rejects.toMatchObject({ code: 'INVALID_MINT' })
      expect(getTokenLargestAccounts).not.toHaveBeenCalled()
      expect(requestCount()).toBe(1)
    })

    it('should time out a hanging RPC request', async () => {
      vi.useFakeTimers()
      const connection = {
        getMultipleAccountsInfo: vi.fn(() => new Promise(() => undefined)),
        getTokenLargestAccounts: vi.fn(() => new Promise(() => undefined)),
        getEpochInfo: vi.fn(),
      } as unknown as Connection

      const pending = collectTokenAuditFacts(connection, MINT)
      const assertion = expect(pending).rejects.toMatchObject({ code: 'RPC_CONNECTION_FAILED' })
      await vi.advanceTimersByTimeAsync(AUDIT_RPC_TIMEOUT_MS + 1)
      await assertion
    })
  })

  describe('audit connection', () => {
    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })

    /** Stubs the global fetch and the timeout signal so the abort can be triggered by hand. */
    function stubFetch() {
      const timeoutController = new AbortController()
      const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutController.signal)
      const fetchMock = vi.fn(async (..._args: Parameters<typeof fetch>) => new Response('{}'))
      vi.stubGlobal('fetch', fetchMock)
      const sentSignal = (): AbortSignal => fetchMock.mock.calls[0][1]?.signal as AbortSignal
      return { timeoutController, timeoutSpy, fetchMock, sentSignal }
    }

    it('should abort the HTTP request when the audit timeout elapses', async () => {
      const { timeoutController, timeoutSpy, fetchMock, sentSignal } = stubFetch()

      await fetchWithAuditTimeout('https://private-rpc.example', { method: 'POST', body: '{}' })

      expect(timeoutSpy).toHaveBeenCalledWith(AUDIT_RPC_TIMEOUT_MS)
      expect(fetchMock.mock.calls[0][0]).toBe('https://private-rpc.example')
      expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: '{}' })
      expect(sentSignal().aborted).toBe(false)
      timeoutController.abort()
      expect(sentSignal().aborted).toBe(true)
    })

    it('should also abort when the incoming signal aborts', async () => {
      const { sentSignal } = stubFetch()
      const incoming = new AbortController()

      await fetchWithAuditTimeout('https://private-rpc.example', { signal: incoming.signal })

      expect(sentSignal().aborted).toBe(false)
      incoming.abort()
      expect(sentSignal().aborted).toBe(true)
    })

    it('should create a connection that does not retry on 429 and sends requests with the aborting fetch', async () => {
      const { fetchMock, sentSignal } = stubFetch()
      fetchMock.mockImplementation(async () => new Response('Too Many Requests', { status: 429 }))
      const connection = createAuditConnection('https://private-rpc.example')

      await expect(connection.getEpochInfo('confirmed')).rejects.toThrow()

      expect(connection.rpcEndpoint).toBe('https://private-rpc.example')
      // web3.js would retry a 429 up to 5 times by default
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(sentSignal()).toBeInstanceOf(AbortSignal)
    })
  })
})
