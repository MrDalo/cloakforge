'use client'

import { Shield } from 'lucide-react'
import { LegalFooter } from '@/components/common/LegalFooter'
import { LEGAL_CONTACTS } from '@/lib/compliance/legalConstants'

export const PrivacyFooterSection = (): React.ReactNode => (
  <LegalFooter
    description={`We keep personal data to the minimum needed to run the service. Questions or requests: ${LEGAL_CONTACTS.privacy}.`}
    icon={Shield}
    tagline='CloakForge - No Accounts • No Analytics • No Ad Trackers'
    title='Privacy Questions'
  />
)
