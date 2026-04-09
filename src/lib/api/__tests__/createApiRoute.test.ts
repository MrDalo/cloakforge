import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { z } from 'zod'

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/security/originValidator', () => ({
  validateSecurity: vi.fn().mockResolvedValue(undefined),
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
  let AppError: typeof import('@/lib/errors').AppError

  beforeEach(async () => {
    vi.resetModules()
    const mod = await import('../createApiRoute')
    createApiRoute = mod.createApiRoute
    const errors = await import('@/lib/errors')
    AppError = errors.AppError
  })

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('returns 200 with data for a valid POST request', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async (data) => ({ echo: data.name, doubled: data.value * 2 }),
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 5 }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.status_code).toBe(200)
    expect(json.data).toEqual({ echo: 'Alice', doubled: 10 })
    expect(json.error_message).toBe('')
  })

  it('passes validated data to the handler', async () => {
    const handlerFn = vi.fn().mockResolvedValue({ ok: true })
    const handler = createApiRoute({ name: 'test', schema: testSchema, handler: handlerFn })

    await handler(makePostRequest({ name: 'Bob', value: 99 }))

    expect(handlerFn).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Bob', value: 99 }),
      expect.any(NextRequest)
    )
  })

  // ---------------------------------------------------------------------------
  // Validation failures
  // ---------------------------------------------------------------------------

  it('returns 400 when required field is missing', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makePostRequest({ value: 10 }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.status_code).toBe(400)
    expect(json.error_message).toContain('Validation failed')
    expect(json.data).toBeNull()
  })

  it('returns 400 for wrong field type', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 'not-a-number' }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('returns 400 for an empty body', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makePostRequest({}))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  // ---------------------------------------------------------------------------
  // Handler errors
  // ---------------------------------------------------------------------------

  it('returns 500 when handler throws a generic Error', async () => {
    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => {
        throw new Error('Something went wrong')
      },
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 1 }))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
    expect(json.status_code).toBe(500)
    expect(json.data).toBeNull()
  })

  it('returns AppError status code when handler throws AppError', async () => {
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

    expect(response.status).toBe(401)
    expect(json.status).toBe('error')
    expect(json.status_code).toBe(401)
    expect(json.error_message).toContain('Not allowed')
  })

  it('returns 403 when handler throws FORBIDDEN AppError', async () => {
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

    expect(response.status).toBe(403)
  })

  // ---------------------------------------------------------------------------
  // GET method
  // ---------------------------------------------------------------------------

  it('handles GET requests by validating an empty body against schema', async () => {
    const getSchema = z.object({}).optional().default({})

    const handler = createApiRoute({
      name: 'test-get',
      schema: getSchema as z.ZodSchema,
      method: 'GET',
      handler: async () => ({ list: ['a', 'b'] }),
    })

    const response = await handler(makeGetRequest())
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toEqual({ list: ['a', 'b'] })
  })

  // ---------------------------------------------------------------------------
  // Security validation integration
  // ---------------------------------------------------------------------------

  it('calls validateSecurity on each request', async () => {
    const { validateSecurity } = await import('@/lib/security/originValidator')

    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    await handler(makePostRequest({ name: 'Alice', value: 1 }))
    expect(validateSecurity).toHaveBeenCalled()
  })

  it('returns 403 when security validation throws FORBIDDEN AppError', async () => {
    const { validateSecurity } = await import('@/lib/security/originValidator')
    const { AppError } = await import('@/lib/errors')
    vi.mocked(validateSecurity).mockRejectedValueOnce(new AppError('FORBIDDEN', 'Unauthorized origin', 403))

    const handler = createApiRoute({
      name: 'test',
      schema: testSchema,
      handler: async () => ({ ok: true }),
    })

    const response = await handler(makePostRequest({ name: 'Alice', value: 1 }))
    const json = await response.json()

    expect(response.status).toBe(403)
    expect(json.status).toBe('error')
    expect(json.error_message).toContain('Unauthorized origin')
  })
})
