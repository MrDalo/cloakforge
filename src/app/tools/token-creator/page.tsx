import { HeroSection, TokenCreationFormWrapper, FAQSection } from '@/components/pages/TokenCreatorPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { tokenCreatorBenefitsConfig } from '@/components/pages/TokenCreatorPage/BenefitsSection/benefitsConfig'

const TokenCreatorPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <TokenCreationFormWrapper />
    <BenefitsSection config={tokenCreatorBenefitsConfig} />
    <FAQSection />
  </div>
)

export default TokenCreatorPage
