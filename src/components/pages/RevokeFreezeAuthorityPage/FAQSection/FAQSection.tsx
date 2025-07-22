import { FAQSection as CommonFAQSection } from '@/components/common'
import { revokeFreezeAuthorityFAQs } from './faqData'

export const FAQSection = (): React.ReactNode => (
  <CommonFAQSection
    faqs={revokeFreezeAuthorityFAQs}
    subtitle='Everything you need to know about revoking freeze authority on Solana tokens'
    title='Have Questions About Revoking Freeze Authority?'
  />
)
