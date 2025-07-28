import { FAQSection } from '@/components/common'
import { faqs } from '../freezeAccountsData'

const FreezeAccountsFAQSection = (): React.ReactNode => (
  <FAQSection
    faqs={faqs}
    subtitle='Learn more about account freezing and how it protects your token ecosystem'
    title='Frequently Asked Questions'
  />
)

export default FreezeAccountsFAQSection
