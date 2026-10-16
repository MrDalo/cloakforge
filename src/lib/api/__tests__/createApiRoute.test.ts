import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { z } from 'zod'

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

const testSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
})

function makePostRequest(body: unknown, url = 'http://localhost:3000/api/test'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(url = 'http://localhost:3000/api/test'): NextRequest {
  return new NextRequest(url, { method: 'GET' })
}

describe('createApiRoute', () => {
  let createApiRoute: typeof import('../createApiRoute').createApiRoute

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../createApiRoute')
    createApiRoute = mod.createApiRoute
  })

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('should returns 200 with data for a valid POST request', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async (data) => ({ echo: data.name, doubled: data.value * 2 }),
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 5 }))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.status_code).toBe(200)
    expect(json.data).toEqual({ echo: 'Alice', doubled: 10 })
    expect(json.error_message).toBe('')
  })

  it('should passes validated data to the handler', async () => {
    const handlerFn = vi.fn().mockResolvedValue({ ok: true })
    const handler = createApiRoute({ name: 'test', schema: testSchema, handler: handlerFn })

    await handler(makePostRequest({ name: 'Bob', value: 99 }))

    expect(handlerFn).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bob', value: 99 }), expect.any(NextRequest))
  })

  // ---------------------------------------------------------------------------
  // Validation failures
  // ---------------------------------------------------------------------------

  it('should returns 400 when required field is missing', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makePostRequest({ value: 10 }))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.status_code).toBe(400)
    expect(json.error_message).toContain('Validation failed')
    expect(json.data).toBeNull()
  })

  it('should returns 400 for wrong field type', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 'not-a-number' }))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should returns 400 for an empty body', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makePostRequest({}))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  // ---------------------------------------------------------------------------
  // Handler errors
  // ---------------------------------------------------------------------------

  it('should returns 500 when handler throws a generic Error', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => {
        throw new Error('Something went wrong')
      },
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 1 }))
    const json = await response.json()
    void json

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
    expect(json.status_code).toBe(500)
    expect(json.data).toBeNull()
  })

  it('should return a generic message (not the raw error text) for non-AppError failures', async () => {
    const { ERROR_MESSAGES } = await import('@/lib/errors')
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => {
        throw new Error('VersionMismatch https://api.contentful.com/spaces/abc123/entries/xyz token=…a1b2c')
      },
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 1 }))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error_message).toBe(ERROR_MESSAGES.INTERNAL_ERROR)
    expect(json.error_code).toBe('INTERNAL_ERROR')
    expect(JSON.stringify(json)).not.toContain('contentful')
  })

  it('should return a generic message for thrown non-Error values', async () => {
    const { ERROR_MESSAGES } = await import('@/lib/errors')
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => {
        throw 'raw string failure with internal detail'
      },
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 1 }))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error_message).toBe(ERROR_MESSAGES.INTERNAL_ERROR)
  })

  it('should still map well-known RPC errors to their fixed friendly message', async () => {
    const { ERROR_MESSAGES } = await import('@/lib/errors')
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => {
        throw new Error('429 Too Many Requests from https://private-rpc.example/?api-key=secret')
      },
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 1 }))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error_message).toBe(ERROR_MESSAGES.RPC_RATE_LIMITED)
  })

  // ---------------------------------------------------------------------------
  // Body parsing: malformed / empty / oversize
  // ---------------------------------------------------------------------------

  function makeRawPostRequest(rawBody: string | undefined, extraHeaders: Record<string, string> = {}): NextRequest {
    return new NextRequest('http://localhost:3000/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extraHeaders },
      body: rawBody,
    })
  }

  it('should return 400 INVALID_JSON for malformed JSON without echoing parser text', async () => {
    const handlerFn = vi.fn()
    const handler = createApiRoute({ name: 'test', schema: testSchema, handler: handlerFn })

    const response = await handler(makeRawPostRequest('{"name": "Alice", value: '))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.status_code).toBe(400)
    expect(json.error_code).toBe('INVALID_JSON')
    expect(json.error_message).toBe('Request body must be valid JSON')
    expect(json.error_message).not.toMatch(/position|unexpected|token/i)
    expect(handlerFn).not.toHaveBeenCalled()
  })

  it('should return 400 INVALID_JSON for an empty request body', async () => {
    const handler = createApiRoute({ name: 'test', schema: testSchema, handler: async () => ({ ok: true }) })

    const response = await handler(makeRawPostRequest(undefined))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error_code).toBe('INVALID_JSON')
    expect(json.error_message).not.toContain('Unexpected end of JSON input')
  })

  it('should return 400 INVALID_JSON for a whitespace-only body', async () => {
    const handler = createApiRoute({ name: 'test', schema: testSchema, handler: async () => ({ ok: true }) })

    const response = await handler(makeRawPostRequest('   \n'))

    expect(response.status).toBe(400)
    expect((await response.json()).error_code).toBe('INVALID_JSON')
  })

  it('should return 413 when Content-Length exceeds the default 1 MB cap', async () => {
    const { DEFAULT_MAX_BODY_BYTES } = await import('../createApiRoute')
    const handlerFn = vi.fn()
    const handler = createApiRoute({ name: 'test', schema: testSchema, handler: handlerFn })

    const response = await handler(
      makeRawPostRequest(JSON.stringify({ name: 'Alice', value: 1 }), { 'content-length': String(DEFAULT_MAX_BODY_BYTES + 1) })
    )
    const json = await response.json()

    expect(DEFAULT_MAX_BODY_BYTES).toBe(1024 * 1024)
    expect(response.status).toBe(413)
    expect(json.error_code).toBe('PAYLOAD_TOO_LARGE')
    expect(handlerFn).not.toHaveBeenCalled()
  })

  it('should return 413 when the streamed body exceeds the cap without a Content-Length header', async () => {
    const handlerFn = vi.fn()
    const handler = createApiRoute({ name: 'test', schema: testSchema, handler: handlerFn })
    const oversized = JSON.stringify({ name: 'x'.repeat(1024 * 1024 + 10), value: 1 })

    const request = makeRawPostRequest(oversized)
    expect(request.headers.get('content-length')).toBeNull()

    const response = await handler(request)

    expect(response.status).toBe(413)
    expect((await response.json()).error_code).toBe('PAYLOAD_TOO_LARGE')
    expect(handlerFn).not.toHaveBeenCalled()
  })

  it('should honour a custom maxBodyBytes limit', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      maxBodyBytes: 32,
      handler: async () => ({ ok: true }),
    })

    const small = await handler(makePostRequest({ name: 'A', value: 1 }))
    const large = await handler(makePostRequest({ name: 'A'.repeat(64), value: 1 }))

    expect(small.status).toBe(200)
    expect(large.status).toBe(413)
  })

  it('should returns AppError status code when handler throws AppError', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => {
        const { AppError } = await import('@/lib/errors')
        throw new AppError('UNAUTHORIZED', 'Not allowed', 401)
      },
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 1 }))
    const json = await response.json()
    void json

    expect(response.status).toBe(401)
    expect(json.status).toBe('error')
    expect(json.status_code).toBe(401)
    expect(json.error_message).toContain('Not allowed')
    expect(json.error_code).toBe('UNAUTHORIZED')
  })

  it('should returns 403 when handler throws FORBIDDEN AppError', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => {
        const { AppError } = await import('@/lib/errors')
        throw new AppError('FORBIDDEN', 'No access', 403)
      },
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 1 }))
    const json = await response.json()
    void json

    expect(response.status).toBe(403)
  })

  // ---------------------------------------------------------------------------
  // GET method
  // ---------------------------------------------------------------------------

  it('should handles GET requests by validating an empty body against schema', async () => {
    const getSchema = z.object({}).optional().default({})

    const handler = createApiRoute({
      name: 'test-get',
      schema: getSchema as z.ZodSchema,
      method: 'GET',
      handler: async () => ({ list: ['a', 'b'] }),
    })

    const response = await handler(makeGetRequest())
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toEqual({ list: ['a', 'b'] })
  })

  // ---------------------------------------------------------------------------
  // Handler AppError propagation
  // ---------------------------------------------------------------------------

  it('should returns the AppError status and message when the handler throws AppError', async () => {
    const { AppError } = await import('@/lib/errors')

    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => {
        throw new AppError('UNAUTHORIZED', 'Invalid wallet signature', 401)
      },
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 1 }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.status).toBe('error')
    expect(json.error_message).toContain('Invalid wallet signature')
  })
})
