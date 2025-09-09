import { HeroSection, MultisenderForm, FAQSection } from '@/components/pages/TransactionMultisenderPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { multisenderBenefitsConfig } from '@/components/pages/TransactionMultisenderPage/BenefitsSection/benefitsConfig'

const TransactionMultisenderPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <MultisenderForm />
    <BenefitsSection config={multisenderBenefitsConfig} />
    <FAQSection />
  </div>
)

export default TransactionMultisenderPage
