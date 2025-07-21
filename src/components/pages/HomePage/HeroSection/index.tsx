import { BackgroundElements } from './BackgroundElements'
import { HeroContent } from './HeroContent'
import { OrbitingVisualization } from './OrbitingVisualization'

export const HeroSection = (): React.ReactNode => (
  <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-20'>
    {/* Background Elements */}
    <BackgroundElements />

    <div className='relative z-10 container mx-auto max-w-6xl'>
      <div className='grid items-center gap-12 lg:grid-cols-2'>
        {/* Content */}
        <HeroContent />

        {/* Visual Elements */}
        <OrbitingVisualization />
      </div>
    </div>
  </section>
)
