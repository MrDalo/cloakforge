'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { burnTokensFAQs } from './faqData'
import { useLivePricingFaqs } from '@/hooks/useLivePricingFaqs'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={useLivePricingFaqs(burnTokensFAQs)}
    subtitle='Get answers to common questions about token burning and our platform.'
    title='Frequently Asked Questions'
  />
)
