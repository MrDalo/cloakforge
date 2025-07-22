'use client'

import { HeroSection } from './HeroSection'
import { RevokeFreezeAuthorityForm } from './RevokeFreezeAuthorityForm'
import { BenefitsSection } from './BenefitsSection'
import { FAQSection } from './FAQSection'

export const RevokeFreezeAuthorityPage = (): React.ReactNode => (
  <div className='min-h-screen'>
    {/* Hero Section */}
    <HeroSection />

    {/* Revoke Freeze Authority Form */}
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <RevokeFreezeAuthorityForm />
      </div>
    </section>

    {/* Benefits Section */}
    <BenefitsSection />

    {/* FAQ Section */}
    <FAQSection />
  </div>
)
