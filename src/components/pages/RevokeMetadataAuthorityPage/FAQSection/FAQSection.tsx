'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { revokeMetadataAuthorityFAQs } from './faqData'
import { useLivePricingFaqs } from '@/hooks/useLivePricingFaqs'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={useLivePricingFaqs(revokeMetadataAuthorityFAQs)}
    subtitle='Everything you need to know about revoking metadata authority'
    title='Frequently Asked Questions'
  />
)
