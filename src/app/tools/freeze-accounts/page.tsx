'use client'

import { HeroSection, FreezeForm, BenefitsSection, FAQSection } from '@/components/pages/FreezeAccountsPage'

const FreezeAccounts = (): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <HeroSection />
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <FreezeForm />
      </div>
    </section>
    <FAQSection />
    <BenefitsSection />
  </div>
)

export default FreezeAccounts
