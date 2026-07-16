'use client'

import { Shield, EyeOff, Cookie, Database, UserX } from 'lucide-react'
import { LegalHeroSection } from '@/components/common/LegalHeroSection'

export const PrivacyHeroSection = (): React.ReactNode => (
  <LegalHeroSection
    badgeIcon={Shield}
    badgeText='Privacy First'
    features={[
      { icon: EyeOff, text: 'No Tracking' },
      { icon: Cookie, text: 'No Cookies' },
      { icon: Database, text: 'No Data Collection' },
      { icon: UserX, text: 'Anonymous' },
    ]}
    gradientFrom='from-secondary'
    gradientTo='to-primary'
    lastUpdated='July 2026'
    subtitle='Your privacy is fundamental to our mission. Learn how CloakForge protects your anonymity and keeps your data secure.'
    title='Privacy Policy'
  />
)
