/**
 * Unit tests for src/lib/contentful/client.ts
 *
 * Tests:
 * - getBlogPosts: happy path, empty result, error fallback
 * - getBlogPost: found, not found, error fallback
 * - getToolConfiguration: found, not found, error fallback
 * - getAllToolConfigurations: happy path, error fallback
 * - getSiteBanner: found, not found, error fallback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({
    contentfulSpaceId: 'test-space-id',
    contentfulEnvironment: 'master',
    contentfulAccessToken: 'test-access-token',
  })),
}))

// Use vi.hoisted so mockGetEntries is available in the vi.mock factory
const mockGetEntries = vi.hoisted(() => vi.fn())

vi.mock('contentful', () => ({
  createClient: vi.fn(() => ({
    getEntries: mockGetEntries,
  })),
}))

// Import after mocks are set up
let getBlogPosts: typeof import('../client').getBlogPosts
let getBlogPost: typeof import('../client').getBlogPost
let getToolConfiguration: typeof import('../client').getToolConfiguration
let getAllToolConfigurations: typeof import('../client').getAllToolConfigurations
let getSiteBanner: typeof import('../client').getSiteBanner

// Helper to build a mock Contentful entry
function makeBlogEntry(fields: Record<string, unknown>) {
  return { fields }
}

function makeToolEntry(fields: Record<string, unknown>) {
  return { fields }
}

function makeBannerEntry(fields: Record<string, unknown>) {
  return { fields }
}

describe('contentful/client', () => {
  beforeEach(async () => {
    vi.resetModules()
    mockGetEntries.mockReset()

    // Re-import to pick up fresh module
    const mod = await import('../client')
    getBlogPosts = mod.getBlogPosts
    getBlogPost = mod.getBlogPost
    getToolConfiguration = mod.getToolConfiguration
    getAllToolConfigurations = mod.getAllToolConfigurations
    getSiteBanner = mod.getSiteBanner
  })

  // ---------------------------------------------------------------------------
  // getBlogPosts
  // ---------------------------------------------------------------------------
  describe('getBlogPosts', () => {
    it('returns mapped blog posts on success', async () => {
      mockGetEntries.mockResolvedValueOnce({
        items: [
          makeBlogEntry({
            title: 'Hello World',
            slug: 'hello-world',
            content: { nodeType: 'document', content: [] },
            excerpt: 'An intro',
            author: 'Alice',
            publishedAt: '2024-01-01',
            tags: ['solana', 'defi'],
          }),
        ],
      })

      const posts = await getBlogPosts()

      expect(posts).toHaveLength(1)
      expect(posts[0].title).toBe('Hello World')
      expect(posts[0].slug).toBe('hello-world')
      expect(posts[0].author).toBe('Alice')
      expect(posts[0].tags).toEqual(['solana', 'defi'])
    })

    it('returns empty array when no posts exist', async () => {
      mockGetEntries.mockResolvedValueOnce({ items: [] })

      const posts = await getBlogPosts()
      expect(posts).toEqual([])
    })

    it('returns empty array when getEntries throws', async () => {
      mockGetEntries.mockRejectedValueOnce(new Error('Contentful unavailable'))

      const posts = await getBlogPosts()
      expect(posts).toEqual([])
    })

    it('handles missing fields gracefully', async () => {
      mockGetEntries.mockResolvedValueOnce({
        items: [makeBlogEntry({})],
      })

      const posts = await getBlogPosts()
      expect(posts[0].title).toBe('')
      expect(posts[0].slug).toBe('')
      expect(posts[0].tags).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // getBlogPost
  // ---------------------------------------------------------------------------
  describe('getBlogPost', () => {
    it('returns a blog post when found', async () => {
      mockGetEntries.mockResolvedValueOnce({
        items: [
          makeBlogEntry({
            title: 'Specific Post',
            slug: 'specific-post',
            content: {},
            excerpt: 'excerpt',
            author: 'Bob',
            publishedAt: '2024-06-15',
            tags: [],
          }),
        ],
      })

      const post = await getBlogPost('specific-post')
      expect(post).not.toBeNull()
      expect(post?.slug).toBe('specific-post')
    })

    it('returns null when no post matches slug', async () => {
      mockGetEntries.mockResolvedValueOnce({ items: [] })

      const post = await getBlogPost('nonexistent-slug')
      expect(post).toBeNull()
    })

    it('returns null when getEntries throws', async () => {
      mockGetEntries.mockRejectedValueOnce(new Error('Network error'))

      const post = await getBlogPost('any-slug')
      expect(post).toBeNull()
    })
  })

  // ---------------------------------------------------------------------------
  // getToolConfiguration
  // ---------------------------------------------------------------------------
  describe('getToolConfiguration', () => {
    it('returns tool configuration when found', async () => {
      mockGetEntries.mockResolvedValueOnce({
        items: [
          makeToolEntry({
            toolId: 'burn-tokens',
            isEnabled: true,
            baseFee: 0.1,
            networkFee: 0.01,
            priorityFee: 0.005,
          }),
        ],
      })

      const config = await getToolConfiguration('burn-tokens')
      expect(config).not.toBeNull()
      expect(config?.toolId).toBe('burn-tokens')
      expect(config?.isEnabled).toBe(true)
      expect(config?.baseFee).toBe(0.1)
      expect(config?.networkFee).toBe(0.01)
      expect(config?.priorityFee).toBe(0.005)
    })

    it('returns null when tool not found', async () => {
      mockGetEntries.mockResolvedValueOnce({ items: [] })

      const config = await getToolConfiguration('unknown-tool')
      expect(config).toBeNull()
    })

    it('returns null when getEntries throws', async () => {
      mockGetEntries.mockRejectedValueOnce(new Error('API error'))

      const config = await getToolConfiguration('burn-tokens')
      expect(config).toBeNull()
    })

    it('uses default values when fields are missing', async () => {
      mockGetEntries.mockResolvedValueOnce({
        items: [makeToolEntry({ toolId: 'token-creator' })],
      })

      const config = await getToolConfiguration('token-creator')
      expect(config?.baseFee).toBe(0.1) // default
      expect(config?.networkFee).toBe(0.01) // default
      expect(config?.disabledMessage).toBeUndefined()
      expect(config?.priorityFee).toBeUndefined()
    })

    it('includes disabledMessage when present', async () => {
      mockGetEntries.mockResolvedValueOnce({
        items: [
          makeToolEntry({
            toolId: 'freeze-accounts',
            isEnabled: false,
            disabledMessage: 'Temporarily disabled',
            baseFee: 0.05,
            networkFee: 0.002,
          }),
        ],
      })

      const config = await getToolConfiguration('freeze-accounts')
      expect(config?.disabledMessage).toBe('Temporarily disabled')
      expect(config?.isEnabled).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // getAllToolConfigurations
  // ---------------------------------------------------------------------------
  describe('getAllToolConfigurations', () => {
    it('returns all tool configurations', async () => {
      mockGetEntries.mockResolvedValueOnce({
        items: [
          makeToolEntry({ toolId: 'burn-tokens', isEnabled: true, baseFee: 0.1, networkFee: 0.01 }),
          makeToolEntry({ toolId: 'token-creator', isEnabled: false, baseFee: 0.2, networkFee: 0.01 }),
        ],
      })

      const configs = await getAllToolConfigurations()
      expect(configs).toHaveLength(2)
      expect(configs[0].toolId).toBe('burn-tokens')
      expect(configs[1].toolId).toBe('token-creator')
    })

    it('returns empty array when no configs found', async () => {
      mockGetEntries.mockResolvedValueOnce({ items: [] })

      const configs = await getAllToolConfigurations()
      expect(configs).toEqual([])
    })

    it('returns empty array when getEntries throws', async () => {
      mockGetEntries.mockRejectedValueOnce(new Error('Contentful down'))

      const configs = await getAllToolConfigurations()
      expect(configs).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // getSiteBanner
  // ---------------------------------------------------------------------------
  describe('getSiteBanner', () => {
    it('returns site banner when found', async () => {
      mockGetEntries.mockResolvedValueOnce({
        items: [
          makeBannerEntry({
            isActive: true,
            type: 'warning',
            title: 'Maintenance Tonight',
            message: 'We will be down from 2-4am UTC',
            showOnPages: ['all'],
          }),
        ],
      })

      const banner = await getSiteBanner()
      expect(banner).not.toBeNull()
      expect(banner?.isActive).toBe(true)
      expect(banner?.type).toBe('warning')
      expect(banner?.title).toBe('Maintenance Tonight')
      expect(banner?.showOnPages).toEqual(['all'])
    })

    it('returns null when no active banner found', async () => {
      mockGetEntries.mockResolvedValueOnce({ items: [] })

      const banner = await getSiteBanner()
      expect(banner).toBeNull()
    })

    it('returns null when getEntries throws', async () => {
      mockGetEntries.mockRejectedValueOnce(new Error('Fetch failed'))

      const banner = await getSiteBanner()
      expect(banner).toBeNull()
    })

    it('defaults showOnPages to ["all"] when field is missing', async () => {
      mockGetEntries.mockResolvedValueOnce({
        items: [
          makeBannerEntry({
            isActive: true,
            type: 'info',
            title: 'Info Banner',
            message: 'Hello',
          }),
        ],
      })

      const banner = await getSiteBanner()
      expect(banner?.showOnPages).toEqual(['all'])
    })

    it('returns banner with type "info"', async () => {
      mockGetEntries.mockResolvedValueOnce({
        items: [
          makeBannerEntry({
            isActive: true,
            type: 'info',
            title: 'Info',
            message: 'Info message',
            showOnPages: ['home', 'dashboard'],
          }),
        ],
      })

      const banner = await getSiteBanner()
      expect(banner?.type).toBe('info')
      expect(banner?.showOnPages).toEqual(['home', 'dashboard'])
    })

    it('returns banner with type "maintenance"', async () => {
      mockGetEntries.mockResolvedValueOnce({
        items: [
          makeBannerEntry({
            isActive: true,
            type: 'maintenance',
            title: 'Maintenance',
            message: 'Under maintenance',
            showOnPages: ['all'],
          }),
        ],
      })

      const banner = await getSiteBanner()
      expect(banner?.type).toBe('maintenance')
    })
  })
})
