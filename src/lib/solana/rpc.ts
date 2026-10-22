/**
 * Solana RPC Utilities
 *
 * Functions for RPC connection management and health checks.
 *
 * Server failover (M7): connections the server opens to its private endpoint (`RPC_PRIVATE_ENDPOINT`)
 * fail over to the optional `RPC_FALLBACK_ENDPOINT` on network errors, timeouts, HTTP 5xx and HTTP 429.
 * Each request tries the primary once and the fallback once (bounded), and never fails over on a
 * caller abort or another 4xx. Both variables are server-only (no `NEXT_PUBLIC_` prefix), so they are
 * undefined in browser bundles; the `typeof window` guard keeps failover off in the browser regardless.
 * This module is shared with client code, so it reads `process.env` directly instead of importing the
 * 'server-only' getServerConfig().
 */

import {
  createDefaultRpcTransport,
  createSolanaRpc,
  createSolanaRpcFromTransport,
  isSolanaError,
  SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
  type RpcTransport,
} from '@solana/kit'
import { Connection } from '@solana/web3.js'
import getConfig from '@/lib/config/getConfig'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'solana/rpc' })

type KitRpc = ReturnType<typeof createSolanaRpc>
type FetchFn = typeof fetch
type RpcClientKind = 'web3' | 'kit'

/** Upper bound for one attempt while failover is active, so a hung endpoint cannot stall a request. */
export const RPC_FAILOVER_ATTEMPT_TIMEOUT_MS = 10_000

const HTTP_TOO_MANY_REQUESTS = 429
const HTTP_SERVER_ERROR_MIN = 500

/**
 * Check if RPC endpoint is responding
 *
 * @param rpcPublicEndpoint - Optional RPC endpoint (defaults to config)
 * @returns True if RPC is healthy
 */
export const isRpcHealthy = async (rpcPublicEndpoint?: string): Promise<boolean> => {
  try {
    const endpoint = rpcPublicEndpoint || getConfig().rpcPublicEndpoint
    const rpc = createSolanaRpc(endpoint)
    await rpc.getLatestBlockhash().send()
    return true
  } catch {
    return false
  }
}

/**
 * Get cluster info from RPC endpoint
 *
 * @returns Cluster name and version info
 */
export const getClusterInfo = async (): Promise<{ cluster: string; version?: string }> => {
  const { rpcPublicEndpoint } = getConfig()

  if (rpcPublicEndpoint.includes('devnet')) {
    return { cluster: 'devnet' }
  } else if (rpcPublicEndpoint.includes('testnet')) {
    return { cluster: 'testnet' }
  } else if (rpcPublicEndpoint.includes('mainnet')) {
    return { cluster: 'mainnet-beta' }
  } else {
    return { cluster: 'custom' }
  }
}

// ── Server failover ──────────────────────────────────────────────────────────────────────────

const isHttpsUrl = (value: string): boolean => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Resolves the fallback endpoint for a connection to `endpoint`.
 *
 * Fails closed: returns undefined in the browser, when `endpoint` is not the private server endpoint,
 * when no fallback is configured, when it is not https, or when it equals the primary.
 *
 * @param endpoint - Endpoint the connection is being created for.
 * @returns The fallback URL, or undefined when failover does not apply.
 */
export const resolveServerFallbackEndpoint = (endpoint: string): string | undefined => {
  if (typeof window !== 'undefined') return undefined

  const fallback = process.env.RPC_FALLBACK_ENDPOINT?.trim()
  const primary = process.env.RPC_PRIVATE_ENDPOINT?.trim()
  if (!fallback || !primary || endpoint.trim() !== primary || fallback === primary) return undefined

  return isHttpsUrl(fallback) ? fallback : undefined
}

const isRetryableStatus = (status: number): boolean => status === HTTP_TOO_MANY_REQUESTS || status >= HTTP_SERVER_ERROR_MIN

/**
 * Combines the caller's signal (if any) with the per-attempt timeout.
 *
 * @param callerSignal - Signal supplied by the RPC client.
 * @returns Signal that aborts on caller abort or after {@link RPC_FAILOVER_ATTEMPT_TIMEOUT_MS}.
 */
const withAttemptTimeout = (callerSignal: AbortSignal | null | undefined): AbortSignal => {
  const timeout = AbortSignal.timeout(RPC_FAILOVER_ATTEMPT_TIMEOUT_MS)
  return callerSignal ? AbortSignal.any([callerSignal, timeout]) : timeout
}

/** Static failure label for logs (never the error message, which may contain the endpoint URL). */
const describeNetworkFailure = (error: unknown): string =>
  (error as { name?: unknown } | null)?.name === 'TimeoutError' ? 'timeout' : 'network_error'

const logFailover = (client: RpcClientKind, reason: string): void => {
  logger.warn('Primary server RPC failed, retrying on RPC_FALLBACK_ENDPOINT', undefined, { client, reason })
}

/**
 * `fetch` for web3.js `Connection`: one attempt on the requested URL, then one on the fallback.
 * The last response is returned as is, so web3.js keeps its own error and HTTP 429 handling.
 *
 * @param fallbackEndpoint - Fallback RPC URL.
 * @returns Fetch implementation with failover.
 */
const createFailoverFetch =
  (fallbackEndpoint: string): FetchFn =>
  async (input, init) => {
    try {
      const response = await fetch(input, { ...init, signal: withAttemptTimeout(init?.signal) })
      if (!isRetryableStatus(response.status)) return response
      await response.body?.cancel()
      logFailover('web3', `http_${response.status}`)
    } catch (error) {
      if (init?.signal?.aborted) throw error
      logFailover('web3', describeNetworkFailure(error))
    }
    return fetch(fallbackEndpoint, { ...init, signal: withAttemptTimeout(init?.signal) })
  }

/**
 * Decides whether a Kit transport error should move the request to the fallback.
 *
 * @param error - Error thrown by the primary transport.
 * @returns Static reason when retryable, otherwise null.
 */
const getKitRetryReason = (error: unknown): string | null => {
  if (isSolanaError(error, SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR)) {
    const { statusCode } = error.context
    return isRetryableStatus(statusCode) ? `http_${statusCode}` : null
  }
  // Other SDK errors are deterministic (e.g. forbidden headers); fetch failures are not SolanaErrors.
  return isSolanaError(error) ? null : describeNetworkFailure(error)
}

/**
 * Kit transport: one attempt on the primary transport, then one on the fallback transport.
 *
 * @param primary - Transport for the primary endpoint.
 * @param fallback - Transport for the fallback endpoint.
 * @returns Transport with failover.
 */
const createFailoverTransport =
  (primary: RpcTransport, fallback: RpcTransport): RpcTransport =>
  async <TResponse>(config: Parameters<RpcTransport>[0]) => {
    try {
      return await primary<TResponse>({ ...config, signal: withAttemptTimeout(config.signal) })
    } catch (error) {
      const reason = config.signal?.aborted ? null : getKitRetryReason(error)
      if (!reason) throw error
      logFailover('kit', reason)
    }
    return fallback<TResponse>({ ...config, signal: withAttemptTimeout(config.signal) })
  }

/**
 * Create Kit RPC connection helper. Server connections to the private endpoint fail over to
 * `RPC_FALLBACK_ENDPOINT` when it is configured (see the module docs).
 *
 * @param endpoint - Optional RPC endpoint (defaults to config)
 * @returns Kit RPC instance
 */
export const createKitRpc = (endpoint?: string): KitRpc => {
  const rpcEndpoint = endpoint || getConfig().rpcPublicEndpoint
  const fallbackEndpoint = resolveServerFallbackEndpoint(rpcEndpoint)
  if (!fallbackEndpoint) return createSolanaRpc(rpcEndpoint)

  return createSolanaRpcFromTransport(
    createFailoverTransport(createDefaultRpcTransport({ url: rpcEndpoint }), createDefaultRpcTransport({ url: fallbackEndpoint }))
  )
}

/**
 * Creates a web3.js connection ('confirmed'); server connections to the private endpoint fail over.
 *
 * @param endpoint - RPC endpoint.
 * @returns Legacy connection.
 */
const createLegacyConnection = (endpoint: string): Connection => {
  const fallbackEndpoint = resolveServerFallbackEndpoint(endpoint)
  if (!fallbackEndpoint) return new Connection(endpoint, 'confirmed')

  return new Connection(endpoint, { commitment: 'confirmed', fetch: createFailoverFetch(fallbackEndpoint) })
}

/**
 * Create reusable connection pair for consistent RPC operations
 * Prevents connection multiplicity and rate limiting issues
 *
 * @param endpoint - Optional RPC endpoint (defaults to config)
 * @returns Kit RPC and legacy connection pair
 */
export const createConnectionPair = (
  endpoint?: string
): {
  kitRpc: KitRpc
  legacyConnection: Connection
} => {
  const rpcEndpoint = endpoint || getConfig().rpcPublicEndpoint
  return {
    kitRpc: createKitRpc(rpcEndpoint),
    legacyConnection: createLegacyConnection(rpcEndpoint),
  }
}
