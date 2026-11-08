import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

const mockRevalidateTag = vi.fn()
vi.mock('next/cache', () => ({
  revalidateTag: (...args: unknown[]) => mockRevalidateTag(...args),
}))

const mockLoggerFns = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}
vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => mockLoggerFns),
}))

const SECRET = 'correct-horse-battery-staple'
const WEBHOOK_URL = 'http://localhost:3000/api/revalidate/contentful'

function makeRequest({
  headers = {},
  body = JSON.stringify({ sys: { contentType: { sys: { id: 'blogPost' } } } }),
  url = WEBHOOK_URL,
}: {
  headers?: Record<string, string>
  body?: string
  url?: string
} = {}): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body,
  })
}

describe('POST /api/revalidate/contentful', () => {
  let route: typeof import('../route')

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.stubEnv('CONTENTFUL_REVALIDATE_SECRET', SECRET)
    route = await import('../route')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // ---------------------------------------------------------------------------
  // Authentication
  // ---------------------------------------------------------------------------

  it('should revalidate when x-webhook-secret header matches', async () => {
    const response = await route.POST(makeRequest({ headers: { 'x-webhook-secret': SECRET } }))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data.revalidated).toBe(true)
    expect(mockRevalidateTag).toHaveBeenCalledWith('blog-posts', 'max')
  })

  it('should accept Authorization: Bearer <secret>', async () => {
    const response = await route.POST(makeRequest({ headers: { authorization: `Bearer ${SECRET}` } }))
    expect(response.status).toBe(200)
  })

  it('should reject a secret passed in the query string', async () => {
    const response = await route.POST(makeRequest({ url: `${WEBHOOK_URL}?secret=${SECRET}` }))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.status).toBe('error')
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('should return 401 when no secret header is sent', async () => {
    const response = await route.POST(makeRequest())
    expect(response.status).toBe(401)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it.each([
    ['wrong value of same length', SECRET.replace(/.$/, 'X')],
    ['shorter value', SECRET.slice(0, 5)],
    ['longer value', `${SECRET}-extra`],
  ])('should return 401 for a %s', async (_label, secret) => {
    const response = await route.POST(makeRequest({ headers: { 'x-webhook-secret': secret } }))
    expect(response.status).toBe(401)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('should return 401 for a non-Bearer Authorization scheme', async () => {
    const response = await route.POST(makeRequest({ headers: { authorization: `Basic ${SECRET}` } }))
    expect(response.status).toBe(401)
  })

  it('should compare secrets with crypto.timingSafeEqual', async () => {
    vi.resetModules()
    const timingSafeEqualSpy = vi.fn((a: Uint8Array, b: Uint8Array) => Buffer.compare(a, b) === 0)
    vi.doMock('node:crypto', async (importOriginal) => {
      const actual = await importOriginal<typeof import('node:crypto')>()
      return { ...actual, timingSafeEqual: timingSafeEqualSpy }
    })
    const freshRoute = await import('../route')

    await freshRoute.POST(makeRequest({ headers: { 'x-webhook-secret': 'short' } }))

    expect(timingSafeEqualSpy).toHaveBeenCalledTimes(1)
    const [a, b] = timingSafeEqualSpy.mock.calls[0]
    // Hashed first, so mismatched lengths never throw and both buffers are equal-length digests
    expect(a.byteLength).toBe(32)
    expect(b.byteLength).toBe(32)
    vi.doUnmock('node:crypto')
  })

  // ---------------------------------------------------------------------------
  // Fail closed
  // ---------------------------------------------------------------------------

  it.each([
    ['unset', undefined],
    ['empty', ''],
    ['whitespace', '   '],
  ])('should fail closed with 500 when the env secret is %s', async (_label, value) => {
    vi.stubEnv('CONTENTFUL_REVALIDATE_SECRET', value)

    const response = await route.POST(makeRequest({ headers: { 'x-webhook-secret': value ?? '' } }))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error_message).not.toMatch(/CONTENTFUL|secret/i)
    expect(mockRevalidateTag).not.toHaveBeenCalled()
    expect(mockLoggerFns.error).toHaveBeenCalledWith('CONTENTFUL_REVALIDATE_SECRET not configured')
  })

  // ---------------------------------------------------------------------------
  // Payload handling + error responses
  // ---------------------------------------------------------------------------

  it('should revalidate tool-configs immediately for toolConfiguration entries', async () => {
    const response = await route.POST(
      makeRequest({
        headers: { 'x-webhook-secret': SECRET },
        body: JSON.stringify({ sys: { contentType: { sys: { id: 'toolConfiguration' } } } }),
      })
    )

    expect(response.status).toBe(200)
    expect(mockRevalidateTag).toHaveBeenCalledTimes(1)
    expect(mockRevalidateTag).toHaveBeenCalledWith('tool-configs', { expire: 0 })
  })

  it('should expire the site banner immediately so the next page load shows the change', async () => {
    const response = await route.POST(
      makeRequest({
        headers: { 'x-webhook-secret': SECRET },
        body: JSON.stringify({ sys: { contentType: { sys: { id: 'siteBanner' } } } }),
      })
    )

    expect(response.status).toBe(200)
    expect(mockRevalidateTag).toHaveBeenCalledTimes(1)
    expect(mockRevalidateTag).toHaveBeenCalledWith('site-banner', { expire: 0 })
  })

  it('should revalidate all tags for unknown content types', async () => {
    const response = await route.POST(makeRequest({ headers: { 'x-webhook-secret': SECRET }, body: JSON.stringify({}) }))

    expect(response.status).toBe(200)
    expect(mockRevalidateTag).toHaveBeenCalledTimes(3)
  })

  it('should return 400 for malformed JSON after authenticating', async () => {
    const response = await route.POST(makeRequest({ headers: { 'x-webhook-secret': SECRET }, body: '{not json' }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error_message).toBe('Request body must be valid JSON')
    expect(mockRevalidateTag).not.toHaveBeenCalled()
  })

  it('should not echo raw error messages on unexpected failures', async () => {
    mockRevalidateTag.mockImplementationOnce(() => {
      throw new Error('internal cache failure at /var/task/.next/cache with token abc')
    })

    const response = await route.POST(makeRequest({ headers: { 'x-webhook-secret': SECRET } }))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error_message).toBe('An unexpected error occurred')
    expect(JSON.stringify(json)).not.toContain('internal cache failure')
    expect(mockLoggerFns.error).toHaveBeenCalledWith('Webhook processing failed', expect.any(Error))
  })

  // ---------------------------------------------------------------------------
  // Methods
  // ---------------------------------------------------------------------------

  it('should not export a GET handler (Next.js responds 405 Method Not Allowed)', () => {
    expect('GET' in route).toBe(false)
    expect(Object.keys(route)).toEqual(['POST'])
  })
})
