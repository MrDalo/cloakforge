'use client'

import { FileText, Scale, Globe, Shield } from 'lucide-react'
import { LegalHeroSection } from '@/components/common/LegalHeroSection'
import { LEGAL_LAST_UPDATED } from '@/lib/compliance/legalConstants'

export const ImprintHeroSection = (): React.ReactNode => (
  <LegalHeroSection
    badgeIcon={FileText}
    badgeText='Legal Notice'
    features={[
      { icon: Scale, text: 'Operator Details' },
      { icon: Globe, text: 'Service Info' },
      { icon: Shield, text: 'Regulatory Status' },
      { icon: FileText, text: 'Contact Info' },
    ]}
    gradientFrom='from-primary'
    gradientTo='to-secondary'
    lastUpdated={LEGAL_LAST_UPDATED}
    subtitle='Legal identification and disclosure information for the operator of the CloakForge service, as required by applicable law.'
    title='Imprint'
  />
)
