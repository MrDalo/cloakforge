'use client'

import { BenefitsSection } from '@/components/common/BenefitsSection'
import { createLiquidityBenefitsConfig } from '@/components/pages/CreateLiquidityPage/BenefitsSection/benefitsConfig'
import { FAQSection, HeroSection } from '@/components/pages/CreateLiquidityPage'
import { LiquidityWizard } from '@/components/pages/CreateLiquidityPage/LiquidityWizard'

const CreateLiquidityPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <div className='container mx-auto max-w-4xl py-12' id='create-liquidity-form'>
      <LiquidityWizard />
    </div>
    <BenefitsSection config={createLiquidityBenefitsConfig} />
    <FAQSection />
  </div>
)

export default CreateLiquidityPage
