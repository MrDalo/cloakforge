'use client'

import { ContentSection } from '@/components/pages/TermsOfServicePage'
import { HeroSection } from '@/components/pages/TermsOfServicePage/HeroSection/HeroSection'

const TermsOfServicePage = (): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <HeroSection />
    <ContentSection />
  </div>
)

export default TermsOfServicePage
