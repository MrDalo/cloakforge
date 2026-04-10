'use client'

import { HeroSection, LiquidityProviderForm, FAQSection, liquidityProviderBenefitsConfig } from '@/components/pages/LiquidityProviderPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'

const LiquidityProviderPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <LiquidityProviderForm />
    <BenefitsSection config={liquidityProviderBenefitsConfig} />
    <FAQSection />
  </div>
)

export default LiquidityProviderPage
