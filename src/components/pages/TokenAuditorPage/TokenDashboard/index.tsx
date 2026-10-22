'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AuditRiskLevel, TokenAuditReport } from '@/types/tokenAudit'
import { riskLevelLabels } from '../tokenAuditorData'
import { AuditDisclaimer } from './AuditDisclaimer'
import { TokenStats } from './TokenStats'
import { TokenDetails } from './TokenDetails'
import { SecurityAnalysis } from './SecurityAnalysis'
import { HolderDistribution } from './HolderDistribution'
import { LiquidityInfo } from './LiquidityInfo'
import { ActionButtons } from './ActionButtons'

interface TokenDashboardProps {
  report: TokenAuditReport
}

const riskLevelStyles: Record<AuditRiskLevel, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-secondary/10 text-secondary border-secondary/20',
}

/**
 * Formats the read time as `YYYY-MM-DD HH:MM UTC` — the same text on the server and in every
 * browser, so the server-rendered markup hydrates without a mismatch.
 *
 * @param isoTimestamp - ISO 8601 timestamp (UTC).
 * @returns Display text.
 */
export const formatAnalyzedAt = (isoTimestamp: string): string => `${isoTimestamp.slice(0, 10)} ${isoTimestamp.slice(11, 16)} UTC`

/** Copies text to the clipboard; a refused permission is ignored (the address stays visible). */
const copyToClipboard = (text: string): void => {
  navigator.clipboard?.writeText(text).catch(() => undefined)
}

/** Mint address with a copy button. */
const MintAddress = ({ mint }: { mint: string }): React.ReactNode => (
  <div className='text-muted-foreground flex items-center justify-center space-x-2'>
    <span className='font-mono text-sm break-all'>{mint}</span>
    <Button aria-label='Copy mint address' className='h-6 w-6 p-0' onClick={() => copyToClipboard(mint)} size='sm' variant='ghost'>
      <Copy className='h-3 w-3' />
    </Button>
  </div>
)

/** Headline: self-reported name and symbol, the derived risk level, mint address and read time. */
const ReportHeader = ({ report }: TokenDashboardProps): React.ReactNode => (
  <motion.div animate={{ opacity: 1, y: 0 }} className='mb-12 text-center' initial={{ opacity: 0, y: 30 }} transition={{ duration: 0.8 }}>
    <div className='bg-primary/10 text-primary mb-6 inline-flex items-center rounded-full px-4 py-2'>
      <CheckCircle className='mr-2 h-4 w-4' />
      <span className='text-sm'>Automated checks complete</span>
    </div>

    <h1 className='mb-6 text-3xl leading-tight break-words md:text-5xl lg:text-6xl'>
      <span className='crypto-text-gradient'>{report.metadata?.name || 'Unnamed token'}</span>
    </h1>

    <div className='mb-8 flex flex-wrap items-center justify-center gap-4'>
      {report.metadata?.symbol && (
        <Badge className='px-4 py-2 text-lg' variant='outline'>
          {report.metadata.symbol}
        </Badge>
      )}
      <Badge className={`px-4 py-2 text-lg ${riskLevelStyles[report.summary.riskLevel]}`}>
        {riskLevelLabels[report.summary.riskLevel]}
      </Badge>
    </div>

    <MintAddress mint={report.mint} />
    <p className='text-muted-foreground mt-2 text-xs'>On-chain data read at {formatAnalyzedAt(report.analyzedAt)}</p>
  </motion.div>
)

/** Result page of the Token Auditor: only values read on-chain or derived from them by fixed rules. */
export const TokenDashboard = ({ report }: TokenDashboardProps): React.ReactNode => (
  <div className='bg-background relative min-h-screen'>
    <section className='from-background via-background to-muted relative overflow-hidden bg-gradient-to-br px-6 py-16 md:py-20'>
      <div className='encrypted-pattern absolute inset-0 opacity-5' />
      <div className='relative z-10 container mx-auto max-w-6xl'>
        <ReportHeader report={report} />
      </div>
    </section>

    <section className='px-6 py-16'>
      <div className='container mx-auto max-w-6xl'>
        <AuditDisclaimer />
        <TokenStats report={report} />

        <div className='mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2'>
          <TokenDetails report={report} />
          <SecurityAnalysis checks={report.checks} />
        </div>

        <HolderDistribution holders={report.holders} />
        <LiquidityInfo />
        <ActionButtons />
      </div>
    </section>
  </div>
)
