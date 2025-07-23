import { HeroSection, MultisenderForm, FAQSection, BenefitsSection } from '@/components/pages/TransactionMultisenderPage'

const TransactionMultisenderPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <MultisenderForm />
    <BenefitsSection />
    <FAQSection />
  </div>
)

export default TransactionMultisenderPage
