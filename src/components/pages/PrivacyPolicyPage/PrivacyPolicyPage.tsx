'use client'

import { PrivacyHeroSection } from './HeroSection'
import { PrivacyContentSection } from './ContentSection'
import { PrivacyFooterSection } from './FooterSection'

export const PrivacyPolicyPage = (): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    {/* Animated Background */}
    <div className='privacy-gradient absolute inset-0 opacity-5' />
    <div className='blockchain-pattern absolute inset-0 opacity-10' />

    <PrivacyHeroSection />
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <PrivacyContentSection />
        <PrivacyFooterSection />
      </div>
    </section>
  </div>
)
