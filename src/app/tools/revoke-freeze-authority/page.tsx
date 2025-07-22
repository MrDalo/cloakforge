'use client'

import { BenefitsSection, FAQSection, HeroSection, RevokeFreezeAuthorityForm } from '@/components/pages/RevokeFreezeAuthorityPage'

const RevokeFreezeAuthorityPage = (): React.ReactNode => (
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

export default RevokeFreezeAuthorityPage
