'use client'

import { motion } from 'framer-motion'
import { Shield, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export const FooterCTA = (): React.ReactNode => (
  <motion.div
    className='mt-16'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.3, duration: 0.8 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <Card className='from-primary/10 to-secondary/10 border-0 bg-gradient-to-r shadow-md'>
      <CardContent className='p-8 text-center'>
        <Shield className='text-primary mx-auto mb-4 h-12 w-12' />
        <h3 className='mb-4 text-xl font-medium'>Agreement Acknowledgment</h3>
        <p className='text-muted-foreground mx-auto mb-6 max-w-2xl'>
          By using Crypto Forge, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do
          not agree with any part of these terms, please discontinue use of the Service.
        </p>
        <div className='text-muted-foreground flex items-center justify-center space-x-2 text-sm'>
          <Lock className='h-4 w-4' />
          <span>Crypto Forge - Secure • Private • Decentralized</span>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)
