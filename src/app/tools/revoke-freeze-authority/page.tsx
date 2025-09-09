'use client'

import { FAQSection, HeroSection, RevokeFreezeAuthorityForm } from '@/components/pages/RevokeFreezeAuthorityPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { revokeFreezeAuthorityBenefitsConfig } from '@/components/pages/RevokeFreezeAuthorityPage/BenefitsSection/benefitsConfig'

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
    <BenefitsSection config={revokeFreezeAuthorityBenefitsConfig} />

    {/* FAQ Section */}
    <FAQSection />
  </div>
)

export default RevokeFreezeAuthorityPage
