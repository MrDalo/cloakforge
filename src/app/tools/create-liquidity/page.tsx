import { HeroSection, LiquidityCreationForm, FAQSection, BenefitsSection } from '@/components/pages/CreateLiquidityPage'

const CreateLiquidityPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <LiquidityCreationForm />
    <BenefitsSection />
    <FAQSection />
  </div>
)

export default CreateLiquidityPage
