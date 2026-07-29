'use client'

import { FAQSection, HeroSection, RevokeFreezeAuthorityForm } from '@/components/pages/RevokeFreezeAuthorityPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { RelatedTools } from '@/components/common/RelatedTools'
import { revokeFreezeAuthorityBenefitsConfig } from '@/components/pages/RevokeFreezeAuthorityPage/BenefitsSection/benefitsConfig'

const RevokeFreezeAuthorityPage = (): React.ReactNode => (
  <div className='min-h-screen'>
    {/* Hero Section */}
    <HeroSection />

    <RevokeFreezeAuthorityForm />

    {/* Benefits Section */}
    <BenefitsSection config={revokeFreezeAuthorityBenefitsConfig} />

    {/* FAQ Section */}
    <FAQSection />

    {/* Related Tools */}
    <RelatedTools toolId='revoke-freeze' />
  </div>
)

export default RevokeFreezeAuthorityPage
