'use client'

import { FileText } from 'lucide-react'
import { LegalFooter } from '@/components/common/LegalFooter'

export const ImprintFooterSection = (): React.ReactNode => (
  <LegalFooter
    description='CloakForge is a non-custodial software interface. The operator does not provide financial advice and is not responsible for user actions on the blockchain. All blockchain interactions are performed directly by users.'
    icon={FileText}
    tagline='CloakForge - Non-Custodial • Software Interface Only • No Financial Advice'
    title='Legal Transparency'
  />
)
