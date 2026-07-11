'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { liquidityProviderFAQ } from './faqData'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={liquidityProviderFAQ}
    subtitle='Everything you need to know about creating liquidity pools on Raydium.'
    title='Frequently Asked Questions'
  />
)
