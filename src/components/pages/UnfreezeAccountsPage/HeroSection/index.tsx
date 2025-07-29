'use client'

import BackgroundElements from './BackgroundElements'
import HeroHeader from './HeroHeader'
import FeaturesGrid from './FeaturesGrid'

export const HeroSection = (): React.ReactNode => (
  <section className='from-background via-background to-warning/5 relative overflow-hidden bg-gradient-to-br px-6 py-16 md:py-20'>
    <BackgroundElements />
    <div className='relative z-10 container mx-auto max-w-6xl'>
      <HeroHeader />
      <FeaturesGrid />
    </div>
  </section>
)
