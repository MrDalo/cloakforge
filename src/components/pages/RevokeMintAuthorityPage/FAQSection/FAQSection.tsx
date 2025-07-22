'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { revokeMintAuthorityFAQs } from './faqData'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={revokeMintAuthorityFAQs}
    subtitle='Everything you need to know about revoking mint authority'
    title='Frequently Asked Questions'
  />
)
