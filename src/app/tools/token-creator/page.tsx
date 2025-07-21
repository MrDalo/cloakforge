import { HeroSection, TokenCreationForm, FAQSection, BenefitsSection } from '@/components/pages/TokenCreatorPage'

const TokenCreatorPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <TokenCreationForm />
    <BenefitsSection />
    <FAQSection />
  </div>
)

export default TokenCreatorPage
