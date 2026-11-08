'use client'

import { motion } from 'framer-motion'
import { Coins, Hash, Boxes, ListChecks } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { TokenAuditReport } from '@/types/tokenAudit'

interface TokenStatsProps {
  report: TokenAuditReport
}

/** Headline on-chain facts: supply, decimals, token program and finding counts. */
export const TokenStats = ({ report }: TokenStatsProps): React.ReactNode => {
  const { summary } = report
  const stats = [
    { icon: Coins, title: 'Total supply', value: report.supplyDisplay },
    { icon: Hash, title: 'Decimals', value: String(report.decimals) },
    { icon: Boxes, title: 'Token program', value: report.tokenProgram === 'token-2022' ? 'Token-2022' : 'SPL Token' },
    {
      icon: ListChecks,
      title: 'Findings',
      value: `${summary.fail} high risk · ${summary.warn} ${summary.warn === 1 ? 'warning' : 'warnings'}`,
      subtitle: `${summary.pass} passed · ${summary.unknown} not analyzed`,
    },
  ]

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className='mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'
      initial={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.8 }}
    >
      {stats.map((stat) => (
        <Card className='border-2' key={stat.title}>
          <CardContent className='p-6'>
            <div className='flex items-center space-x-3'>
              <div className='bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
                <stat.icon className='text-primary h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1'>
                <p className='text-muted-foreground text-sm'>{stat.title}</p>
                <p className='text-lg font-medium break-all'>{stat.value}</p>
                {stat.subtitle && <p className='text-muted-foreground text-xs'>{stat.subtitle}</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  )
}
