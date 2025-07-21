import { HeroSection, TokenCreationForm, FAQSection, WhyChooseSection } from '@/components/pages/TokenCreatorPage'

const TokenCreatorPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <TokenCreationForm />
    <WhyChooseSection />
    <FAQSection />
  </div>
)

export default TokenCreatorPage
