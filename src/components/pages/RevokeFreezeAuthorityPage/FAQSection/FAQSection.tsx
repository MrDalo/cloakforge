'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { revokeFreezeAuthorityFAQs } from './faqData'
import { useLivePricingFaqs } from '@/hooks/useLivePricingFaqs'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={useLivePricingFaqs(revokeFreezeAuthorityFAQs)}
    subtitle='Everything you need to know about revoking freeze authority on Solana tokens'
    title='Have Questions About Revoking Freeze Authority?'
  />
)
