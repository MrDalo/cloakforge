'use client'

import { Shield, EyeOff, Cookie, UserCheck, Globe } from 'lucide-react'
import { LegalHeroSection } from '@/components/common/LegalHeroSection'
import { LEGAL_LAST_UPDATED } from '@/lib/compliance/legalConstants'

export const PrivacyHeroSection = (): React.ReactNode => (
  <LegalHeroSection
    badgeIcon={Shield}
    badgeText='Privacy Policy'
    features={[
      { icon: EyeOff, text: 'No Analytics' },
      { icon: Cookie, text: 'No Cookies' },
      { icon: UserCheck, text: 'No Account Needed' },
      { icon: Globe, text: 'Wallet Activity Is Public' },
    ]}
    gradientFrom='from-secondary'
    gradientTo='to-primary'
    lastUpdated={LEGAL_LAST_UPDATED}
    subtitle='What personal data CloakForge processes, why, who receives it, how long it is kept, and your rights under the GDPR.'
    title='Privacy Policy'
  />
)
