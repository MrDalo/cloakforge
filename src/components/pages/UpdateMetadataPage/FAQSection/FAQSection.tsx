'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { updateMetadataFAQs } from './faqData'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={updateMetadataFAQs}
    subtitle='Get answers to common questions about updating your Token-2022 metadata.'
    title='Frequently Asked Questions'
  />
)
