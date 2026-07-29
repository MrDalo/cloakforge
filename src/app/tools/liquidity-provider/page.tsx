'use client'

import { HeroSection, LiquidityProviderForm, FAQSection, liquidityProviderBenefitsConfig } from '@/components/pages/LiquidityProviderPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { RelatedTools } from '@/components/common/RelatedTools'

const LiquidityProviderPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <LiquidityProviderForm />
    <BenefitsSection config={liquidityProviderBenefitsConfig} />
    <FAQSection />
    <RelatedTools toolId='liquidity-provider' />
  </div>
)

export default LiquidityProviderPage
