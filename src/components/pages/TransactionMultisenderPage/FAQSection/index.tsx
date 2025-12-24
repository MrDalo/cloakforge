'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { faqs } from '../multisenderData'

const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={faqs}
    subtitle='Learn more about batch token transfers and how to efficiently distribute tokens'
    title='Frequently Asked Questions'
  />
)

export default FAQSection
