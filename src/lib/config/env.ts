/**
 * Runtime environment validation (H4 / WEB3-16 / SRV-12).
 *
 * Called once per server instance from `src/instrumentation.ts` → `register()`. Next.js never calls
 * `register()` during `next build`, so builds without secrets keep working.
 *
 * - Production runtime (`VERCEL_ENV=production` or `NODE_ENV=production`, which includes Vercel
 *   previews and `next start`): every required variable must be present and well-formed, and both RPC
 *   endpoints must target the expected Solana cluster. Problems throw ONE aggregated error that lists
 *   variable NAMES only — values are never logged or thrown.
 * - Development / test: the fallbacks in getConfig() / getServerConfig() stay in place; problems are
 *   logged once as a warning.
 *
 * Intentionally no 'server-only' import (instrumentation is loaded outside the react-server layer) and
 * no `@/lib/solana` import (keeps the boot path light and free of RPC/client code).
 */
import { z } from 'zod'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'config/env' })

export type EnvSource = Readonly<Record<string, string | undefined>>

export const SOLANA_CLUSTERS = ['mainnet-beta', 'devnet', 'testnet'] as const
export type SolanaCluster = (typeof SOLANA_CLUSTERS)[number]

export type EnvMode = 'production' | 'development'

export interface EnvValidationReport {
  mode: EnvMode
  /** Why validation did not run (build phase / explicit opt-out), or null when it ran. */
  skipped: string | null
  missing: string[]
  /** `NAME (reason)` entries; reasons are static strings, never values. */
  invalid: string[]
  clusterMismatches: string[]
  /** Non-fatal production hygiene notes. */
  warnings: string[]
}

// ── Field schemas (custom messages so Zod never echoes input) ───────────────────────────────

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const BASE58_PUBKEY_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i
const MIN_SECRET_LENGTH = 32

/**
 * Decodes a base58 string and returns its byte length (no dependency on web3.js / bs58).
 *
 * @param value - Base58 string.
 * @returns Decoded byte length, or null for non-base58 input.
 */
const getBase58ByteLength = (value: string): number | null => {
  const bytes: number[] = []
  for (const char of value) {
    let carry = BASE58_ALPHABET.indexOf(char)
    if (carry < 0) return null
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58
      bytes[i] = carry & 0xff
      carry >>= 8
    }
    while (carry > 0) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }
  const leadingZeroBytes = value.length - value.replace(/^1+/, '').length
  return bytes.length + leadingZeroBytes
}

/**
 * Checks that a string is a base58-encoded 32-byte Solana public key.
 *
 * @param value - Candidate address.
 * @returns True for a well-formed public key.
 */
export const isBase58PublicKey = (value: string): boolean => BASE58_PUBKEY_PATTERN.test(value) && getBase58ByteLength(value) === 32

const requiredString = z.string().trim().min(1, { error: 'must not be empty' })
const httpsUrl = z
  .string()
  .trim()
  .pipe(z.url({ protocol: /^https$/, error: 'must be an https:// URL' }))
const solanaPublicKey = z.string().trim().refine(isBase58PublicKey, { error: 'must be a base58 Solana public key' })
const hostname = z.string().trim().regex(HOSTNAME_PATTERN, { error: 'must be a bare hostname without scheme or path' })
const email = z
  .string()
  .trim()
  .pipe(z.email({ error: 'must be an email address' }))

/**
 * Variables that must be present and valid in every production runtime.
 * Keep in sync with `.env.example` / `.env.template` (enforced by env.test.ts).
 */
export const productionEnvSchema = z.object({
  // Solana RPC — the client key is public (SRV-12), the server key must stay private.
  RPC_PRIVATE_ENDPOINT: httpsUrl,
  NEXT_PUBLIC_RPC_ENDPOINT: httpsUrl,
  FEE_WALLET_ADDRESS: solanaPublicKey,
  // Contentful (CMS, tool fees, coupons — read-only Delivery API) + revalidation webhook
  CONTENTFUL_SPACE_ID: requiredString,
  CONTENTFUL_ACCESS_TOKEN: requiredString,
  CONTENTFUL_REVALIDATE_SECRET: requiredString,
  // Pinata (IPFS uploads)
  IPFS_JWT: requiredString,
  IPFS_GATEWAY: hostname,
  // HMAC key for opaque coupon memos
  COUPON_MEMO_SECRET: requiredString,
})

export type ProductionEnv = z.infer<typeof productionEnvSchema>

export const PRODUCTION_REQUIRED_ENV_VARS = Object.keys(productionEnvSchema.shape) as ReadonlyArray<keyof ProductionEnv>

/** Optional cluster assertion. When unset, Vercel Production expects mainnet-beta. */
const NETWORK_VAR = 'NEXT_PUBLIC_SOLANA_NETWORK'
const networkSchema = z.enum(SOLANA_CLUSTERS)

const RPC_ENV_VARS = ['NEXT_PUBLIC_RPC_ENDPOINT', 'RPC_PRIVATE_ENDPOINT'] as const

/**
 * Recommended in production; missing ones only produce a warning (never block boot).
 * The legal entity vars feed `getLegalEntityInfo()`, which no page renders yet — they become
 * required only once the Imprint / Terms pages read them.
 */
const RECOMMENDED_ENV_VAR_REASONS = {
  BETTERSTACK_SOURCE_TOKEN: 'error log shipping disabled',
  BETTERSTACK_INGEST_URL: 'error log shipping disabled',
  LEGAL_ENTITY_NAME: 'legal entity details incomplete',
  LEGAL_ENTITY_ADDRESS: 'legal entity details incomplete',
  LEGAL_ENTITY_ICO: 'legal entity details incomplete',
  LEGAL_CONTACT_EMAIL: 'legal entity details incomplete',
} as const

export const PRODUCTION_RECOMMENDED_ENV_VARS = Object.keys(RECOMMENDED_ENV_VAR_REASONS) as ReadonlyArray<
  keyof typeof RECOMMENDED_ENV_VAR_REASONS
>

// ── Mode detection ───────────────────────────────────────────────────────────────────────────

/**
 * Determines whether the strict production rules apply.
 *
 * @param env - Environment source.
 * @returns 'production' for Vercel Production, previews and `next start`; otherwise 'development'.
 */
export const getEnvMode = (env: EnvSource): EnvMode =>
  env.VERCEL_ENV === 'production' || env.NODE_ENV === 'production' ? 'production' : 'development'

const isTruthyFlag = (value: string | undefined): boolean => value === '1' || value?.toLowerCase() === 'true'

/**
 * Returns why validation should not run, or null when it should.
 * `SKIP_ENV_VALIDATION` is ignored on Vercel Production.
 *
 * @param env - Environment source.
 * @returns Skip reason or null.
 */
export const getEnvValidationSkipReason = (env: EnvSource): string | null => {
  if (env.NEXT_PHASE === 'phase-production-build') return 'next build phase'
  if (isTruthyFlag(env.SKIP_ENV_VALIDATION) && env.VERCEL_ENV !== 'production') return 'SKIP_ENV_VALIDATION is set'
  return null
}

// ── Cluster consistency ──────────────────────────────────────────────────────────────────────

/**
 * Infers the Solana cluster from an RPC URL hostname (path/query, which may hold API keys, are ignored).
 *
 * @param rpcUrl - RPC endpoint URL.
 * @returns Cluster, or undefined when the hostname does not name one.
 */
export const inferClusterFromRpcUrl = (rpcUrl: string | undefined): SolanaCluster | undefined => {
  if (!rpcUrl) return undefined
  let host: string
  try {
    host = new URL(rpcUrl.trim()).hostname.toLowerCase()
  } catch {
    return undefined
  }
  if (host.includes('devnet')) return 'devnet'
  if (host.includes('testnet')) return 'testnet'
  if (host.includes('mainnet')) return 'mainnet-beta'
  return undefined
}

/**
 * Checks that client and server RPC endpoints target the same, expected cluster.
 *
 * Expected cluster: `NEXT_PUBLIC_SOLANA_NETWORK` → mainnet-beta on Vercel Production → client RPC cluster
 * → server RPC cluster.
 *
 * @param env - Environment source.
 * @returns Human-readable mismatches naming variables and clusters only.
 */
const collectClusterMismatches = (env: EnvSource): string[] => {
  const explicit = networkSchema.safeParse(env[NETWORK_VAR]?.trim())
  const inferred = RPC_ENV_VARS.map((name) => ({ name, cluster: inferClusterFromRpcUrl(env[name]) }))

  let expected: SolanaCluster | undefined
  let source: string
  if (explicit.success) {
    expected = explicit.data
    source = NETWORK_VAR
  } else if (env.VERCEL_ENV === 'production') {
    expected = 'mainnet-beta'
    source = `VERCEL_ENV=production default; set ${NETWORK_VAR} to override`
  } else {
    const first = inferred.find((entry) => entry.cluster)
    expected = first?.cluster
    source = first?.name ?? ''
  }

  if (!expected) return []

  return inferred
    .filter((entry) => entry.cluster && entry.cluster !== expected)
    .map((entry) => `${entry.name} targets ${entry.cluster} but the expected cluster is ${expected} (${source})`)
}

// ── Issue collection ─────────────────────────────────────────────────────────────────────────

const isBlank = (value: string | undefined): boolean => value === undefined || value.trim() === ''

/**
 * Collects every env problem without throwing or logging. Pure — safe to unit test.
 *
 * @param env - Environment source.
 * @returns Report with missing/invalid vars, cluster mismatches and warnings.
 */
export const collectEnvIssues = (env: EnvSource): EnvValidationReport => {
  const mode = getEnvMode(env)
  const missing: string[] = []
  const invalid: string[] = []
  const warnings: string[] = []

  for (const name of PRODUCTION_REQUIRED_ENV_VARS) {
    if (isBlank(env[name])) missing.push(name)
  }

  const parsed = productionEnvSchema.safeParse(env)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const name = String(issue.path[0])
      if (!missing.includes(name) && !invalid.some((entry) => entry.startsWith(`${name} `))) {
        invalid.push(`${name} (${issue.message})`)
      }
    }
  }

  const network = env[NETWORK_VAR]
  if (!isBlank(network) && !networkSchema.safeParse(network?.trim()).success) {
    invalid.push(`${NETWORK_VAR} (must be one of ${SOLANA_CLUSTERS.join(', ')})`)
  }

  const clusterMismatches = collectClusterMismatches(env)

  if (mode === 'production') {
    for (const name of PRODUCTION_RECOMMENDED_ENV_VARS) {
      if (isBlank(env[name])) warnings.push(`${name} is not set (${RECOMMENDED_ENV_VAR_REASONS[name]})`)
    }
    const legalEmail = env.LEGAL_CONTACT_EMAIL
    if (!isBlank(legalEmail) && !email.safeParse(legalEmail).success) {
      warnings.push('LEGAL_CONTACT_EMAIL is not a valid email address')
    }
    for (const name of ['COUPON_MEMO_SECRET', 'CONTENTFUL_REVALIDATE_SECRET'] as const) {
      const value = env[name]?.trim()
      if (value && value.length < MIN_SECRET_LENGTH) warnings.push(`${name} is shorter than ${MIN_SECRET_LENGTH} characters`)
    }
    const clientRpc = env.NEXT_PUBLIC_RPC_ENDPOINT?.trim()
    if (clientRpc && clientRpc === env.RPC_PRIVATE_ENDPOINT?.trim()) {
      warnings.push('NEXT_PUBLIC_RPC_ENDPOINT equals RPC_PRIVATE_ENDPOINT: the private RPC key is exposed to browsers')
    }
    const alchemyKey = env.ALCHEMY_API_KEY?.trim()
    if (clientRpc && alchemyKey && clientRpc.includes(alchemyKey)) {
      warnings.push('NEXT_PUBLIC_RPC_ENDPOINT embeds ALCHEMY_API_KEY: the server Alchemy key is exposed to browsers')
    }
  }

  return { mode, skipped: null, missing, invalid, clusterMismatches, warnings }
}

/**
 * Formats a report as a multi-line message (names and static reasons only).
 *
 * @param report - Validation report.
 * @returns Message suitable for logs and thrown errors.
 */
export const formatEnvIssues = (report: EnvValidationReport): string => {
  const lines = [`Environment validation failed (${report.mode}).`]
  if (report.missing.length > 0) lines.push(`Missing: ${report.missing.join(', ')}`)
  if (report.invalid.length > 0) lines.push(`Invalid: ${report.invalid.join('; ')}`)
  if (report.clusterMismatches.length > 0) lines.push(`Cluster mismatch: ${report.clusterMismatches.join('; ')}`)
  lines.push('Set these in the deployment environment (Vercel → Settings → Environment Variables). Values are never logged.')
  return lines.join('\n')
}

const hasErrors = (report: EnvValidationReport): boolean =>
  report.missing.length > 0 || report.invalid.length > 0 || report.clusterMismatches.length > 0

let hasWarnedInDevelopment = false

/**
 * Validates the server environment. Throws in production, warns once in development.
 *
 * @param env - Environment source, defaults to `process.env`.
 * @returns The validation report (when it does not throw).
 * @throws AppError (INTERNAL_ERROR, 500) listing missing/invalid variable names in production.
 */
export const validateEnv = (env: EnvSource = process.env): EnvValidationReport => {
  const mode = getEnvMode(env)
  const skipped = getEnvValidationSkipReason(env)
  if (skipped) {
    return { mode, skipped, missing: [], invalid: [], clusterMismatches: [], warnings: [] }
  }

  if (isTruthyFlag(env.SKIP_ENV_VALIDATION)) {
    logger.warn('SKIP_ENV_VALIDATION is ignored on Vercel Production')
  }

  const report = collectEnvIssues(env)

  if (mode === 'production') {
    if (report.warnings.length > 0) {
      logger.warn(`Environment configuration warnings: ${report.warnings.join('; ')}`)
    }
    if (hasErrors(report)) {
      const message = formatEnvIssues(report)
      logger.error(message, undefined, { action: 'validateEnv' })
      throw new AppError('INTERNAL_ERROR', message, 500)
    }
    return report
  }

  if (hasErrors(report) && !hasWarnedInDevelopment) {
    hasWarnedInDevelopment = true
    logger.warn(`${formatEnvIssues(report)}\nDevelopment fallbacks (devnet RPC, empty secrets) are in use.`)
  }
  return report
}
