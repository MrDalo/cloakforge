import { cacheLife, cacheTag } from 'next/cache'
import { PublicKey } from '@solana/web3.js'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import getServerConfig from '@/lib/config/getServerConfig'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import { tokenAuditMintAddressSchema } from '@/lib/schemas/tokenAuditSchemas'
import type { TokenAuditFailureStatus, TokenAuditReport, TokenAuditResult } from '@/types/tokenAudit'
import { collectTokenAuditFacts, createAuditConnection } from './collectTokenAuditFacts'
import { evaluateTokenAuditChecks, summarizeAuditChecks } from './tokenAuditChecks'
import 'server-only'

const cacheLogger = getLogger({
  context: 'server-cache',
  component: 'tokenAuditCache',
})

/**
 * Cache lifetime of a successful audit (seconds): fresh for 60 s, and a stale copy is never served
 * once it is 5 minutes old. On-chain authorities can change, so results are kept only briefly.
 */
export const TOKEN_AUDIT_CACHE_LIFE = { stale: 30, revalidate: 60, expire: 300 } as const

/**
 * Maps an audit error to a generic, user-safe failure status.
 *
 * @param error - Error thrown while auditing.
 * @returns Failure status (no internal details).
 */
function toFailureStatus(error: unknown): TokenAuditFailureStatus {
  if (error instanceof AppError && error.code === 'TOKEN_NOT_FOUND') {
    return 'not-found'
  }
  if (error instanceof AppError && error.code === 'INVALID_MINT') {
    return 'not-a-mint'
  }
  return 'unavailable'
}

/**
 * Reads the mint through the private RPC (no 429 retry, aborting timeout) and applies the audit rules.
 *
 * @param mintAddress - Validated mint address.
 * @returns Full audit report.
 */
async function buildTokenAuditReport(mintAddress: PublicKey): Promise<TokenAuditReport> {
  const connection = createAuditConnection(getServerConfig().rpcPrivateEndpoint)
  const facts = await collectTokenAuditFacts(connection, mintAddress)
  const checks = evaluateTokenAuditChecks(facts)
  return { ...facts, checks, summary: summarizeAuditChecks(checks), analyzedAt: new Date().toISOString() }
}

/**
 * Cached audit of an already-validated mint address.
 *
 * Errors are handled inside the cache scope (logging needs the current time, which Cache
 * Components only allow inside `'use cache'`). Failures are cached for seconds only, so a retry
 * comes soon while repeated refreshes cannot hammer the RPC.
 *
 * @param mintAddress - Base58 mint address that passed `tokenAuditMintAddressSchema`.
 * @returns Audit result.
 */
async function getCachedTokenAudit(mintAddress: string): Promise<TokenAuditResult> {
  'use cache'
  cacheTag('token-audit')

  try {
    const report = await buildTokenAuditReport(new PublicKey(mintAddress))
    cacheLife(TOKEN_AUDIT_CACHE_LIFE)
    return { status: 'ok', report }
  } catch (error) {
    cacheLife('seconds')
    const status = toFailureStatus(error)
    if (status === 'unavailable') {
      cacheLogger.warn('Token audit failed', error, { operation: 'getCachedTokenAudit' })
    }
    return { status }
  }
}

/**
 * Server-side kill switch: the Token Auditor runs only while its Contentful configuration does not
 * disable it. The page is public, so the client-side check alone cannot stop RPC spend.
 * Fails closed: a failing configuration lookup counts as disabled. A missing configuration counts
 * as enabled, like the client-side default (`isToolEnabled`).
 *
 * @returns True when the audit may run.
 */
async function isTokenAuditorEnabled(): Promise<boolean> {
  try {
    const config = await getCachedToolConfig('token-auditor')
    return config?.isEnabled ?? true
  } catch (error) {
    cacheLogger.warn('Token auditor configuration lookup failed, treating the tool as disabled', error, {
      operation: 'isTokenAuditorEnabled',
    })
    return false
  }
}

/**
 * Runs the Token Auditor for a user-supplied mint address (read-only, no transaction).
 *
 * The address is validated first, so invalid input never reaches the RPC or the cache. A disabled
 * tool (kill switch) or an unreadable tool configuration returns `unavailable` without any RPC call
 * and before the result cache is consulted. The searched address is not logged or stored beyond the
 * short-lived result cache.
 *
 * @param mintAddress - Untrusted mint address (e.g. from the URL).
 * @returns The audit report, or a generic failure status.
 */
export async function getTokenAudit(mintAddress: string): Promise<TokenAuditResult> {
  const parsed = tokenAuditMintAddressSchema.safeParse(mintAddress)
  if (!parsed.success) {
    return { status: 'invalid-address' }
  }
  if (!(await isTokenAuditorEnabled())) {
    return { status: 'unavailable' }
  }
  return getCachedTokenAudit(parsed.data)
}
