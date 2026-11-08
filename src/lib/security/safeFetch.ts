import 'server-only'
import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
import { AppError, type ErrorCode } from '@/lib/errors'

/**
 * SSRF-hardened fetch for untrusted URLs (e.g. on-chain token metadata URIs).
 *
 * - https only, default port only, no credentials in the URL; `ipfs://` and `ar://` are
 *   rewritten to fixed trusted gateways.
 * - Rejects IP-literal hosts, single-label/local hostnames, and hostnames that resolve to any
 *   private, loopback, link-local, CGNAT, metadata, multicast or reserved address (IPv4 + IPv6).
 * - Redirects are followed manually (max 2 by default) and every hop is re-validated.
 * - One deadline (default 3 s) covers DNS, all hops and the body; the body is streamed with a
 *   hard size cap (default 256 KB) and must be JSON.
 *
 * Residual risk (DNS rebinding / TOCTOU): `fetch()` resolves the hostname again after our
 * check, so a hostile DNS server with a 0 TTL could answer differently the second time. On
 * Vercel there is no way to pin the validated IP with the global fetch. This is largely
 * neutralised by requiring https on port 443: a rebound connection to an internal IP fails TLS
 * certificate validation for the attacker's hostname, and responses are size/time capped and
 * only a validated `image` URL string is ever returned to clients.
 */

export const TRUSTED_IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
export const TRUSTED_ARWEAVE_GATEWAY = 'https://arweave.net/'

const DEFAULT_TIMEOUT_MS = 3_000
const DEFAULT_MAX_BYTES = 256 * 1024
const DEFAULT_MAX_REDIRECTS = 2
const MAX_URL_LENGTH = 2048
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308])
const JSON_CONTENT_TYPE = /^(application\/([a-z0-9.+-]+\+)?json|text\/json|text\/plain)\s*(;|$)/i

const IPFS_URI = /^ipfs:\/\/(?:ipfs\/)?([A-Za-z0-9]{10,}(?:\/[A-Za-z0-9._~%/-]*)?)$/
const ARWEAVE_URI = /^ar:\/\/([A-Za-z0-9_-]{20,}(?:\/[A-Za-z0-9._~%/-]*)?)$/
const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa', '.lan', '.intranet', '.corp']

export type SafeFetchFailureReason =
  | 'invalid_url'
  | 'blocked_protocol'
  | 'blocked_port'
  | 'blocked_host'
  | 'dns_failure'
  | 'too_many_redirects'
  | 'bad_redirect'
  | 'http_error'
  | 'unsupported_content_type'
  | 'response_too_large'
  | 'invalid_json'
  | 'timeout'

const REASON_ERROR_CODE: Record<SafeFetchFailureReason, ErrorCode> = {
  invalid_url: 'INVALID_INPUT',
  blocked_protocol: 'FORBIDDEN',
  blocked_port: 'FORBIDDEN',
  blocked_host: 'FORBIDDEN',
  dns_failure: 'NETWORK_ERROR',
  too_many_redirects: 'NETWORK_ERROR',
  bad_redirect: 'NETWORK_ERROR',
  http_error: 'NETWORK_ERROR',
  unsupported_content_type: 'INVALID_FORMAT',
  response_too_large: 'INVALID_FORMAT',
  invalid_json: 'INVALID_FORMAT',
  timeout: 'NETWORK_ERROR',
}

/** Internal-only error (never surfaced to clients); `reason` tells callers/tests why. */
export class SafeFetchError extends AppError {
  readonly reason: SafeFetchFailureReason

  constructor(reason: SafeFetchFailureReason, message: string) {
    super(REASON_ERROR_CODE[reason], message, REASON_ERROR_CODE[reason] === 'FORBIDDEN' ? 403 : 502)
    this.name = 'SafeFetchError'
    this.reason = reason
  }
}

export interface SafeFetchOptions {
  /** Deadline for the whole operation (DNS, redirects, body). Default 3000 ms. */
  timeoutMs?: number
  /** Max response body size in bytes. Default 256 KB. */
  maxBytes?: number
  /** Max redirects to follow (each hop re-validated). Default 2. */
  maxRedirects?: number
  /** Optional external abort signal (e.g. a per-request budget shared by several fetches). */
  signal?: AbortSignal
}

// ---------------------------------------------------------------------------
// Address classification
// ---------------------------------------------------------------------------

const blockedAddresses = new BlockList()
const BLOCKED_IPV4_SUBNETS: Array<[string, number]> = [
  ['0.0.0.0', 8], // "this" network
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // CGNAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, cloud metadata (169.254.169.254)
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // TEST-NET-1
  ['192.88.99.0', 24], // 6to4 relay anycast
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // TEST-NET-2
  ['203.0.113.0', 24], // TEST-NET-3
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved + broadcast
]
const BLOCKED_IPV6_SUBNETS: Array<[string, number]> = [
  ['::', 128], // unspecified
  ['::1', 128], // loopback
  ['::', 96], // IPv4-compatible (deprecated)
  // IPv4-mapped (::ffff:0:0/96) is intentionally not listed: BlockList would then also match
  // every plain IPv4 query. Mapped addresses are rejected by the 2000::/3 allowlist below.
  ['64:ff9b::', 96], // NAT64
  ['64:ff9b:1::', 48], // local-use NAT64
  ['100::', 64], // discard-only
  ['2001::', 23], // IETF protocol assignments (incl. Teredo 2001::/32)
  ['2001:db8::', 32], // documentation
  ['2002::', 16], // 6to4
  ['3fff::', 20], // documentation
  ['fc00::', 7], // unique local (incl. fd00:ec2::254 metadata)
  ['fe80::', 10], // link-local
  ['fec0::', 10], // site-local (deprecated)
  ['ff00::', 8], // multicast
]
for (const [network, prefix] of BLOCKED_IPV4_SUBNETS) blockedAddresses.addSubnet(network, prefix, 'ipv4')
for (const [network, prefix] of BLOCKED_IPV6_SUBNETS) blockedAddresses.addSubnet(network, prefix, 'ipv6')

/** Only 2000::/3 is globally routable unicast IPv6. */
const globalUnicastIpv6 = new BlockList()
globalUnicastIpv6.addSubnet('2000::', 3, 'ipv6')

/** True only for publicly routable unicast addresses. Malformed input is treated as non-public. */
export function isPublicIpAddress(address: string): boolean {
  const normalized = address
    .trim()
    .replace(/^\[|\]$/g, '')
    .replace(/%.*$/, '')
  const family = isIP(normalized)
  if (family === 4) return !blockedAddresses.check(normalized, 'ipv4')
  if (family === 6) return globalUnicastIpv6.check(normalized, 'ipv6') && !blockedAddresses.check(normalized, 'ipv6')
  return false
}

// ---------------------------------------------------------------------------
// URL validation
// ---------------------------------------------------------------------------

/** Rewrites `ipfs://` / `ar://` to the trusted https gateways; other values are returned unchanged. */
export function rewriteDecentralizedUri(uri: string): string {
  const value = uri.trim()
  const ipfs = IPFS_URI.exec(value)
  if (ipfs) return `${TRUSTED_IPFS_GATEWAY}${ipfs[1]}`
  const arweave = ARWEAVE_URI.exec(value)
  if (arweave) return `${TRUSTED_ARWEAVE_GATEWAY}${arweave[1]}`
  return value
}

/**
 * Parses and statically validates an untrusted URL (no DNS): https, default port, no
 * credentials, and a hostname that is neither an IP literal nor a local/single-label name.
 */
export function parseSafeUrl(rawUrl: string, base?: URL): URL {
  if (rawUrl.length > MAX_URL_LENGTH) throw new SafeFetchError('invalid_url', 'URL too long')

  let url: URL
  try {
    url = base ? new URL(rawUrl, base) : new URL(rewriteDecentralizedUri(rawUrl))
  } catch {
    throw new SafeFetchError('invalid_url', 'Invalid URL')
  }

  if (url.protocol !== 'https:') throw new SafeFetchError('blocked_protocol', `Protocol not allowed: ${url.protocol}`)
  if (url.port !== '' && url.port !== '443') throw new SafeFetchError('blocked_port', 'Only the default https port is allowed')
  if (url.username || url.password) throw new SafeFetchError('invalid_url', 'Credentials in URL are not allowed')

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  if (!hostname || hostname.startsWith('[') || isIP(hostname) !== 0) {
    throw new SafeFetchError('blocked_host', 'IP-literal hosts are not allowed')
  }
  if (!hostname.includes('.') || hostname === 'localhost' || BLOCKED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
    throw new SafeFetchError('blocked_host', 'Local hostnames are not allowed')
  }

  return url
}

function abortError(signal: AbortSignal): SafeFetchError {
  return new SafeFetchError('timeout', signal.reason instanceof Error ? signal.reason.message : 'Request aborted')
}

function raceAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(abortError(signal))
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortError(signal))
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      }
    )
  })
}

/** Resolves the hostname and rejects it unless every returned address is public. */
export async function assertPublicHostname(hostname: string, signal: AbortSignal): Promise<void> {
  let addresses: Array<{ address: string; family: number }>
  try {
    addresses = await raceAbort(lookup(hostname, { all: true, verbatim: true }), signal)
  } catch (error) {
    if (error instanceof SafeFetchError) throw error
    throw new SafeFetchError('dns_failure', 'DNS lookup failed')
  }

  if (addresses.length === 0) throw new SafeFetchError('dns_failure', 'Hostname did not resolve')
  if (!addresses.every(({ address }) => isPublicIpAddress(address))) {
    throw new SafeFetchError('blocked_host', 'Hostname resolves to a non-public address')
  }
}

async function readBodyWithLimit(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    await response.body?.cancel().catch(() => undefined)
    throw new SafeFetchError('response_too_large', 'Response too large')
  }
  if (!response.body) return new Uint8Array(0)

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined)
      throw new SafeFetchError('response_too_large', 'Response too large')
    }
    chunks.push(value)
  }

  const body = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}

async function fetchJsonWithinDeadline(rawUrl: string, maxBytes: number, maxRedirects: number, signal: AbortSignal): Promise<unknown> {
  let url = parseSafeUrl(rawUrl)

  for (let hop = 0; ; hop++) {
    await assertPublicHostname(url.hostname.replace(/\.$/, ''), signal)

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
      cache: 'no-store',
      signal,
      headers: { Accept: 'application/json', 'User-Agent': 'CloakForge-Metadata/1.0' },
    })

    if (REDIRECT_STATUSES.has(response.status)) {
      await response.body?.cancel().catch(() => undefined)
      const location = response.headers.get('location')
      if (!location) throw new SafeFetchError('bad_redirect', 'Redirect without Location header')
      if (hop >= maxRedirects) throw new SafeFetchError('too_many_redirects', 'Too many redirects')
      url = parseSafeUrl(location, url)
      continue
    }

    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined)
      throw new SafeFetchError('http_error', `Upstream responded with ${response.status}`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!JSON_CONTENT_TYPE.test(contentType)) {
      await response.body?.cancel().catch(() => undefined)
      throw new SafeFetchError('unsupported_content_type', 'Response is not JSON')
    }

    const body = await readBodyWithLimit(response, maxBytes)
    try {
      return JSON.parse(new TextDecoder().decode(body)) as unknown
    } catch {
      throw new SafeFetchError('invalid_json', 'Response is not valid JSON')
    }
  }
}

/**
 * Fetches and parses JSON from an untrusted URL with SSRF protections (see module docs).
 * Throws {@link SafeFetchError} on any policy violation, timeout or malformed response.
 */
export async function safeFetchJson(rawUrl: string, options: SafeFetchOptions = {}): Promise<unknown> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, maxBytes = DEFAULT_MAX_BYTES, maxRedirects = DEFAULT_MAX_REDIRECTS } = options
  const deadline = AbortSignal.timeout(timeoutMs)
  const signal = options.signal ? AbortSignal.any([deadline, options.signal]) : deadline

  try {
    return await fetchJsonWithinDeadline(rawUrl, maxBytes, maxRedirects, signal)
  } catch (error) {
    if (error instanceof SafeFetchError) throw error
    if (signal.aborted) throw abortError(signal)
    throw new SafeFetchError('http_error', 'Request failed')
  }
}
