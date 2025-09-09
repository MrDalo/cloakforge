import { HeroSection, LiquidityCreationForm, FAQSection } from '@/components/pages/CreateLiquidityPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { createLiquidityBenefitsConfig } from '@/components/pages/CreateLiquidityPage/BenefitsSection/benefitsConfig'

const CreateLiquidityPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <LiquidityCreationForm />
    <BenefitsSection config={createLiquidityBenefitsConfig} />
    <FAQSection />
  </div>
)

export default CreateLiquidityPage
