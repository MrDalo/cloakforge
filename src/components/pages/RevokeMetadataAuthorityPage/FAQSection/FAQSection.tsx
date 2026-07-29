'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { revokeMetadataAuthorityFAQs } from './faqData'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={revokeMetadataAuthorityFAQs}
    subtitle='Everything you need to know about revoking metadata authority'
    title='Frequently Asked Questions'
  />
)
