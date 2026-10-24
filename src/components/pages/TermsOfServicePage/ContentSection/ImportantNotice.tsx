'use client'

import { AlertTriangle } from 'lucide-react'
import { LegalNoticeCard } from '@/components/common/LegalNoticeCard'
import { SHOWCASE_NETWORK_LABEL } from '@/lib/compliance/legalConstants'
import { IS_SHOWCASE_MODE } from '@/lib/config/network'

const NOTICE = IS_SHOWCASE_MODE
  ? `CloakForge is a demo on Solana ${SHOWCASE_NETWORK_LABEL}. Use test tokens only: nothing here has real value, and no real payments are made. Do not use it for real assets.`
  : 'CloakForge builds transactions that you sign on the Solana blockchain. Confirmed transactions are irreversible and the service is then fully performed. Please review every transaction in your wallet before signing.'

export const ImportantNotice = (): React.ReactNode => (
  <LegalNoticeCard content={NOTICE} icon={AlertTriangle} title='Important Notice' variant='warning' />
)
