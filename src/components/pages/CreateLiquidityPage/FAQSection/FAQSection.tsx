'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { createLiquidityFAQs } from './faqData'

export const FAQSection = (): React.ReactNode => <CommonFAQSection faqs={createLiquidityFAQs} />
