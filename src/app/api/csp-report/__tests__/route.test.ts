import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const mockLogger = vi.hoisted(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }))
vi.mock('@/lib/logger/logger', () => ({ getLogger: () => mockLogger }))

import { MAX_CSP_REPORT_BYTES, POST } from '../route'

const URL_BASE = 'https://cloakforge.app/api/csp-report'

const makeRequest = (body: string | ReadableStream<Uint8Array> | null, contentType?: string, extraHeaders: Record<string, string> = {}) =>
  new Request(URL_BASE, {
    method: 'POST',
    headers: { ...(contentType ? { 'content-type': contentType } : {}), ...extraHeaders },
    body,
    ...(body instanceof ReadableStream ? { duplex: 'half' } : {}),
  } as ConstructorParameters<typeof Request>[1])

const LEGACY_REPORT = {
  'csp-report': {
    'document-uri': 'https://cloakforge.app/tools/token-creator?ref=secret-ref#frag',
    referrer: 'https://referrer.example/private',
    'violated-directive': 'connect-src',
    'effective-directive': 'connect-src',
    'original-policy': "default-src 'self'; connect-src 'self' https:",
    'blocked-uri': 'ws://localhost:58231/solana-wallet?association=secret-token',
    'status-code': 200,
    'source-file': 'https://cloakforge.app/_next/static/chunks/app.js',
  },
}

const getLoggedViolations = (): unknown => (mockLogger.warn.mock.calls[0]?.[2] as { violations: unknown } | undefined)?.violations

const expectEmpty204 = async (response: Response): Promise<void> => {
  expect(response.status).toBe(204)
  expect(await response.text()).toBe('')
}

describe('POST /api/csp-report', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should log a compact summary of a report-uri (application/csp-report) violation and return an empty 204', async () => {
    const response = await POST(makeRequest(JSON.stringify(LEGACY_REPORT), 'application/csp-report'))

    await expectEmpty204(response)
    expect(mockLogger.warn).toHaveBeenCalledOnce()
    expect(mockLogger.warn).toHaveBeenCalledWith('CSP violation reported', undefined, {
      violations: [{ blocked_uri: 'ws localhost:58231', violated_directive: 'connect-src', document_path: '/tools/token-creator' }],
    })
  })

  it('should never log query strings, fragments, policies, referrers or source files', async () => {
    await POST(makeRequest(JSON.stringify(LEGACY_REPORT), 'application/csp-report; charset=utf-8'))

    const logged = JSON.stringify(mockLogger.warn.mock.calls)
    for (const secret of ['secret-ref', 'secret-token', 'frag', 'referrer.example', 'original-policy', "default-src 'self'", 'app.js']) {
      expect(logged).not.toContain(secret)
    }
  })

  it('should summarize Reporting API (application/reports+json) batches and skip non-CSP reports', async () => {
    const reports = [
      {
        type: 'csp-violation',
        url: 'https://cloakforge.app/admin',
        body: {
          documentURL: 'https://cloakforge.app/admin?tab=1',
          blockedURL: 'https://evil.example:8443/x.js?k=v',
          effectiveDirective: 'script-src-elem',
          disposition: 'report',
        },
      },
      { type: 'deprecation', body: { id: 'x' } },
      {
        type: 'csp-violation',
        body: { documentURL: 'https://cloakforge.app/', blockedURL: 'inline', effectiveDirective: 'style-src-attr' },
      },
      {
        type: 'csp-violation',
        body: { documentURL: 'not a url', blockedURL: 'data:image/png;base64,AAAA', effectiveDirective: 'img-src' },
      },
    ]

    await expectEmpty204(await POST(makeRequest(JSON.stringify(reports), 'application/reports+json')))

    expect(getLoggedViolations()).toEqual([
      { blocked_uri: 'https evil.example:8443', violated_directive: 'script-src-elem', document_path: '/admin' },
      { blocked_uri: 'inline', violated_directive: 'style-src-attr', document_path: '/' },
      { blocked_uri: 'data', violated_directive: 'img-src', document_path: 'unknown' },
    ])
  })

  it('should keep only the directive name from legacy full-directive reports and reject odd values', async () => {
    const report = {
      'csp-report': {
        'document-uri': 'https://cloakforge.app/',
        'violated-directive': "connect-src 'self' https://*.alchemy.com",
        'blocked-uri': 'javascript:alert(1)',
      },
    }
    await POST(makeRequest(JSON.stringify(report), 'application/csp-report'))

    expect(getLoggedViolations()).toEqual([{ blocked_uri: 'javascript', violated_directive: 'connect-src', document_path: '/' }])

    vi.clearAllMocks()
    const weird = { 'csp-report': { 'violated-directive': '<script>', 'blocked-uri': '  ', 'document-uri': 42 } }
    await POST(makeRequest(JSON.stringify(weird), 'application/csp-report'))

    expect(getLoggedViolations()).toEqual([{ blocked_uri: 'none', violated_directive: 'unknown', document_path: 'unknown' }])
  })

  it('should cap the number of summarized Reporting API reports per request', async () => {
    const report = {
      type: 'csp-violation',
      body: { documentURL: 'https://cloakforge.app/', blockedURL: 'eval', effectiveDirective: 'script-src' },
    }
    await POST(makeRequest(JSON.stringify(Array.from({ length: 50 }, () => report)), 'application/reports+json'))

    expect(getLoggedViolations()).toHaveLength(10)
  })

  it.each([
    ['application/json', JSON.stringify(LEGACY_REPORT)],
    ['text/plain', JSON.stringify(LEGACY_REPORT)],
    [undefined, JSON.stringify(LEGACY_REPORT)],
  ])('should ignore unsupported content types (%s) without logging', async (contentType, body) => {
    await expectEmpty204(await POST(makeRequest(body, contentType)))
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it.each([
    ['invalid JSON', 'application/csp-report', '{not json'],
    ['wrong legacy shape', 'application/csp-report', JSON.stringify([LEGACY_REPORT])],
    ['wrong Reporting API shape', 'application/reports+json', JSON.stringify(LEGACY_REPORT)],
    ['empty body', 'application/csp-report', ''],
  ])('should return 204 without logging for %s', async (_label, contentType, body) => {
    await expectEmpty204(await POST(makeRequest(body, contentType)))
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('should drop bodies whose declared Content-Length exceeds 16 KB', async () => {
    const response = await POST(
      makeRequest(JSON.stringify(LEGACY_REPORT), 'application/csp-report', { 'content-length': String(MAX_CSP_REPORT_BYTES + 1) })
    )

    await expectEmpty204(response)
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('should stop reading a streamed body once it exceeds 16 KB', async () => {
    const encoder = new TextEncoder()
    let pulls = 0
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1
        if (pulls > 100) {
          controller.close()
          return
        }
        controller.enqueue(encoder.encode(' '.repeat(1024)))
      },
    })

    await expectEmpty204(await POST(makeRequest(stream, 'application/csp-report')))
    expect(pulls).toBeLessThan(100)
    expect(mockLogger.warn).not.toHaveBeenCalled()
  })

  it('should accept a body exactly at the 16 KB limit', async () => {
    const json = JSON.stringify(LEGACY_REPORT)
    const padded = json + ' '.repeat(MAX_CSP_REPORT_BYTES - Buffer.byteLength(json))

    await expectEmpty204(await POST(makeRequest(padded, 'application/csp-report')))
    expect(mockLogger.warn).toHaveBeenCalledOnce()
  })

  it('should only export a POST handler', async () => {
    const mod = await import('../route')

    expect(Object.keys(mod).filter((key) => /^(GET|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(key))).toEqual([])
  })
})
