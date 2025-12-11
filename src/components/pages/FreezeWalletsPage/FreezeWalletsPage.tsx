'use client'

import HeroSection from './HeroSection'
import { FreezeForm } from './FreezeForm'
import FAQSection from './FAQSection'
import { BenefitsSection } from '@/components/common'
import { freezeWalletsBenefitsConfig } from './BenefitsSection/benefitsConfig'

export const FreezeWalletsPage = (): React.ReactNode => (
  <div className='min-h-screen'>
    {/* Hero Section */}
    <HeroSection />

    {/* Freeze Wallets Form */}
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <FreezeForm />
      </div>
    </section>

    {/* Benefits Section */}
    <BenefitsSection config={freezeWalletsBenefitsConfig} />

    {/* FAQ Section */}
    <FAQSection />
  </div>
)
