import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { isLocalhost, validateOrigin, validateSecurity } from '../originValidator'
import { AppError } from '@/lib/errors'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock getServerConfig
vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({
    vercelPublicUrl: 'https://cloakforge.vercel.app',
    appUrl: 'https://cloakforge.io',
  })),
}))

// Mock logger
vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(headers: Record<string, string>, url = 'http://localhost:3000/api/test'): NextRequest {
  return new NextRequest(url, { headers })
}

// ---------------------------------------------------------------------------
// isLocalhost
// ---------------------------------------------------------------------------

describe('isLocalhost', () => {
  it('should returns true when origin is localhost', () => {
    const req = makeRequest({ origin: 'http://localhost:3000' })
    expect(isLocalhost(req)).toBe(true)
  })

  it('should returns true when origin contains 127.0.0.1', () => {
    const req = makeRequest({ origin: 'http://127.0.0.1:3000' })
    expect(isLocalhost(req)).toBe(true)
  })

  it('should returns true when host header is localhost', () => {
    const req = makeRequest({ host: 'localhost:3000' })
    expect(isLocalhost(req)).toBe(true)
  })

  it('should returns true when host header is 127.0.0.1', () => {
    const req = makeRequest({ host: '127.0.0.1:8080' })
    expect(isLocalhost(req)).toBe(true)
  })

  it('should returns false for a production origin', () => {
    const req = makeRequest({ origin: 'https://cloakforge.io' })
    expect(isLocalhost(req)).toBe(false)
  })

  it('should returns false when no origin or host header', () => {
    const req = makeRequest({})
    expect(isLocalhost(req)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// validateOrigin
// ---------------------------------------------------------------------------

describe('validateOrigin', () => {
  it('should passes when no origin or referer headers are present', async () => {
    const req = makeRequest({})
    await expect(validateOrigin(req)).resolves.toBeUndefined()
  })

  it('should passes when origin matches configured appUrl', async () => {
    const req = makeRequest({ origin: 'https://cloakforge.io' })
    await expect(validateOrigin(req)).resolves.toBeUndefined()
  })

  it('should passes when origin matches vercelPublicUrl', async () => {
    const req = makeRequest({ origin: 'https://cloakforge.vercel.app' })
    await expect(validateOrigin(req)).resolves.toBeUndefined()
  })

  it('should passes when origin matches an additional allowed origin', async () => {
    const req = makeRequest({ origin: 'https://custom-allowed.com' })
    await expect(validateOrigin(req, ['https://custom-allowed.com'])).resolves.toBeUndefined()
  })

  it('should throws AppError FORBIDDEN when origin is not allowed', async () => {
    const req = makeRequest({ origin: 'https://malicious.com' })
    await expect(validateOrigin(req)).rejects.toThrow(AppError)
    await expect(validateOrigin(req)).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 })
  })

  it('should passes when referer starts with a valid origin', async () => {
    const req = makeRequest({ referer: 'https://cloakforge.io/some-page' })
    await expect(validateOrigin(req)).resolves.toBeUndefined()
  })

  it('should throws AppError FORBIDDEN when referer does not match any allowed origin', async () => {
    const req = makeRequest({ referer: 'https://attacker.com/page' })
    await expect(validateOrigin(req)).rejects.toThrow(AppError)
  })

  it('should prefers origin over referer for validation', async () => {
    // Valid origin + invalid referer → should pass (origin wins)
    const req = makeRequest({
      origin: 'https://cloakforge.io',
      referer: 'https://attacker.com/page',
    })
    await expect(validateOrigin(req)).resolves.toBeUndefined()
  })

  it('should throws FORBIDDEN when origin is invalid even if referer is valid', async () => {
    const req = makeRequest({
      origin: 'https://attacker.com',
      referer: 'https://cloakforge.io/page',
    })
    await expect(validateOrigin(req)).rejects.toThrow(AppError)
  })
})

// ---------------------------------------------------------------------------
// validateSecurity
// ---------------------------------------------------------------------------

describe('validateSecurity', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('should skips validation for localhost in development when skipForLocalhost is true', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const req = makeRequest({ origin: 'http://localhost:3000' })
    // Should not throw even if origin would otherwise be blocked
    await expect(validateSecurity(req, { skipForLocalhost: true })).resolves.toBeUndefined()
  })

  it('should validates origin for non-localhost requests', async () => {
    const req = makeRequest({ origin: 'https://malicious.com' })
    await expect(validateSecurity(req)).rejects.toThrow(AppError)
  })

  it('should passes for valid origin', async () => {
    const req = makeRequest({ origin: 'https://cloakforge.io' })
    await expect(validateSecurity(req)).resolves.toBeUndefined()
  })

  it('should uses skipForLocalhost=true by default', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const req = makeRequest({ origin: 'http://localhost:3000' })
    await expect(validateSecurity(req)).resolves.toBeUndefined()
  })

  it('should validates localhost when skipForLocalhost is false', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const req = makeRequest({ origin: 'http://localhost:3000' })
    // localhost is not in the allowed list → should throw
    await expect(validateSecurity(req, { skipForLocalhost: false })).rejects.toThrow(AppError)
  })
})
