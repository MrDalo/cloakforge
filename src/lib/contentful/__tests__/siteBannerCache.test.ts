/**
 * Unit tests for src/lib/contentful/siteBannerCache.ts
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

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}))

const mockGetSiteBanner = vi.hoisted(() => vi.fn())

vi.mock('@/lib/contentful/client', () => ({
  getSiteBanner: mockGetSiteBanner,
}))

import { getCachedSiteBanner } from '../siteBannerCache'
import type { SiteBanner } from '../client'

const SAMPLE_BANNER: SiteBanner = {
  isActive: true,
  type: 'warning',
  title: 'Maintenance Window',
  message: 'We will be down from 2-4am UTC.',
  showOnPages: ['all'],
}

describe('getCachedSiteBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should returns the site banner from getSiteBanner', async () => {
    mockGetSiteBanner.mockResolvedValue(SAMPLE_BANNER)
    const result = await getCachedSiteBanner()
    expect(result).toEqual(SAMPLE_BANNER)
  })

  it('should calls getSiteBanner', async () => {
    mockGetSiteBanner.mockResolvedValue(null)
    await getCachedSiteBanner()
    expect(mockGetSiteBanner).toHaveBeenCalledOnce()
  })

  it('should returns null when no banner is active', async () => {
    mockGetSiteBanner.mockResolvedValue(null)
    const result = await getCachedSiteBanner()
    expect(result).toBeNull()
  })

  it('should returns null when getSiteBanner throws', async () => {
    mockGetSiteBanner.mockRejectedValue(new Error('Contentful unavailable'))
    const result = await getCachedSiteBanner()
    expect(result).toBeNull()
  })

  it('returns banner with type "info"', async () => {
    const infoBanner: SiteBanner = { ...SAMPLE_BANNER, type: 'info', title: 'Info' }
    mockGetSiteBanner.mockResolvedValue(infoBanner)
    const result = await getCachedSiteBanner()
    expect(result?.type).toBe('info')
  })

  it('returns banner with type "maintenance"', async () => {
    const maintenanceBanner: SiteBanner = { ...SAMPLE_BANNER, type: 'maintenance' }
    mockGetSiteBanner.mockResolvedValue(maintenanceBanner)
    const result = await getCachedSiteBanner()
    expect(result?.type).toBe('maintenance')
  })

  it('should preserves all banner fields', async () => {
    mockGetSiteBanner.mockResolvedValue(SAMPLE_BANNER)
    const result = await getCachedSiteBanner()
    expect(result?.isActive).toBe(true)
    expect(result?.title).toBe('Maintenance Window')
    expect(result?.message).toBe('We will be down from 2-4am UTC.')
    expect(result?.showOnPages).toEqual(['all'])
  })
})
