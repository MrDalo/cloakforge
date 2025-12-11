'use client'

import { BenefitsSection } from '@/components/common'
import { HeroSection } from './HeroSection'
import { UnfreezeForm } from './UnfreezeForm'
import { FAQSection } from './FAQSection'
import { unfreezeWalletsBenefitsConfig } from './benefitsConfig'

export const UnfreezeWalletsPage = (): React.ReactNode => (
  <div className='min-h-screen'>
    <HeroSection />
    <div className='container mx-auto max-w-4xl px-6 py-16'>
      <UnfreezeForm />
    </div>
    <BenefitsSection config={unfreezeWalletsBenefitsConfig} />
    <FAQSection />
  </div>
)
