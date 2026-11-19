'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { faqs } from '../multisenderData'
import { useLivePricingFaqs } from '@/hooks/useLivePricingFaqs'

const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={useLivePricingFaqs(faqs)}
    subtitle='Learn more about batch token transfers and how to efficiently distribute tokens'
    title='Frequently Asked Questions'
  />
)

export default FAQSection
