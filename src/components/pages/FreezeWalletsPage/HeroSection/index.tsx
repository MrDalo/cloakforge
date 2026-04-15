'use client'

import BackgroundElements from './BackgroundElements'
import HeroHeader from './HeroHeader'
import FeaturesGrid from './FeaturesGrid'

const HeroSection = (): React.ReactNode => (
  <section className='dark:via-background after:to-background from-info/10 via-background to-info/10 dark:from-info/20 dark:to-info/20 relative overflow-hidden bg-gradient-to-br px-6 py-16 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-24 after:bg-gradient-to-b after:from-transparent md:py-20'>
    <BackgroundElements />
    <div className='relative z-10 container mx-auto max-w-6xl'>
      <HeroHeader />
      <FeaturesGrid />
    </div>
  </section>
)

export default HeroSection
