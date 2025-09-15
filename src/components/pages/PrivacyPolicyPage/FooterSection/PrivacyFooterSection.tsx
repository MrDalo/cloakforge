'use client'

import { Shield } from 'lucide-react'
import { LegalFooter } from '@/components/common/LegalFooter'

export const PrivacyFooterSection = (): React.ReactNode => (
  <LegalFooter
    description="Privacy isn't an afterthought - it's built into every aspect of CloakForge. Your anonymity and security are guaranteed by our architecture, not just our promises."
    icon={Shield}
    tagline='CloakForge - Zero Tracking • Maximum Privacy • Complete Anonymity'
    title='Privacy by Design'
  />
)
