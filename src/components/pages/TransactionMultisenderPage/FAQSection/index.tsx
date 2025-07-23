'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { faqs } from '../multisenderData'

export const FAQSection = (): React.ReactNode => <CommonFAQSection faqs={faqs} />
