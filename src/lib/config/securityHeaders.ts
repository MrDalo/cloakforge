/**
 * Security response headers (SRV-08 / H2), applied to every route by `next.config.ts` → `headers()`.
 *
 * next.config.ts is evaluated in plain Node at `next build` / `next dev` start, so this module must stay
 * dependency-free: no 'server-only', no `@/` path aliases, no env validation side effects.
 *
 * CSP rollout:
 * - `Content-Security-Policy` (ENFORCED) carries only directives that cannot break the app:
 *   anti-clickjacking (`frame-ancestors`), `base-uri`, `object-src`, `form-action`.
 * - `Content-Security-Policy-Report-Only` carries the full target policy. Watch the browser console
 *   for violations, then promote it to the enforced header.
 *
 * Why `script-src 'unsafe-inline'` instead of nonces: Next.js injects inline bootstrap/RSC payload
 * scripts. A nonce must be generated per request in `proxy.ts`, and Next only applies it to pages
 * that render dynamically — every page would opt out of static prerendering, which conflicts with
 * `cacheComponents` / PPR. Hashes are not viable either because the inline payloads change per page.
 */

export interface SecurityHeader {
  key: string
  value: string
}

export interface SecurityHeaderOptions {
  /** `next dev`: allows 'unsafe-eval' (React Refresh) and ws: (HMR) in the report-only policy. */
  isDevelopment: boolean
  /** Vercel preview deployment: allows the Vercel toolbar (vercel.live) in the report-only policy. */
  isVercelPreview: boolean
  /** `NEXT_PUBLIC_RPC_ENDPOINT`. Its host is allowed (https + wss) when not already covered by Alchemy. */
  clientRpcEndpoint?: string
  /** `IPFS_GATEWAY` (dedicated Pinata gateway hostname) that serves uploaded token metadata JSON. */
  ipfsGateway?: string
}

type CspDirectives = Record<string, readonly string[]>

// ── Hosts the browser really talks to (verified by grep, Oct 2026) ──────────────────────────

/**
 * Client RPC: `NEXT_PUBLIC_RPC_ENDPOINT` → `solana-<cluster>.g.alchemy.com` (src/lib/config/getConfig.ts,
 * SolanaProvider ConnectionProvider). wss is required: web3.js `confirmTransaction` subscribes over WebSocket.
 */
const ALCHEMY_RPC_SOURCES = ['https://*.alchemy.com', 'wss://*.alchemy.com'] as const

/** Public Pinata gateway used to resolve `ipfs://` metadata URIs client-side (src/lib/solana/getTokenMetadata.ts). */
const PINATA_PUBLIC_GATEWAY = 'https://gateway.pinata.cloud'

/**
 * Off-chain token metadata JSON is fetched client-side from arbitrary creator-chosen hosts
 * (src/lib/solana/tokens.ts `fetchImage`, src/lib/solana/getTokenMetadata.ts,
 * UpdateMetadataForm/validateUpdateMetadataToken.ts). Until those fetches move behind a server proxy,
 * connect-src must allow any https origin. Remove this source once that lands.
 */
const ARBITRARY_METADATA_HOSTS = 'https:'

/** Solflare SDK iframe (`Solflare.IFRAME_URL` in @solflare-wallet/sdk, via @solana/wallet-adapter-solflare). */
const SOLFLARE_CONNECT_FRAME = 'https://connect.solflare.com'

/** @solana/wallet-adapter-react-ui/styles.css (imported in src/app/layout.tsx) @imports DM Sans from Google Fonts. */
const GOOGLE_FONTS_STYLESHEET = 'https://fonts.googleapis.com'
const GOOGLE_FONTS_FILES = 'https://fonts.gstatic.com'

/** Vercel preview toolbar / comments (preview deployments only). */
const VERCEL_LIVE = 'https://vercel.live'
const VERCEL_LIVE_ASSETS = 'https://assets.vercel.com'
const VERCEL_LIVE_PUSHER = 'wss://ws-us3.pusher.com'

/** Hostname guard so env-provided values can never inject extra CSP directives. */
const HOSTNAME_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i

/**
 * Permissions-Policy. The Ledger adapter (@solana/wallet-adapter-ledger) uses WebHID only
 * (@ledgerhq/hw-transport-webhid), so `hid=(self)` stays enabled and WebUSB is disabled.
 */
export const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), hid=(self)'

export const HSTS_VALUE = 'max-age=63072000; includeSubDomains; preload'

const serializeCsp = (directives: CspDirectives): string =>
  Object.entries(directives)
    .map(([name, sources]) => (sources.length > 0 ? `${name} ${sources.join(' ')}` : name))
    .join('; ')

/**
 * Converts the client RPC URL into https/wss sources when it is not already covered by `*.alchemy.com`.
 *
 * @param endpoint - `NEXT_PUBLIC_RPC_ENDPOINT` value.
 * @returns CSP sources for the RPC host (empty when unset, invalid or Alchemy).
 */
const getClientRpcSources = (endpoint: string | undefined): string[] => {
  if (!endpoint) return []

  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return []
  }

  const hostname = url.hostname.toLowerCase()
  const isHttp = url.protocol === 'http:' || url.protocol === 'https:'
  if (!isHttp || hostname === 'alchemy.com' || hostname.endsWith('.alchemy.com')) return []

  const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  // web3.js derives the WebSocket port as RPC port + 1 when an explicit port is set, hence `:*`.
  return [`${url.protocol}//${url.host}`, `${wsProtocol}//${hostname}${url.port ? ':*' : ''}`]
}

/**
 * Converts the dedicated Pinata gateway hostname (`IPFS_GATEWAY`, no scheme) into a CSP source.
 *
 * @param gateway - Gateway hostname, e.g. `example.mypinata.cloud`.
 * @returns A single https source, or nothing when unset/malformed.
 */
const getIpfsGatewaySources = (gateway: string | undefined): string[] => {
  const hostname = gateway?.trim()
  if (!hostname || !HOSTNAME_PATTERN.test(hostname)) return []
  return [`https://${hostname.toLowerCase()}`]
}

/** Directives enforced today: safe for every page, no allowlists that could break wallets. */
export const ENFORCED_CSP_DIRECTIVES: CspDirectives = {
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'object-src': ["'none'"],
  'form-action': ["'self'"],
}

/**
 * Builds the enforced `Content-Security-Policy` value.
 *
 * @returns Serialized CSP string.
 */
export const buildEnforcedCsp = (): string => serializeCsp(ENFORCED_CSP_DIRECTIVES)

/**
 * Builds the full target policy shipped as `Content-Security-Policy-Report-Only`.
 *
 * @param options - Environment-dependent switches and hosts.
 * @returns Serialized CSP string.
 */
export const buildReportOnlyCsp = (options: SecurityHeaderOptions): string => {
  const { isDevelopment, isVercelPreview } = options
  const preview = (...sources: string[]): string[] => (isVercelPreview ? sources : [])
  const dev = (...sources: string[]): string[] => (isDevelopment ? sources : [])

  const directives: CspDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", ...dev("'unsafe-eval'"), ...preview(VERCEL_LIVE)],
    'style-src': ["'self'", "'unsafe-inline'", GOOGLE_FONTS_STYLESHEET, ...preview(VERCEL_LIVE)],
    // Token logos come from arbitrary metadata hosts.
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", GOOGLE_FONTS_FILES, ...preview(VERCEL_LIVE, VERCEL_LIVE_ASSETS)],
    'connect-src': [
      "'self'",
      ...ALCHEMY_RPC_SOURCES,
      ...getClientRpcSources(options.clientRpcEndpoint),
      PINATA_PUBLIC_GATEWAY,
      ...getIpfsGatewaySources(options.ipfsGateway),
      ARBITRARY_METADATA_HOSTS,
      ...dev('ws:'),
      ...preview(VERCEL_LIVE, VERCEL_LIVE_PUSHER),
    ],
    'frame-src': [SOLFLARE_CONNECT_FRAME, ...preview(VERCEL_LIVE)],
    'worker-src': ["'self'", 'blob:'],
    ...ENFORCED_CSP_DIRECTIVES,
  }

  return serializeCsp(directives)
}

/**
 * Builds the security header list applied to every route.
 *
 * @param options - Environment-dependent switches and hosts.
 * @returns Header key/value pairs for next.config `headers()`.
 */
export const buildSecurityHeaders = (options: SecurityHeaderOptions): SecurityHeader[] => [
  { key: 'Content-Security-Policy', value: buildEnforcedCsp() },
  { key: 'Content-Security-Policy-Report-Only', value: buildReportOnlyCsp(options) },
  { key: 'Strict-Transport-Security', value: HSTS_VALUE },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: PERMISSIONS_POLICY },
  // Wallet popups (Solflare web wallet) must keep `window.opener`.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
]

/**
 * Reads the header options from the build environment (next.config runs at build / dev start).
 *
 * @param env - Environment source, defaults to `process.env`.
 * @returns Options for {@link buildSecurityHeaders}.
 */
export const getSecurityHeaderOptionsFromEnv = (
  env: Readonly<Record<string, string | undefined>> = process.env
): SecurityHeaderOptions => ({
  isDevelopment: env.NODE_ENV !== 'production',
  isVercelPreview: env.VERCEL_ENV === 'preview',
  clientRpcEndpoint: env.NEXT_PUBLIC_RPC_ENDPOINT,
  ipfsGateway: env.IPFS_GATEWAY,
})
