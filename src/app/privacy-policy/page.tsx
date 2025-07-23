'use client'

import { PrivacyContentSection } from '@/components/pages/PrivacyPolicyPage/ContentSection'
import { PrivacyFooterSection } from '@/components/pages/PrivacyPolicyPage/FooterSection'
import { PrivacyHeroSection } from '@/components/pages/PrivacyPolicyPage/HeroSection'

const PrivacyPolicyPage = (): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    {/* Animated Background */}

    <PrivacyHeroSection />
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <PrivacyContentSection />
        <PrivacyFooterSection />
      </div>
    </section>
  </div>
)

export default PrivacyPolicyPage
