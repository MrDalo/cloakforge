'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { updateMetadataFAQs } from './faqData'
import { useLivePricingFaqs } from '@/hooks/useLivePricingFaqs'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={useLivePricingFaqs(updateMetadataFAQs)}
    subtitle='Get answers to common questions about updating your Token-2022 metadata.'
    title='Frequently Asked Questions'
  />
)
