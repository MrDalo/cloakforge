import { describe, it, expect, afterEach, vi } from 'vitest'
import robots from '../robots'

describe('robots', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should point crawlers at the sitemap on the canonical www origin', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined)

    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
      sitemap: 'https://www.cloakforge.app/sitemap.xml',
    })
  })

  it('should follow the NEXT_PUBLIC_SITE_URL override', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://staging.cloakforge.app')

    expect(robots().sitemap).toBe('https://staging.cloakforge.app/sitemap.xml')
  })
})
