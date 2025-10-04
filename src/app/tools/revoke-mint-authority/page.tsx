'use client'

import { BenefitsSection } from '@/components/common/BenefitsSection'
import { HeroSection } from '@/components/pages/RevokeMintAuthorityPage/HeroSection'
import { benefitsConfig } from '@/components/pages/RevokeMintAuthorityPage/BenefitsSection/benefitsConfig'
import { RevokeMintAuthorityForm } from '@/components/pages/RevokeMintAuthorityPage/RevokeMintAuthorityForm'
import { FAQSection } from '@/components/pages/RevokeMintAuthorityPage/FAQSection'

const RevokeMintAuthorityPage = (): React.ReactNode => (
  <div className='min-h-screen'>
    {/* Hero Section */}
    <HeroSection />

    {/* Revoke Mint Authority Form */}
    <RevokeMintAuthorityForm />

    {/* Benefits Section */}
    <BenefitsSection config={benefitsConfig} />

    {/* FAQ Section */}
    <FAQSection />
  </div>
)

export default RevokeMintAuthorityPage
