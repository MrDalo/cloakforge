'use client'

import { Scale } from 'lucide-react'
import { LegalHeroSection } from '@/components/common/LegalHeroSection'

export const HeroSection = (): React.ReactNode => (
  <LegalHeroSection
    badgeIcon={Scale}
    badgeText='Legal Documentation'
    subtitle='Please read these terms carefully before using CloakForge. By using our service, you agree to be bound by these terms.'
    title='Terms of Service'
  />
)
