import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import sitemap from '../sitemap'

const getBlogPosts = vi.hoisted(() => vi.fn())
vi.mock('@/lib/contentful/client', () => ({ getBlogPosts }))

const ORIGIN = 'https://www.cloakforge.app'

describe('sitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should list every entry on the canonical www origin', async () => {
    getBlogPosts.mockResolvedValue([{ slug: 'hello-world', publishedAt: '2026-01-15T00:00:00.000Z' }])

    const entries = await sitemap()
    const urls = entries.map((entry) => entry.url)

    expect(urls[0]).toBe(ORIGIN)
    expect(urls).toContain(`${ORIGIN}/tools/burn-tokens`)
    expect(urls).toContain(`${ORIGIN}/blog/hello-world`)
    for (const url of urls) {
      expect(url.startsWith(ORIGIN)).toBe(true)
    }
    expect(entries.at(-1)).toMatchObject({ lastModified: new Date('2026-01-15T00:00:00.000Z'), priority: 0.6 })
  })

  it('should still return the static routes when the CMS is unavailable', async () => {
    getBlogPosts.mockRejectedValue(new Error('Contentful down'))

    const entries = await sitemap()

    expect(entries.length).toBeGreaterThan(0)
    expect(entries.some((entry) => entry.url.includes('/blog/'))).toBe(false)
  })
})
