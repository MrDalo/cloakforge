'use client'

import { Shield } from 'lucide-react'
import { LegalFooter } from '@/components/common/LegalFooter'

export const FooterCTA = (): React.ReactNode => (
  <LegalFooter
    description='By using SolCloak, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please discontinue use of the Service.'
    icon={Shield}
    tagline='SolCloak - Secure • Private • Decentralized'
    title='Agreement Acknowledgment'
  />
)
