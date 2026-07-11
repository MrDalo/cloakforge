'use client'

import BackgroundElements from './BackgroundElements'
import HeroHeader from './HeroHeader'
import FeaturesGrid from './FeaturesGrid'

export const HeroSection = (): React.ReactNode => (
  <section className='from-warning/30 to-warning/30 after:to-background dark:from-warning/10 dark:via-background dark:to-warning/10 relative overflow-hidden bg-gradient-to-br via-white px-6 py-16 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-24 after:bg-gradient-to-b after:from-transparent md:py-20'>
    <BackgroundElements />
    <div className='relative z-10 container mx-auto max-w-6xl'>
      <HeroHeader />
      <FeaturesGrid />
    </div>
  </section>
)
