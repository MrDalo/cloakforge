'use client'

import { ImprintHeroSection } from '@/components/pages/ImprintPage/HeroSection'
import { ImprintContentSection } from '@/components/pages/ImprintPage/ContentSection'
import { ImprintFooterSection } from '@/components/pages/ImprintPage/FooterSection'

const ImprintPage = (): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <ImprintHeroSection />
    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-4xl'>
        <ImprintContentSection />
        <ImprintFooterSection />
      </div>
    </section>
  </div>
)

export default ImprintPage
