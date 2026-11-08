'use client'

import { motion } from 'framer-motion'
import { Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HolderConcentration } from '@/types/tokenAudit'
import { holderKindLabels } from '../tokenAuditorData'
import { AddressValue } from './AddressValue'

interface HolderDistributionProps {
  /** Concentration figures, or null when holder data could not be read. */
  holders: HolderConcentration | null
}

/** Formats a share of supply, e.g. 12.5 → "12.5%". */
const formatShare = (percent: number): string => `${Number(percent.toFixed(2))}%`

/**
 * The largest token accounts and their combined share of supply, as read on-chain.
 * Program-controlled owners are shown as such and never labelled as pools or locks.
 */
export const HolderDistribution = ({ holders }: HolderDistributionProps): React.ReactNode => (
  <motion.div animate={{ opacity: 1, y: 0 }} className='mb-12' initial={{ opacity: 0, y: 30 }} transition={{ delay: 0.3, duration: 0.8 }}>
    <Card className='border-border border-2'>
      <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
        <CardTitle className='flex items-center justify-between gap-2'>
          <span className='flex items-center space-x-2'>
            <Users className='text-primary h-5 w-5' />
            <span>Largest Holders</span>
          </span>
          {!holders && (
            <Badge className='text-xs' variant='outline'>
              Not analyzed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 p-6'>
        {holders ? (
          <>
            <dl className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
              <div>
                <dt className='text-muted-foreground'>Top 10 accounts</dt>
                <dd className='font-medium'>{formatShare(holders.top10SharePercent)}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Held by wallets</dt>
                <dd className='font-medium'>{formatShare(holders.walletSharePercent)}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Largest wallet</dt>
                <dd className='font-medium'>{formatShare(holders.largestWalletSharePercent)}</dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Program-controlled or unknown</dt>
                <dd className='font-medium'>{formatShare(holders.unclassifiedSharePercent)}</dd>
              </div>
            </dl>
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead className='text-muted-foreground'>
                  <tr>
                    <th className='py-2 pr-4 font-normal'>#</th>
                    <th className='py-2 pr-4 font-normal'>Owner</th>
                    <th className='py-2 pr-4 font-normal'>Type</th>
                    <th className='py-2 text-right font-normal'>Share of supply</th>
                  </tr>
                </thead>
                <tbody>
                  {holders.topHolders.map((holder, index) => (
                    <tr className='border-border border-t' key={holder.tokenAccount}>
                      <td className='py-2 pr-4'>{index + 1}</td>
                      <td className='py-2 pr-4'>
                        <AddressValue address={holder.owner} emptyLabel='Unknown' />
                      </td>
                      <td className='py-2 pr-4'>{holderKindLabels[holder.kind]}</td>
                      <td className='py-2 text-right'>{formatShare(holder.sharePercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className='text-muted-foreground text-xs leading-relaxed'>
              A wallet can be a person, a team or an exchange. Program-controlled accounts (liquidity pools, locks, vaults and similar) are
              not verified and do not count toward the concentration thresholds.
            </p>
          </>
        ) : (
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Holder data could not be read (the request failed or timed out, or the supply is zero), so holder concentration was not
            analyzed. Try again in a minute.
          </p>
        )}
      </CardContent>
    </Card>
  </motion.div>
)
