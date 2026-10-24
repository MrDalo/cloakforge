import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

const { isBannerShownOnPage } = await import('../AnnouncementBanner')

describe('isBannerShownOnPage', () => {
  it('should show an "all" banner on every page', () => {
    expect(isBannerShownOnPage(['all'], '/')).toBe(true)
    expect(isBannerShownOnPage(['all'], '/tools/token-creator')).toBe(true)
  })

  it('should match a path prefix and its sub-pages', () => {
    expect(isBannerShownOnPage(['/tools'], '/tools')).toBe(true)
    expect(isBannerShownOnPage(['/tools'], '/tools/burn-tokens')).toBe(true)
    expect(isBannerShownOnPage(['/tools/'], '/tools/burn-tokens')).toBe(true)
  })

  it('should not match a different page sharing the prefix text', () => {
    expect(isBannerShownOnPage(['/tools'], '/toolsets')).toBe(false)
    expect(isBannerShownOnPage(['/blog'], '/tools/burn-tokens')).toBe(false)
  })

  it('should treat "/" as the home page only', () => {
    expect(isBannerShownOnPage(['/'], '/')).toBe(true)
    expect(isBannerShownOnPage(['/'], '/tools')).toBe(false)
  })
})
