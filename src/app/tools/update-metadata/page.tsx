'use client'

import { HeroSection, UpdateMetadataFormWrapper, FAQSection } from '@/components/pages/UpdateMetadataPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { RelatedTools } from '@/components/common/RelatedTools'
import { updateMetadataBenefitsConfig } from '@/components/pages/UpdateMetadataPage/BenefitsSection/benefitsConfig'

const UpdateMetadataPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <UpdateMetadataFormWrapper />
    <BenefitsSection config={updateMetadataBenefitsConfig} />
    <FAQSection />
    <RelatedTools toolId='update-metadata' />
  </div>
)

export default UpdateMetadataPage
