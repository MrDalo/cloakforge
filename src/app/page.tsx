'use client'

import { CTAAndFooter } from '@/components/pages/HomePage/CTAAndFooterSection'
import { HeroSection } from '@/components/pages/HomePage/HeroSection'
import { PlatformFeatures } from '@/components/pages/HomePage/PlatformFeaturesSection'
import { PricingSection } from '@/components/pages/HomePage/PricingSection'
import { SecurityPrivacySection } from '@/components/pages/HomePage/SecurityPrivacySection'
import { ServiceShowcase } from '@/components/pages/HomePage/ServiceShowcaseSection'
import { WhyAnonymousSection } from '@/components/pages/HomePage/WhyAnonymousSection'

const Home = (): React.ReactNode => (
	<div className='relative'>
		{/* Hero Section */}
		<HeroSection />

		{/* Service Showcase */}
		<ServiceShowcase />

		{/* Security & Privacy Section */}
		<SecurityPrivacySection />

		{/* Why Privacy Matters - Balanced Section */}
		<WhyAnonymousSection />

		{/* Platform Features */}
		<PlatformFeatures />

		{/* Pricing Section */}
		<PricingSection />

		{/* Testimonials */}
		{/* <TestimonialsSection /> */}

		{/* CTA and Footer */}
		<CTAAndFooter />
	</div>
)

export default Home
