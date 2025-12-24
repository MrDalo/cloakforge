'use client'

import { BenefitsSection } from '@/components/common'
import { FAQSection, HeroSection, MultisenderForm } from '@/components/pages/TransactionMultisenderPage'
import { multisenderBenefitsConfig } from '@/components/pages/TransactionMultisenderPage/BenefitsSection/benefitsConfig'

const Page = (): React.ReactNode => (
  <div className='min-h-screen'>
    {/* Hero Section */}
    <HeroSection />

    {/* Multisender Form */}
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <MultisenderForm />
      </div>
    </section>

    {/* Benefits Section */}
    <BenefitsSection config={multisenderBenefitsConfig} />

    {/* FAQ Section */}
    <FAQSection />
  </div>
)

export default Page
