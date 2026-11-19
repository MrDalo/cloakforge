'use client'

import { FAQSection as CommonFAQSection } from '@/components/common'
import { faqData } from '../tokenAuditorData'
import { useLivePricingFaqs } from '@/hooks/useLivePricingFaqs'

export const FAQSection = (): React.ReactNode => (
  <section className='from-muted/20 to-background bg-gradient-to-br py-16'>
    <CommonFAQSection
      faqs={useLivePricingFaqs(faqData)}
      subtitle='Everything you need to know about token auditing'
      title='Frequently Asked Questions'
    />
  </section>
)
