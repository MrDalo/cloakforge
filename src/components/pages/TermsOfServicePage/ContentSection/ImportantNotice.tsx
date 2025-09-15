'use client'

import { AlertTriangle } from 'lucide-react'
import { LegalNoticeCard } from '@/components/common/LegalNoticeCard'

export const ImportantNotice = (): React.ReactNode => (
  <LegalNoticeCard
    content='CloakForge operates on the Solana blockchain. All transactions are irreversible once confirmed. Please ensure you understand the risks before using our services.'
    icon={AlertTriangle}
    title='Important Notice'
    variant='warning'
  />
)
