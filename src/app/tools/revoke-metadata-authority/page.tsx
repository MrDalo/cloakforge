'use client'

import { BenefitsSection } from '@/components/common/BenefitsSection'
import { RelatedTools } from '@/components/common/RelatedTools'
import { HeroSection } from '@/components/pages/RevokeMetadataAuthorityPage/HeroSection'
import { benefitsConfig } from '@/components/pages/RevokeMetadataAuthorityPage/BenefitsSection/benefitsConfig'
import { RevokeMetadataAuthorityForm } from '@/components/pages/RevokeMetadataAuthorityPage/RevokeMetadataAuthorityForm'
import { FAQSection } from '@/components/pages/RevokeMetadataAuthorityPage/FAQSection'

const RevokeMetadataAuthorityPage = (): React.ReactNode => (
  <div className='min-h-screen'>
    {/* Hero Section */}
    <HeroSection />

    {/* Revoke Metadata Authority Form */}
    <RevokeMetadataAuthorityForm />

    {/* Benefits Section */}
    <BenefitsSection config={benefitsConfig} />

    {/* FAQ Section */}
    <FAQSection />

    {/* Related Tools */}
    <RelatedTools toolId='revoke-metadata-authority' />
  </div>
)

export default RevokeMetadataAuthorityPage
