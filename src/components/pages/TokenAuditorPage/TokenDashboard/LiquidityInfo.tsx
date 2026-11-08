'use client'

import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/** Liquidity is outside what the auditor reads; this card says so instead of showing numbers. */
export const LiquidityInfo = (): React.ReactNode => (
  <motion.div animate={{ opacity: 1, y: 0 }} className='mb-12' initial={{ opacity: 0, y: 30 }} transition={{ delay: 0.4, duration: 0.8 }}>
    <Card className='border-border border-2'>
      <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
        <CardTitle className='flex items-center justify-between gap-2'>
          <span className='flex items-center space-x-2'>
            <Activity className='text-primary h-5 w-5' />
            <span>Liquidity & Trading</span>
          </span>
          <Badge className='text-xs' variant='outline'>
            Not analyzed
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className='p-6'>
        <p className='text-muted-foreground text-sm leading-relaxed'>
          This tool does not check liquidity pools, whether liquidity is locked or can be withdrawn, price, market cap or trading volume.
          Check these separately before trading.
        </p>
      </CardContent>
    </Card>
  </motion.div>
)
