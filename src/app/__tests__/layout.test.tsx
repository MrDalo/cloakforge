import { describe, it, expect, vi } from 'vitest'
import { metadata } from '../layout'
import { metadata as homeMetadata } from '../page'

// Metadata only: stub the font loader and every rendered component (wallet providers etc.).
vi.mock('next/font/google', () => ({ DM_Sans: () => ({ variable: '--font-dm-sans' }) }))
vi.mock('@/providers/AppProvider', () => ({ default: () => null }))
vi.mock('@/components/ui/sonner', () => ({ default: () => null }))
vi.mock('@/components/common/GlobalHeader', () => ({ GlobalHeader: () => null }))
vi.mock('@/components/common/GlobalFooter', () => ({ GlobalFooter: () => null }))
vi.mock('@/components/common/DonationSection', () => ({ DonationSection: () => null }))
vi.mock('@/components/common/AnnouncementBanner', () => ({ AnnouncementBanner: () => null }))
vi.mock('@/components/common/JsonLd', () => ({ JsonLd: () => null }))
vi.mock('@/components/common/ServiceShowcaseSection', () => ({ ServiceShowcase: () => null }))
vi.mock('@/components/pages/HomePage/CTASection', () => ({ CTASection: () => null }))
vi.mock('@/components/pages/HomePage/HeroSection', () => ({ HeroSection: () => null }))
vi.mock('@/components/pages/HomePage/PlatformFeaturesSection', () => ({ PlatformFeatures: () => null }))
vi.mock('@/components/pages/HomePage/SecurityPrivacySection', () => ({ SecurityPrivacySection: () => null }))
vi.mock('@/components/pages/HomePage/BenefitsSection', () => ({ BenefitsSection: () => null }))
vi.mock('@/components/pages/HomePage/PricingSection', () => ({ PricingSection: () => null }))

describe('root layout metadata', () => {
  it('should resolve relative metadata URLs against the canonical www origin', () => {
    expect(metadata.metadataBase?.toString()).toBe('https://www.cloakforge.app/')
  })

  it('should not set a root canonical or og:url that every page would inherit', () => {
    expect(metadata.alternates).toBeUndefined()
    expect(metadata.openGraph).not.toHaveProperty('url')
  })

  it('should give the homepage its own canonical', () => {
    expect(homeMetadata.alternates?.canonical).toBe('/')
  })
})
