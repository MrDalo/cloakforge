import { SectionHeader } from './SectionHeader'
import { ServicesGrid } from './ServicesGrid'
import { BottomCTA } from './BottomCTA'

export const ServiceShowcase = (): React.ReactNode => (
  <section className='bg-background relative overflow-hidden px-6 py-20' id='services'>
    <div className='relative z-10 container mx-auto max-w-7xl'>
      <SectionHeader />
      <ServicesGrid />
      <BottomCTA />
    </div>
  </section>
)
