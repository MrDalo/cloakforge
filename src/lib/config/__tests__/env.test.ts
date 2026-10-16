import { readFileSync } from 'node:fs'
import path from 'node:path'
import { PublicKey } from '@solana/web3.js'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AppError } from '@/lib/errors'
import {
  PRODUCTION_RECOMMENDED_ENV_VARS,
  PRODUCTION_REQUIRED_ENV_VARS,
  collectEnvIssues,
  getEnvMode,
  getEnvValidationSkipReason,
  inferClusterFromRpcUrl,
  isBase58PublicKey,
  validateEnv,
  type EnvSource,
} from '../env'

const logger = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/logger/logger', () => ({ getLogger: () => logger }))

const SERVER_RPC = 'https://solana-mainnet.g.alchemy.com/v2/server-secret-key'
const CLIENT_RPC = 'https://solana-mainnet.g.alchemy.com/v2/client-public-key'
const DEVNET_RPC = 'https://solana-devnet.g.alchemy.com/v2/devnet-key'

const VALID_PROD_ENV: EnvSource = {
  NODE_ENV: 'production',
  RPC_PRIVATE_ENDPOINT: SERVER_RPC,
  NEXT_PUBLIC_RPC_ENDPOINT: CLIENT_RPC,
  FEE_WALLET_ADDRESS: 'So11111111111111111111111111111111111111112',
  CONTENTFUL_SPACE_ID: 'space-id',
  CONTENTFUL_ACCESS_TOKEN: 'cda-token',
  CONTENTFUL_REVALIDATE_SECRET: 'r'.repeat(32),
  IPFS_JWT: 'pinata-jwt',
  IPFS_GATEWAY: 'example.mypinata.cloud',
  COUPON_MEMO_SECRET: 'c'.repeat(32),
  LEGAL_ENTITY_NAME: 'Test Company s.r.o.',
  LEGAL_ENTITY_ADDRESS: 'Prague, Czech Republic',
  LEGAL_ENTITY_ICO: '12345678',
  LEGAL_CONTACT_EMAIL: 'legal@example.com',
  BETTERSTACK_SOURCE_TOKEN: 'bs-token',
  BETTERSTACK_INGEST_URL: 'https://in.logs.betterstack.com',
}

const withEnv = (overrides: Record<string, string | undefined>): EnvSource => ({ ...VALID_PROD_ENV, ...overrides })

const getThrownMessage = (env: EnvSource): string => {
  try {
    validateEnv(env)
  } catch (error) {
    expect(error).toBeInstanceOf(AppError)
    return (error as AppError).message
  }
  throw new Error('validateEnv did not throw')
}

describe('validateEnv', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should pass a complete, valid production env without warnings', () => {
    const report = validateEnv(VALID_PROD_ENV)

    expect(report).toMatchObject({ mode: 'production', skipped: null, missing: [], invalid: [], clusterMismatches: [], warnings: [] })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('should throw in production listing every missing var name', () => {
    const message = getThrownMessage(
      withEnv({ RPC_PRIVATE_ENDPOINT: undefined, FEE_WALLET_ADDRESS: '', IPFS_JWT: '   ', COUPON_MEMO_SECRET: undefined })
    )

    expect(message).toContain('Missing: RPC_PRIVATE_ENDPOINT, FEE_WALLET_ADDRESS, IPFS_JWT, COUPON_MEMO_SECRET')
    expect(logger.error).toHaveBeenCalledOnce()
  })

  it('should list all required var names when the production env is empty', () => {
    const message = getThrownMessage({ NODE_ENV: 'production' })

    for (const name of PRODUCTION_REQUIRED_ENV_VARS) {
      expect(message).toContain(name)
    }
  })

  it('should never include env values in the thrown message', () => {
    const message = getThrownMessage(
      withEnv({ NEXT_PUBLIC_RPC_ENDPOINT: 'http://insecure.example/v2/leaky-key', FEE_WALLET_ADDRESS: 'not-a-key' })
    )

    expect(message).toContain('NEXT_PUBLIC_RPC_ENDPOINT (must be an https:// URL)')
    expect(message).toContain('FEE_WALLET_ADDRESS (must be a base58 Solana public key)')
    expect(message).not.toContain('leaky-key')
    expect(message).not.toContain('not-a-key')
    expect(message).not.toContain('server-secret-key')
  })

  it('should treat VERCEL_ENV=production as production even without NODE_ENV', () => {
    expect(() => validateEnv({ VERCEL_ENV: 'production' })).toThrow(AppError)
  })

  it('should reject malformed values that are present', () => {
    const report = collectEnvIssues(withEnv({ IPFS_GATEWAY: 'https://example.mypinata.cloud/ipfs', NEXT_PUBLIC_SOLANA_NETWORK: 'mainnet' }))

    expect(report.missing).toEqual([])
    expect(report.invalid).toEqual([
      'IPFS_GATEWAY (must be a bare hostname without scheme or path)',
      'NEXT_PUBLIC_SOLANA_NETWORK (must be one of mainnet-beta, devnet, testnet)',
    ])
  })

  it('should not require CONTENTFUL_MANAGEMENT_TOKEN (coupons no longer write to Contentful)', () => {
    expect(PRODUCTION_REQUIRED_ENV_VARS).not.toContain('CONTENTFUL_MANAGEMENT_TOKEN')
    expect(validateEnv(withEnv({ CONTENTFUL_MANAGEMENT_TOKEN: undefined })).warnings).toEqual([])
  })

  it('should only warn, never throw, when the legal entity vars are missing in production', () => {
    const report = validateEnv(
      withEnv({ LEGAL_ENTITY_NAME: undefined, LEGAL_ENTITY_ADDRESS: '', LEGAL_ENTITY_ICO: '  ', LEGAL_CONTACT_EMAIL: undefined })
    )

    expect(report.missing).toEqual([])
    expect(report.invalid).toEqual([])
    expect(report.warnings).toEqual([
      'LEGAL_ENTITY_NAME is not set (legal entity details incomplete)',
      'LEGAL_ENTITY_ADDRESS is not set (legal entity details incomplete)',
      'LEGAL_ENTITY_ICO is not set (legal entity details incomplete)',
      'LEGAL_CONTACT_EMAIL is not set (legal entity details incomplete)',
    ])
    expect(logger.warn).toHaveBeenCalledOnce()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('should warn without echoing the value when LEGAL_CONTACT_EMAIL is malformed', () => {
    const report = validateEnv(withEnv({ LEGAL_CONTACT_EMAIL: 'legal [at] secret-domain' }))

    expect(report.invalid).toEqual([])
    expect(report.warnings).toEqual(['LEGAL_CONTACT_EMAIL is not a valid email address'])
    expect(report.warnings.join(' ')).not.toContain('secret-domain')
  })

  it('should not throw in development and warn only once', async () => {
    vi.resetModules()
    const { validateEnv: freshValidateEnv } = await import('../env')

    expect(() => freshValidateEnv({ NODE_ENV: 'development' })).not.toThrow()
    expect(() => freshValidateEnv({ NODE_ENV: 'development' })).not.toThrow()

    expect(logger.warn).toHaveBeenCalledOnce()
    expect(logger.warn.mock.calls[0][0]).toContain('Missing: RPC_PRIVATE_ENDPOINT')
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('should skip validation during the next build phase', () => {
    const report = validateEnv({ NODE_ENV: 'production', NEXT_PHASE: 'phase-production-build' })

    expect(report.skipped).toBe('next build phase')
  })

  it('should honor SKIP_ENV_VALIDATION outside Vercel Production only', () => {
    expect(validateEnv({ NODE_ENV: 'production', VERCEL_ENV: 'preview', SKIP_ENV_VALIDATION: 'true' }).skipped).toBe(
      'SKIP_ENV_VALIDATION is set'
    )
    expect(() => validateEnv({ NODE_ENV: 'production', VERCEL_ENV: 'production', SKIP_ENV_VALIDATION: 'true' })).toThrow(AppError)
  })

  it('should warn about public exposure of the private RPC and weak secrets', () => {
    const report = validateEnv(
      withEnv({ NEXT_PUBLIC_RPC_ENDPOINT: SERVER_RPC, COUPON_MEMO_SECRET: 'short', BETTERSTACK_SOURCE_TOKEN: undefined })
    )

    expect(report.warnings).toEqual([
      'BETTERSTACK_SOURCE_TOKEN is not set (error log shipping disabled)',
      'COUPON_MEMO_SECRET is shorter than 32 characters',
      'NEXT_PUBLIC_RPC_ENDPOINT equals RPC_PRIVATE_ENDPOINT: the private RPC key is exposed to browsers',
    ])
    expect(logger.warn).toHaveBeenCalledOnce()
  })
})

describe('cluster consistency', () => {
  it('should throw in production when the network var says mainnet but an RPC URL is devnet', () => {
    const message = getThrownMessage(withEnv({ NEXT_PUBLIC_SOLANA_NETWORK: 'mainnet-beta', RPC_PRIVATE_ENDPOINT: DEVNET_RPC }))

    expect(message).toContain('Cluster mismatch: RPC_PRIVATE_ENDPOINT targets devnet but the expected cluster is mainnet-beta')
    expect(message).not.toContain('devnet-key')
  })

  it('should throw in production when the network var says devnet but an RPC URL is mainnet', () => {
    const message = getThrownMessage(withEnv({ NEXT_PUBLIC_SOLANA_NETWORK: 'devnet', RPC_PRIVATE_ENDPOINT: DEVNET_RPC }))

    expect(message).toContain('NEXT_PUBLIC_RPC_ENDPOINT targets mainnet-beta but the expected cluster is devnet')
  })

  it('should expect mainnet-beta on Vercel Production when no network var is set', () => {
    const env = withEnv({ VERCEL_ENV: 'production', RPC_PRIVATE_ENDPOINT: DEVNET_RPC, NEXT_PUBLIC_RPC_ENDPOINT: DEVNET_RPC })

    expect(collectEnvIssues(env).clusterMismatches).toHaveLength(2)
    expect(() => validateEnv(env)).toThrow(AppError)
  })

  it('should allow an explicit devnet override on Vercel Production', () => {
    const env = withEnv({
      VERCEL_ENV: 'production',
      NEXT_PUBLIC_SOLANA_NETWORK: 'devnet',
      RPC_PRIVATE_ENDPOINT: DEVNET_RPC,
      NEXT_PUBLIC_RPC_ENDPOINT: DEVNET_RPC,
    })

    expect(collectEnvIssues(env).clusterMismatches).toEqual([])
  })

  it('should accept a consistent devnet preview but reject client/server disagreement', () => {
    const preview = { VERCEL_ENV: 'preview', RPC_PRIVATE_ENDPOINT: DEVNET_RPC }

    expect(collectEnvIssues(withEnv({ ...preview, NEXT_PUBLIC_RPC_ENDPOINT: DEVNET_RPC })).clusterMismatches).toEqual([])
    expect(collectEnvIssues(withEnv(preview)).clusterMismatches).toEqual([
      'RPC_PRIVATE_ENDPOINT targets devnet but the expected cluster is mainnet-beta (NEXT_PUBLIC_RPC_ENDPOINT)',
    ])
  })

  it('should only warn about a mismatch in development', () => {
    const env = { NODE_ENV: 'development', NEXT_PUBLIC_RPC_ENDPOINT: CLIENT_RPC, RPC_PRIVATE_ENDPOINT: DEVNET_RPC }

    expect(() => validateEnv(env)).not.toThrow()
    expect(collectEnvIssues(env).clusterMismatches).toHaveLength(1)
  })
})

describe('helpers', () => {
  it('should infer the cluster from the hostname only', () => {
    expect(inferClusterFromRpcUrl('https://api.mainnet-beta.solana.com')).toBe('mainnet-beta')
    expect(inferClusterFromRpcUrl('https://api.devnet.solana.com')).toBe('devnet')
    expect(inferClusterFromRpcUrl('https://api.testnet.solana.com')).toBe('testnet')
    expect(inferClusterFromRpcUrl('https://mainnet.helius-rpc.com/?api-key=devnet123')).toBe('mainnet-beta')
    expect(inferClusterFromRpcUrl('https://rpc.example.com/devnet')).toBeUndefined()
    expect(inferClusterFromRpcUrl('not a url')).toBeUndefined()
    expect(inferClusterFromRpcUrl(undefined)).toBeUndefined()
  })

  it('should validate base58 public keys like web3.js does', () => {
    const valid = [
      'So11111111111111111111111111111111111111112',
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      '11111111111111111111111111111111',
    ]
    const invalid = ['', 'not-a-key', 'z'.repeat(44), '0OIl1111111111111111111111111111111', '1111111111111111111111111111111']

    for (const key of valid) {
      expect(isBase58PublicKey(key)).toBe(true)
      expect(() => new PublicKey(key)).not.toThrow()
    }
    for (const key of invalid) {
      expect(isBase58PublicKey(key)).toBe(false)
    }
  })

  it('should detect the env mode and skip reasons', () => {
    expect(getEnvMode({ NODE_ENV: 'production' })).toBe('production')
    expect(getEnvMode({ VERCEL_ENV: 'production', NODE_ENV: 'development' })).toBe('production')
    expect(getEnvMode({ NODE_ENV: 'test' })).toBe('development')
    expect(getEnvValidationSkipReason({ NODE_ENV: 'production' })).toBeNull()
    expect(getEnvValidationSkipReason({ SKIP_ENV_VALIDATION: '1' })).toBe('SKIP_ENV_VALIDATION is set')
  })
})

describe('env templates', () => {
  const repoRoot = path.resolve(__dirname, '../../../..')
  const documentedVars = [
    'NEXT_PUBLIC_SOLANA_NETWORK',
    'SKIP_ENV_VALIDATION',
    ...PRODUCTION_REQUIRED_ENV_VARS,
    ...PRODUCTION_RECOMMENDED_ENV_VARS,
  ]

  it.each(['.env.example', '.env.template'])('should document every validated var in %s without values', (file) => {
    const content = readFileSync(path.join(repoRoot, file), 'utf8')

    for (const name of documentedVars) {
      expect(content).toMatch(new RegExp(`^${name}=$`, 'm'))
    }
  })
})
