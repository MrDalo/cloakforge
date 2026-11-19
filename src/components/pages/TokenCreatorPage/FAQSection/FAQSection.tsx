'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { tokenCreatorFAQs } from './faqData'
import { useLivePricingFaqs } from '@/hooks/useLivePricingFaqs'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={useLivePricingFaqs(tokenCreatorFAQs)}
    subtitle='Get answers to common questions about token creation and our platform.'
    title='Frequently Asked Questions'
  />
)
