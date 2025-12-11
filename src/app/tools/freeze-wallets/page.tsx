'use client'

import { HeroSection, FreezeForm, FAQSection } from '@/components/pages/FreezeWalletsPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { freezeWalletsBenefitsConfig } from '@/components/pages/FreezeWalletsPage/BenefitsSection/benefitsConfig'

const FreezeWallets = (): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <HeroSection />
    <FreezeForm />
    <BenefitsSection config={freezeWalletsBenefitsConfig} />
    <FAQSection />
  </div>
)

export default FreezeWallets
