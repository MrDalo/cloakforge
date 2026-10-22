import 'server-only'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'api', route: '/api/csp-report', method: 'POST' })

/** Larger bodies are dropped unread (a single violation report is well under 4 KB). */
export const MAX_CSP_REPORT_BYTES = 16 * 1024

/** Reporting API batches several reports per request; only the first few are summarized. */
const MAX_REPORTS_PER_REQUEST = 10

const MAX_PATH_LENGTH = 200

const LEGACY_CONTENT_TYPE = 'application/csp-report'
const REPORTING_API_CONTENT_TYPE = 'application/reports+json'

/** CSP keywords reported instead of a URL (`inline`, `eval`, `wasm-eval`, `trusted-types-sink`, ...). */
const KEYWORD_PATTERN = /^[a-z][a-z-]{0,31}$/
const DIRECTIVE_PATTERN = /^[a-z][a-z-]{0,63}$/
const HOST_SCHEMES = new Set(['http:', 'https:', 'ws:', 'wss:'])

/** Compact, value-safe summary of one violation. */
export interface CspViolationSummary {
  /** Keyword (`inline`, `eval`, ...), bare scheme (`data`, `blob`, ...) or `<scheme> <host[:port]>`. */
  blocked_uri: string
  /** Directive name only (never the policy's source list). */
  violated_directive: string
  /** Path of the page that triggered the violation (no query string or fragment). */
  document_path: string
}

type JsonRecord = Record<string, unknown>

const asRecord = (value: unknown): JsonRecord | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : null

const asString = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined)

const noContent = (): Response => new Response(null, { status: 204 })

const parseUrl = (value: string): URL | null => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/**
 * Reduces a blocked URI to its scheme and host so paths, queries (RPC API keys) and fragments are
 * never logged. Formatted as `<scheme> <host>` because the logger redacts `http(s)://` URLs.
 */
const summarizeBlockedUri = (value: string | undefined): string => {
  const trimmed = value?.trim() ?? ''
  if (trimmed === '') return 'none'
  if (KEYWORD_PATTERN.test(trimmed)) return trimmed

  const url = parseUrl(trimmed)
  if (!url) return 'invalid'

  const scheme = url.protocol.slice(0, -1)
  return HOST_SCHEMES.has(url.protocol) && url.host ? `${scheme} ${url.host}` : scheme
}

/** First token only: legacy browsers report the whole directive including its source list. */
const summarizeDirective = (value: string | undefined): string => {
  const name = value?.trim().split(/\s+/)[0]?.toLowerCase() ?? ''
  return DIRECTIVE_PATTERN.test(name) ? name : 'unknown'
}

const summarizeDocumentPath = (value: string | undefined): string => {
  const url = value ? parseUrl(value) : null
  return url ? url.pathname.slice(0, MAX_PATH_LENGTH) : 'unknown'
}

/** `application/csp-report` (report-uri): `{ "csp-report": { "blocked-uri", "violated-directive", ... } }` */
const summarizeLegacyReport = (payload: unknown): CspViolationSummary[] => {
  const report = asRecord(asRecord(payload)?.['csp-report'])
  if (!report) return []

  return [
    {
      blocked_uri: summarizeBlockedUri(asString(report['blocked-uri'])),
      violated_directive: summarizeDirective(asString(report['violated-directive']) ?? asString(report['effective-directive'])),
      document_path: summarizeDocumentPath(asString(report['document-uri'])),
    },
  ]
}

/** `application/reports+json` (Reporting API): `[{ "type": "csp-violation", "body": { "blockedURL", ... } }]` */
const summarizeReportingApiReports = (payload: unknown): CspViolationSummary[] => {
  if (!Array.isArray(payload)) return []

  return payload
    .slice(0, MAX_REPORTS_PER_REQUEST)
    .map(asRecord)
    .filter((entry): entry is JsonRecord => entry !== null && entry.type === 'csp-violation')
    .map((entry) => asRecord(entry.body))
    .filter((body): body is JsonRecord => body !== null)
    .map((body) => ({
      blocked_uri: summarizeBlockedUri(asString(body.blockedURL)),
      violated_directive: summarizeDirective(asString(body.effectiveDirective) ?? asString(body.violatedDirective)),
      document_path: summarizeDocumentPath(asString(body.documentURL)),
    }))
}

/**
 * Reads the body as text, or returns null when it exceeds {@link MAX_CSP_REPORT_BYTES}.
 * The declared Content-Length is checked first; the cap is enforced again while streaming.
 */
const readBodyWithinLimit = async (request: Request): Promise<string | null> => {
  const declaredLength = request.headers.get('content-length')
  if (declaredLength !== null) {
    const length = Number(declaredLength)
    if (!Number.isFinite(length) || length < 0 || length > MAX_CSP_REPORT_BYTES) return null
  }

  if (!request.body) return ''

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > MAX_CSP_REPORT_BYTES) {
      await reader.cancel().catch(() => undefined)
      return null
    }
    chunks.push(value)
  }

  return Buffer.concat(chunks).toString('utf8')
}

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const getMediaType = (request: Request): string => request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''

/**
 * POST /api/csp-report
 *
 * Receives `Content-Security-Policy-Report-Only` violation reports (`report-uri`, see
 * src/lib/config/securityHeaders.ts). Unauthenticated, so:
 * - only `application/csp-report` and `application/reports+json` bodies are read, capped at 16 KB;
 * - only a compact summary is logged at warn: blocked URI reduced to scheme + host, directive name,
 *   and document path (no query strings, policies, source files or user agents);
 * - the response is always an empty 204, whatever was sent (input is never echoed);
 * - rate-limit this route with a Vercel WAF rule, like /api/log.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const mediaType = getMediaType(request)
    if (mediaType !== LEGACY_CONTENT_TYPE && mediaType !== REPORTING_API_CONTENT_TYPE) {
      return noContent()
    }

    const body = await readBodyWithinLimit(request)
    if (body === null) return noContent()

    const payload = parseJson(body)
    const violations = mediaType === LEGACY_CONTENT_TYPE ? summarizeLegacyReport(payload) : summarizeReportingApiReports(payload)

    if (violations.length > 0) {
      logger.warn('CSP violation reported', undefined, { violations })
    }
  } catch (error) {
    // Body stream errors (client aborted, etc.) — never surface details to the reporter.
    logger.warn('Failed to read CSP violation report', error)
  }

  return noContent()
}
