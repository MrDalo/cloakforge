'use client'

import { Scale } from 'lucide-react'
import { LegalHeroSection } from '@/components/common/LegalHeroSection'
import { LEGAL_LAST_UPDATED, TERMS_VERSION } from '@/lib/compliance/legalConstants'

export const HeroSection = (): React.ReactNode => (
  <LegalHeroSection
    badgeIcon={Scale}
    badgeText={`Version ${TERMS_VERSION}`}
    lastUpdated={LEGAL_LAST_UPDATED}
    subtitle='Please read these terms carefully. They apply to your use of CloakForge, and you accept them for each paid action before you sign the transaction.'
    title='Terms of Service'
  />
)
