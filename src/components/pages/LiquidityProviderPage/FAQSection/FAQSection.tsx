'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { liquidityProviderFAQ } from './faqData'
import { useLivePricingFaqs } from '@/hooks/useLivePricingFaqs'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={useLivePricingFaqs(liquidityProviderFAQ)}
    subtitle='Everything you need to know about creating liquidity pools on Raydium.'
    title='Frequently Asked Questions'
  />
)
