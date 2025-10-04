'use client'

import { BenefitsSection } from '@/components/common'
import { UnfreezeForm } from '@/components/pages/UnfreezeAccountsPage/UnfreezeForm'
import { FAQSection } from '@/components/pages/UnfreezeAccountsPage/FAQSection'
import { unfreezeAccountsBenefitsConfig } from '@/components/pages/UnfreezeAccountsPage/benefitsConfig'
import { HeroSection } from '@/components/pages/UnfreezeAccountsPage/HeroSection'

const UnfreezeAccountsPage = (): React.ReactNode => (
  <div className='min-h-screen'>
    <HeroSection />
    <UnfreezeForm />
    <BenefitsSection config={unfreezeAccountsBenefitsConfig} />
    <FAQSection />
  </div>
)

export default UnfreezeAccountsPage
