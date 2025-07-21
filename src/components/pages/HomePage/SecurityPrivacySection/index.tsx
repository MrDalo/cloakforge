'use client'

import { BackgroundElements } from './BackgroundElements'
import { SectionHeader } from './SectionHeader'
import { SecurityFeaturesGrid } from './SecurityFeaturesGrid'
import { DataPrivacyTable } from './DataPrivacyTable'
import { ComplianceGrid } from './ComplianceGrid'
import { BottomBadge } from './BottomBadge'

export const SecurityPrivacySection = (): React.ReactNode => (
  <section className='from-muted/20 via-background to-muted/10 relative overflow-hidden bg-gradient-to-br px-6 py-20' id='security-privacy'>
    <BackgroundElements />

    <div className='relative z-10 container mx-auto max-w-7xl'>
      <SectionHeader />
      <SecurityFeaturesGrid />
      <DataPrivacyTable />
      <ComplianceGrid />
      <BottomBadge />
    </div>
  </section>
)
