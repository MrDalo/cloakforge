import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/security/originValidator', () => ({
  validateSecurity: vi.fn().mockResolvedValue(undefined),
}))

const mockLoggerFns = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => mockLoggerFns),
}))

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
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

  // ---------------------------------------------------------------------------
  // Invalid requests
  // ---------------------------------------------------------------------------

  it('should reject non-error levels', async () => {
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
})
