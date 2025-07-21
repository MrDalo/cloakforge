import { CTASection } from '@/components/pages/HomePage/CTASection'
import { HeroSection } from '@/components/pages/HomePage/HeroSection'
import { PlatformFeatures } from '@/components/pages/HomePage/PlatformFeaturesSection'
import { PricingSection } from '@/components/pages/HomePage/PricingSection'
import { SecurityPrivacySection } from '@/components/pages/HomePage/SecurityPrivacySection'
import { ServiceShowcase } from '@/components/common/ServiceShowcaseSection'
import { WhyCryptoForgeSection } from '@/components/pages/HomePage/WhyCryptoForgeSection'

const Home = (): React.ReactNode => (
  <div className='relative'>
    {/* Hero Section */}
    <HeroSection />

    {/* Service Showcase */}
    <ServiceShowcase />

    {/* Security & Privacy Section */}
    <SecurityPrivacySection />

    {/* Why Privacy Matters - Balanced Section */}
    <WhyCryptoForgeSection />

    {/* Platform Features */}
    <PlatformFeatures />

    {/* Pricing Section */}
    <PricingSection />

    {/* CTA and Footer */}
    <CTASection />
  </div>
)

export default Home
