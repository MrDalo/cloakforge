'use client'

import { BenefitsSection } from '@/components/common'
import { UnfreezeForm } from '@/components/pages/UnfreezeWalletsPage/UnfreezeForm'
import { FAQSection } from '@/components/pages/UnfreezeWalletsPage/FAQSection'
import { unfreezeWalletsBenefitsConfig } from '@/components/pages/UnfreezeWalletsPage/BenefitsSection'
import { HeroSection } from '@/components/pages/UnfreezeWalletsPage/HeroSection'

const UnfreezeWalletsPage = (): React.ReactNode => (
  <div className='min-h-screen'>
    <HeroSection />
    <UnfreezeForm />
    <BenefitsSection config={unfreezeWalletsBenefitsConfig} />
    <FAQSection />
  </div>
)

export default UnfreezeWalletsPage
