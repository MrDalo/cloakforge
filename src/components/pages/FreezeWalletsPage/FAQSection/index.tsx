'use client'

import { FAQSection } from '@/components/common'
import { faqs } from '../freezeWalletsData'
import { useLivePricingFaqs } from '@/hooks/useLivePricingFaqs'

const FreezeWalletsFAQSection = (): React.ReactNode => (
  <FAQSection
    faqs={useLivePricingFaqs(faqs)}
    subtitle='Learn more about wallet freezing and how it protects your token ecosystem'
    title='Frequently Asked Questions'
  />
)

export default FreezeWalletsFAQSection
