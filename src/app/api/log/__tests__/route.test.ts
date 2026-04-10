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

  it('returns 200 with { logged: true } for a valid info log', async () => {
    const response = await POST(makeRequest({ level: 'info', args: ['Hello from client'] }))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toEqual({ logged: true })
  })

  it('accepts "warn" log level', async () => {
    const response = await POST(makeRequest({ level: 'warn', args: ['Warning message'] }))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.data).toEqual({ logged: true })
  })

  it('accepts "error" log level', async () => {
    const response = await POST(makeRequest({ level: 'error', args: ['Error message'] }))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.data).toEqual({ logged: true })
  })

  it('accepts "debug" log level', async () => {
    const response = await POST(makeRequest({ level: 'debug', args: 'single debug string' }))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.data).toEqual({ logged: true })
  })

  it('accepts array args', async () => {
    const response = await POST(makeRequest({ level: 'info', args: ['arg1', 'arg2', { key: 'value' }] }))
    const json = await response.json()
    void json
    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
  })

  it('accepts non-array args (wraps in array)', async () => {
    const response = await POST(makeRequest({ level: 'info', args: { message: 'object log' } }))
    const json = await response.json()
    void json
    expect(response.status).toBe(200)
  })

  // ---------------------------------------------------------------------------
  // Invalid requests
  // ---------------------------------------------------------------------------

  it('returns 400 for an invalid log level', async () => {
    const response = await POST(makeRequest({ level: 'verbose', args: ['msg'] }))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('returns 400 when level is missing', async () => {
    const response = await POST(makeRequest({ args: ['msg'] }))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_message).toContain('Validation failed')
  })

  it('returns 400 for empty body', async () => {
    const response = await POST(makeRequest({}))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })
})
