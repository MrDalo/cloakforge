'use client'

import { AlertTriangle } from 'lucide-react'
import { NotificationCard } from '@/components/common/NotificationCard'
import { auditDisclaimer } from '../tokenAuditorData'

/** "Not financial advice / automated checks can miss risks" notice shown with every result. */
export const AuditDisclaimer = (): React.ReactNode => (
  <NotificationCard
    className='mb-12'
    description={auditDisclaimer.description}
    icon={AlertTriangle}
    title={auditDisclaimer.title}
    variant='warning'
  />
)
