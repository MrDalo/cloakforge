'use client'

import { HeroSection, FreezeForm, FAQSection } from '@/components/pages/FreezeAccountsPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { freezeAccountsBenefitsConfig } from '@/components/pages/FreezeAccountsPage/BenefitsSection/benefitsConfig'

const FreezeAccounts = (): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <HeroSection />
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <FreezeForm />
      </div>
    </section>
    <BenefitsSection config={freezeAccountsBenefitsConfig} />
    <FAQSection />
  </div>
)

export default FreezeAccounts
