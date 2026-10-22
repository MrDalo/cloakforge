'use client'

import { AlertTriangle } from 'lucide-react'
import { LegalNoticeCard } from '@/components/common/LegalNoticeCard'

export const ImportantNotice = (): React.ReactNode => (
  <LegalNoticeCard
    content='CloakForge builds transactions that you sign on the Solana blockchain. Confirmed transactions are irreversible and the service is then fully performed. Please review every transaction in your wallet before signing.'
    icon={AlertTriangle}
    title='Important Notice'
    variant='warning'
  />
)
