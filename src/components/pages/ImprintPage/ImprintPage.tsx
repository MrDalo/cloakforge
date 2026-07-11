'use client'

import { ImprintHeroSection } from './HeroSection'
import { ImprintContentSection } from './ContentSection'
import { ImprintFooterSection } from './FooterSection'

export const ImprintPage = (): React.ReactNode => (
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
