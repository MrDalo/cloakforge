import { describe, it, expect, afterEach, vi } from 'vitest'
import { DEFAULT_SITE_URL, getSiteUrl, normalizeSiteUrl, toSiteUrl } from '../siteUrl'

describe('normalizeSiteUrl', () => {
  it.each([
    ['https://www.cloakforge.app', 'https://www.cloakforge.app'],
    ['https://www.cloakforge.app/', 'https://www.cloakforge.app'],
    ['  https://staging.cloakforge.app  ', 'https://staging.cloakforge.app'],
    ['https://example.com:8443', 'https://example.com:8443'],
    ['http://localhost:3001', 'http://localhost:3001'],
    ['http://127.0.0.1:3000/', 'http://127.0.0.1:3000'],
  ])('should normalize %s to its origin', (value, expected) => {
    expect(normalizeSiteUrl(value)).toBe(expected)
  })

  it.each([
    undefined,
    '',
    '   ',
    'not a url',
    'www.cloakforge.app',
    'http://www.cloakforge.app',
    'ftp://www.cloakforge.app',
    'https://www.cloakforge.app/blog',
    'https://www.cloakforge.app/?ref=x',
    'https://www.cloakforge.app/#top',
    'https://user:pass@www.cloakforge.app',
  ])('should reject %s', (value) => {
    expect(normalizeSiteUrl(value)).toBeNull()
  })
})

describe('getSiteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should default to the canonical www origin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined)

    expect(DEFAULT_SITE_URL).toBe('https://www.cloakforge.app')
    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL)
  })

  it('should use a valid NEXT_PUBLIC_SITE_URL override', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://preview.cloakforge.app/')

    expect(getSiteUrl()).toBe('https://preview.cloakforge.app')
  })

  it('should fall back to the default for a malformed override', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://www.cloakforge.app/some/path')

    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL)
  })
})

describe('toSiteUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should build absolute URLs on the canonical origin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined)

    expect(toSiteUrl('')).toBe('https://www.cloakforge.app')
    expect(toSiteUrl('/blog/hello-world')).toBe('https://www.cloakforge.app/blog/hello-world')
  })
})
