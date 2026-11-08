'use client'

import { motion } from 'framer-motion'
import { Shield, CheckCircle2, AlertTriangle, XCircle, HelpCircle, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuditCheck, AuditCheckStatus } from '@/types/tokenAudit'
import { checkStatusLabels } from '../tokenAuditorData'
import { AddressValue } from './AddressValue'

interface SecurityAnalysisProps {
  checks: AuditCheck[]
}

const statusStyles: Record<AuditCheckStatus, { icon: LucideIcon; className: string }> = {
  pass: { icon: CheckCircle2, className: 'text-secondary' },
  warn: { icon: AlertTriangle, className: 'text-warning' },
  fail: { icon: XCircle, className: 'text-destructive' },
  unknown: { icon: HelpCircle, className: 'text-muted-foreground' },
}

const CheckItem = ({ check }: { check: AuditCheck }): React.ReactNode => {
  const { icon: StatusIcon, className } = statusStyles[check.status]
  return (
    <li className='bg-muted/50 rounded-lg p-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-start gap-2'>
          <StatusIcon aria-hidden='true' className={`mt-0.5 h-4 w-4 shrink-0 ${className}`} />
          <span className='text-sm font-medium'>{check.title}</span>
        </div>
        <Badge className={`shrink-0 text-xs ${className}`} variant='outline'>
          {checkStatusLabels[check.status]}
        </Badge>
      </div>
      <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{check.explanation}</p>
      {check.address && (
        <div className='mt-1'>
          <AddressValue address={check.address} />
        </div>
      )}
    </li>
  )
}

/** List of rule-based checks with their outcome and explanation. */
export const SecurityAnalysis = ({ checks }: SecurityAnalysisProps): React.ReactNode => (
  <motion.div animate={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: 30 }} transition={{ duration: 0.8 }}>
    <Card className='border-border h-full border-2'>
      <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
        <CardTitle className='flex items-center space-x-2'>
          <Shield className='text-primary h-5 w-5' />
          <span>Automated Checks</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 p-6'>
        <ul className='space-y-3'>
          {checks.map((check) => (
            <CheckItem check={check} key={check.id} />
          ))}
        </ul>
        <p className='text-muted-foreground text-xs leading-relaxed'>
          There is no numeric score. The overall result is &quot;high-risk signals&quot; if any check is high risk, &quot;needs
          attention&quot; if any check warned or was not analyzed, and &quot;no red flags found&quot; only if every check passed.
        </p>
      </CardContent>
    </Card>
  </motion.div>
)
