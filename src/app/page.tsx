import { CTASection } from '@/components/pages/HomePage/CTASection'
import { HeroSection } from '@/components/pages/HomePage/HeroSection'
import { PlatformFeatures } from '@/components/pages/HomePage/PlatformFeaturesSection'
import { SecurityPrivacySection } from '@/components/pages/HomePage/SecurityPrivacySection'
import { ServiceShowcase } from '@/components/common/ServiceShowcaseSection'
import { BenefitsSection } from '@/components/pages/HomePage/BenefitsSection'
import { PricingSection } from '@/components/pages/HomePage/PricingSection'
import type { Metadata } from 'next'

/** The homepage's own canonical (the root layout deliberately sets none). Resolved against metadataBase. */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const Home = (): React.ReactNode => (
  <div className='relative'>
    {/* Hero Section */}
    <HeroSection />

    {/* Service Showcase */}
    <ServiceShowcase />

    {/* Security & Privacy Section */}
    <SecurityPrivacySection />

    {/* Why Privacy Matters - Balanced Section */}
    <BenefitsSection />

    {/* Platform Features */}
    <PlatformFeatures />

    {/* Pricing Section */}
    <PricingSection />

    {/* CTA and Footer */}
    <CTASection />
  </div>
)

export default Home
