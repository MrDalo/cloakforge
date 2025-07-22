'use client'

import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const ImportantNotice = (): React.ReactNode => (
  <motion.div
    className='mb-12'
    initial={{ opacity: 0, y: 30 }}
    transition={{ duration: 0.8 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <Card className='border-warning/20 bg-warning/5 border-2'>
      <CardContent className='p-6'>
        <div className='flex items-start space-x-3'>
          <AlertTriangle className='text-warning mt-0.5 h-6 w-6 flex-shrink-0' />
          <div>
            <h3 className='text-warning mb-2 font-medium'>Important Notice</h3>
            <p className='text-muted-foreground text-sm'>
              Crypto Forge operates on the Solana blockchain. All transactions are irreversible once confirmed. Please ensure you understand
              the risks before using our services.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)
