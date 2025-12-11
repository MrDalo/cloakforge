'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { faqs } from '../unfreezeWalletsData'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={faqs}
    subtitle='Get answers to common questions about wallet unfreezing and our platform.'
    title='Frequently Asked Questions'
  />
)
