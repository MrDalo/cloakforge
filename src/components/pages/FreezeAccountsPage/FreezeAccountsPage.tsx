'use client'

import HeroSection from './HeroSection'
import { FreezeForm } from './FreezeForm'
import FAQSection from './FAQSection'
import { BenefitsSection } from '@/components/common'
import { freezeAccountsBenefitsConfig } from './BenefitsSection/benefitsConfig'

export const FreezeAccountsPage = (): React.ReactNode => (
  <div className='min-h-screen'>
    {/* Hero Section */}
    <HeroSection />

    {/* Freeze Accounts Form */}
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <FreezeForm />
      </div>
    </section>

    {/* Benefits Section */}
    <BenefitsSection config={freezeAccountsBenefitsConfig} />

    {/* FAQ Section */}
    <FAQSection />
  </div>
)
