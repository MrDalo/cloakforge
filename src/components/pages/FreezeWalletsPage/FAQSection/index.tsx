import { FAQSection } from '@/components/common'
import { faqs } from '../freezeWalletsData'

const FreezeWalletsFAQSection = (): React.ReactNode => (
  <FAQSection
    faqs={faqs}
    subtitle='Learn more about wallet freezing and how it protects your token ecosystem'
    title='Frequently Asked Questions'
  />
)

export default FreezeWalletsFAQSection
