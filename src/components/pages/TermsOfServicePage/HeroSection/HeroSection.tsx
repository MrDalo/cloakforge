'use client'

import { Scale } from 'lucide-react'
import { LegalHeroSection } from '@/components/common/LegalHeroSection'
import { LEGAL_LAST_UPDATED, SHOWCASE_NETWORK_LABEL, TERMS_VERSION } from '@/lib/compliance/legalConstants'
import { IS_SHOWCASE_MODE } from '@/lib/config/network'

const SUBTITLE = IS_SHOWCASE_MODE
  ? `Short demo terms for a non-commercial portfolio showcase on Solana ${SHOWCASE_NETWORK_LABEL}. Test tokens only; nothing here has real value.`
  : 'Please read these terms carefully. They apply to your use of CloakForge, and you accept them for each paid action before you sign the transaction.'

export const HeroSection = (): React.ReactNode => (
  <LegalHeroSection
    badgeIcon={Scale}
    badgeText={`${IS_SHOWCASE_MODE ? 'Demo Terms version' : 'Version'} ${TERMS_VERSION}`}
    lastUpdated={LEGAL_LAST_UPDATED}
    subtitle={SUBTITLE}
    title='Terms of Service'
  />
)
