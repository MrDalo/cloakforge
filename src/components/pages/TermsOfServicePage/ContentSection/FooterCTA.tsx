'use client'

import { Shield } from 'lucide-react'
import { LegalFooter } from '@/components/common/LegalFooter'
import { LEGAL_CONTACTS } from '@/lib/compliance/legalConstants'

export const FooterCTA = (): React.ReactNode => (
  <LegalFooter
    description={`Before every paid action you accept these Terms by ticking the acceptance box and then signing in your wallet. Questions or complaints: ${LEGAL_CONTACTS.support}. Report illegal content: ${LEGAL_CONTACTS.abuse}.`}
    icon={Shield}
    tagline='CloakForge - Non-Custodial • You Sign Every Transaction'
    title='Agreement and Contact'
  />
)
