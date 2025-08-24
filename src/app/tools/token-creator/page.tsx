import { HeroSection, TokenCreationFormWrapper, FAQSection, BenefitsSection } from '@/components/pages/TokenCreatorPage'

const TokenCreatorPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <TokenCreationFormWrapper />
    <BenefitsSection />
    <FAQSection />
  </div>
)

export default TokenCreatorPage
