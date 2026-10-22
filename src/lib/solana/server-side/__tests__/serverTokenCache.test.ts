import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Keypair } from '@solana/web3.js'
import { AppError } from '@/lib/errors'
import type { TokenAuditFacts } from '@/types/tokenAudit'

const mockCacheLife = vi.fn()
const mockCacheTag = vi.fn()
vi.mock('next/cache', () => ({
  cacheLife: (...args: unknown[]) => mockCacheLife(...args),
  cacheTag: (...args: unknown[]) => mockCacheTag(...args),
}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({ rpcPrivateEndpoint: 'https://private-rpc.example' })),
}))

const mockFetchCachedToolConfigurations = vi.fn()
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  fetchCachedToolConfigurations: () => mockFetchCachedToolConfigurations(),
}))
const auditorConfig = (isEnabled: boolean) => ({ available: true, configs: [{ toolId: 'token-auditor', isEnabled }] })

const auditConnection = { name: 'audit-connection' }
const mockCreateAuditConnection = vi.fn((_endpoint: string) => auditConnection)
const mockCollectTokenAuditFacts = vi.fn()
vi.mock('../collectTokenAuditFacts', () => ({
  collectTokenAuditFacts: (...args: unknown[]) => mockCollectTokenAuditFacts(...args),
  createAuditConnection: (endpoint: string) => mockCreateAuditConnection(endpoint),
}))

const { getTokenAudit, TOKEN_AUDIT_CACHE_LIFE } = await import('../serverTokenCache')

const MINT = Keypair.generate().publicKey.toBase58()

const facts: TokenAuditFacts = {
  mint: MINT,
  tokenProgram: 'spl-token',
  decimals: 6,
  supplyRaw: '1000',
  supplyDisplay: '0.001',
  mintAuthority: null,
  freezeAuthority: null,
  metadata: null,
  externalMetadataAddress: null,
  extensions: null,
  holders: null,
}

describe('getTokenAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCollectTokenAuditFacts.mockResolvedValue(facts)
    mockFetchCachedToolConfigurations.mockResolvedValue(auditorConfig(true))
  })

  it.each(['', 'not-an-address', '0'.repeat(44), `${MINT}<script>`])(
    'should reject %j before any RPC call or cache lookup',
    async (input) => {
      expect(await getTokenAudit(input)).toEqual({ status: 'invalid-address' })
      expect(mockCollectTokenAuditFacts).not.toHaveBeenCalled()
      expect(mockCacheTag).not.toHaveBeenCalled()
    }
  )

  it('should read the trimmed mint through the private RPC and return checks with a summary', async () => {
    const result = await getTokenAudit(`  ${MINT} `)

    expect(mockFetchCachedToolConfigurations).toHaveBeenCalled()
    expect(mockCreateAuditConnection).toHaveBeenCalledWith('https://private-rpc.example')
    const [connection, mintAddress] = mockCollectTokenAuditFacts.mock.calls[0]
    expect(connection).toBe(auditConnection)
    expect(mintAddress.toBase58()).toBe(MINT)

    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.report).toMatchObject({ ...facts })
    // Mint and freeze authority revoked, classic program, metadata and holders unknown
    expect(result.report.checks.map((check) => check.status)).toEqual(['pass', 'pass', 'pass', 'unknown', 'unknown'])
    expect(result.report.summary).toEqual({ pass: 3, warn: 0, fail: 0, unknown: 2, riskLevel: 'medium' })
    expect(Number.isNaN(Date.parse(result.report.analyzedAt))).toBe(false)
  })

  describe('server-side kill switch', () => {
    it('should return unavailable without any RPC call or cache lookup when the tool is disabled', async () => {
      mockFetchCachedToolConfigurations.mockResolvedValue(auditorConfig(false))

      expect(await getTokenAudit(MINT)).toEqual({ status: 'unavailable' })

      expect(mockCreateAuditConnection).not.toHaveBeenCalled()
      expect(mockCollectTokenAuditFacts).not.toHaveBeenCalled()
      expect(mockCacheTag).not.toHaveBeenCalled()
    })

    it('should fail closed without any RPC call when Contentful is unavailable', async () => {
      // fetchCachedToolConfigurations swallows Contentful errors and reports them as unavailable
      mockFetchCachedToolConfigurations.mockResolvedValue({ available: false, configs: [] })

      expect(await getTokenAudit(MINT)).toEqual({ status: 'unavailable' })

      expect(mockCreateAuditConnection).not.toHaveBeenCalled()
      expect(mockCollectTokenAuditFacts).not.toHaveBeenCalled()
    })

    it('should run the audit when no configuration exists, like the client-side default', async () => {
      mockFetchCachedToolConfigurations.mockResolvedValue({ available: true, configs: [{ toolId: 'burn-tokens', isEnabled: false }] })
      expect((await getTokenAudit(MINT)).status).toBe('ok')
    })

    it('should not look up the configuration for an invalid address', async () => {
      await getTokenAudit('not-an-address')
      expect(mockFetchCachedToolConfigurations).not.toHaveBeenCalled()
    })
  })

  it('should cache successful audits briefly under the token-audit tag', async () => {
    await getTokenAudit(MINT)
    expect(mockCacheTag).toHaveBeenCalledWith('token-audit')
    expect(mockCacheLife).toHaveBeenCalledWith(TOKEN_AUDIT_CACHE_LIFE)
    expect(TOKEN_AUDIT_CACHE_LIFE.expire).toBeLessThanOrEqual(300)
  })

  it.each([
    [new AppError('TOKEN_NOT_FOUND', 'Token mint not found'), 'not-found'],
    [new AppError('INVALID_MINT', 'not a mint'), 'not-a-mint'],
    [new AppError('RPC_CONNECTION_FAILED', 'Solana RPC request timed out'), 'unavailable'],
    [new Error('fetch failed: https://private-rpc.example/?api-key=secret'), 'unavailable'],
  ])('should map %s to a generic %s status and cache it for seconds only', async (error, status) => {
    mockCollectTokenAuditFacts.mockRejectedValue(error)

    const result = await getTokenAudit(MINT)

    expect(result).toEqual({ status })
    expect(JSON.stringify(result)).not.toContain('secret')
    expect(mockCacheLife).toHaveBeenCalledWith('seconds')
  })
})
