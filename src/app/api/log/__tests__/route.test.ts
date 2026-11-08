import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

const mockLoggerFns = {
  warn: vi.fn(),
  error: vi.fn(),
}

const mockShipClientError = vi.fn()

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => mockLoggerFns),
  shipClientErrorToBetterStack: (...args: unknown[]) => mockShipClientError(...args),
}))

function makeRawRequest(body: string | undefined, extraHeaders: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body,
  })
}

function makeRequest(body: unknown): NextRequest {
  return makeRawRequest(JSON.stringify(body))
}

describe('POST /api/log', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    const mod = await import('../route')
    POST = mod.POST
  })

  // ---------------------------------------------------------------------------
  // Valid requests
  // ---------------------------------------------------------------------------

  it('should return 200 with { logged: true } for a valid error log payload', async () => {
    const response = await POST(
      makeRequest({
        level: 'error',
        message: 'Client-side failure',
        error: {
          message: 'Network request failed',
          type: 'TypeError',
          status: 500,
        },
        context: {
          safe: 'value',
          action: 'submit',
        },
      })
    )
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toEqual({ logged: true })
  })

  it('should accept minimal valid error payload', async () => {
    const response = await POST(makeRequest({ level: 'error', message: 'Minimal error' }))
    const json = await response.json()
    void json
    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toEqual({ logged: true })
  })

  it('should accept a valid warn log payload', async () => {
    const response = await POST(makeRequest({ level: 'warn', message: 'msg' }))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(mockLoggerFns.warn).toHaveBeenCalledWith('msg', undefined, {
      client_context: undefined,
      client_level: 'warn',
      source: 'client',
    })
  })

  it('should accept numeric context values', async () => {
    const response = await POST(
      makeRequest({
        level: 'error',
        message: 'bad context',
        context: { attempt: 1 },
      })
    )
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
  })

  // ---------------------------------------------------------------------------
  // Level downgrade + reserved fields
  // ---------------------------------------------------------------------------

  it('should log client errors locally at warn and forward them to BetterStack tagged as client', async () => {
    const error = { message: 'boom', type: 'TypeError' }
    const response = await POST(makeRequest({ level: 'error', message: 'Client-side failure', error }))

    expect(response.status).toBe(200)
    expect(mockLoggerFns.error).not.toHaveBeenCalled()
    expect(mockLoggerFns.warn).toHaveBeenCalledWith(
      'Client-side failure',
      error,
      expect.objectContaining({ client_level: 'error', source: 'client' })
    )
    expect(mockShipClientError).toHaveBeenCalledWith('Client-side failure', expect.objectContaining({ error }))
  })

  it('should not forward client warnings to BetterStack', async () => {
    const response = await POST(makeRequest({ level: 'warn', message: 'Client-side warning' }))

    expect(response.status).toBe(200)
    expect(mockShipClientError).not.toHaveBeenCalled()
  })

  it('should keep reserved fields authoritative when the client tries to forge them', async () => {
    const forgedContext = {
      dt: '1999-01-01T00:00:00.000Z',
      level: 'error',
      message: 'Database credentials leaked',
      source: 'server',
      client_level: 'fatal',
    }

    const response = await POST(makeRequest({ level: 'warn', message: 'real message', context: forgedContext }))
    expect(response.status).toBe(200)

    const [message, , logContext] = mockLoggerFns.warn.mock.calls[0]
    expect(message).toBe('real message')
    expect(logContext.source).toBe('client')
    expect(logContext.client_level).toBe('warn')
    // Client keys are nested, never spread over top-level log fields
    expect(logContext.client_context).toEqual(forgedContext)
    expect(Object.keys(logContext)).toEqual(['client_context', 'client_level', 'source'])
  })

  // ---------------------------------------------------------------------------
  // Invalid requests
  // ---------------------------------------------------------------------------

  it('should reject info level', async () => {
    const response = await POST(makeRequest({ level: 'info', message: 'msg' }))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should reject malformed payload (missing required message)', async () => {
    const response = await POST(
      makeRequest({
        level: 'error',
        error: { message: 'boom' },
      })
    )
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_message).toContain('Validation failed')
  })

  it('should return 400 for malformed JSON', async () => {
    const response = await POST(makeRawRequest('{"level":"error","message":'))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error_code).toBe('INVALID_JSON')
    // Rejected without logging a client report; the wrapper logs it at warn (not error → not shipped)
    expect(mockLoggerFns.warn).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ source: 'client' }))
    expect(mockLoggerFns.error).not.toHaveBeenCalled()
  })

  it('should return 400 for an empty body', async () => {
    const response = await POST(makeRawRequest(undefined))
    expect(response.status).toBe(400)
  })

  it('should reject a whitespace-only message', async () => {
    const response = await POST(makeRequest({ level: 'warn', message: '   ' }))
    expect(response.status).toBe(400)
  })

  it('should reject messages over 500 characters', async () => {
    const response = await POST(makeRequest({ level: 'warn', message: 'x'.repeat(501) }))
    expect(response.status).toBe(400)
  })

  it('should reject context with more than 20 keys', async () => {
    const context = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`k${i}`, i]))
    const response = await POST(makeRequest({ level: 'warn', message: 'msg', context }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error_message).toContain('at most 20 keys')
  })

  it('should accept context with exactly 20 keys', async () => {
    const context = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`k${i}`, i]))
    const response = await POST(makeRequest({ level: 'warn', message: 'msg', context }))
    expect(response.status).toBe(200)
  })

  it('should reject oversized context values and keys', async () => {
    const longValue = await POST(makeRequest({ level: 'warn', message: 'msg', context: { k: 'v'.repeat(501) } }))
    const longKey = await POST(makeRequest({ level: 'warn', message: 'msg', context: { ['k'.repeat(65)]: 'v' } }))

    expect(longValue.status).toBe(400)
    expect(longKey.status).toBe(400)
  })

  it('should reject nested context objects', async () => {
    const response = await POST(makeRequest({ level: 'warn', message: 'msg', context: { nested: { a: 1 } } }))
    expect(response.status).toBe(400)
  })

  it('should reject stack traces over the limit', async () => {
    const response = await POST(makeRequest({ level: 'error', message: 'msg', error: { stack_trace: 's'.repeat(2001) } }))
    expect(response.status).toBe(400)
  })

  it('should return 413 for bodies over 8 KB', async () => {
    const response = await POST(makeRequest({ level: 'warn', message: 'msg', padding: 'p'.repeat(8 * 1024) }))
    const json = await response.json()

    expect(response.status).toBe(413)
    expect(json.error_code).toBe('PAYLOAD_TOO_LARGE')
    // Rejected without logging a client report; the wrapper logs it at warn (not error → not shipped)
    expect(mockLoggerFns.warn).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ source: 'client' }))
    expect(mockLoggerFns.error).not.toHaveBeenCalled()
  })

  it('should return 413 when Content-Length declares more than 8 KB', async () => {
    const response = await POST(
      makeRawRequest(JSON.stringify({ level: 'warn', message: 'msg' }), { 'content-length': String(8 * 1024 + 1) })
    )
    expect(response.status).toBe(413)
  })
})
