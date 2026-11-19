'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { revokeMintAuthorityFAQs } from './faqData'
import { useLivePricingFaqs } from '@/hooks/useLivePricingFaqs'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={useLivePricingFaqs(revokeMintAuthorityFAQs)}
    subtitle='Everything you need to know about revoking mint authority'
    title='Frequently Asked Questions'
  />
)
