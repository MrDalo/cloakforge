'use client'

import { SectionHeader } from './SectionHeader'
import { BenefitsGrid } from './BenefitsGrid'
import { ComparisonTable } from './ComparisonTable'
import { BottomCTA } from './BottomCTA'

export const BenefitsSection = (): React.ReactNode => (
  <section className='from-background to-muted/20 bg-gradient-to-b px-6 py-24'>
    <div className='container mx-auto max-w-7xl'>
      <SectionHeader />
      <BenefitsGrid />
      <ComparisonTable />
      <BottomCTA />
    </div>
  </section>
)
