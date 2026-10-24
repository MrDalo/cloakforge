'use client'

import { HeroSection } from './HeroSection/HeroSection'
import { LiquidityProviderForm } from './LiquidityProviderForm'
import { FAQSection } from './FAQSection/FAQSection'
import { liquidityProviderBenefitsConfig } from './BenefitsSection/benefitsConfig'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { RelatedTools } from '@/components/common/RelatedTools'

export const LiquidityProviderPageContent = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <LiquidityProviderForm />
    <BenefitsSection config={liquidityProviderBenefitsConfig} />
    <FAQSection />
    <RelatedTools toolId='liquidity-provider' />
  </div>
)
