'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export const BottomCTA = (): React.ReactNode => (
  <motion.div
    className='mt-12 text-center'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.5, duration: 0.8 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <h3 className='mb-4 text-2xl font-bold'>Ready to Launch Your Token?</h3>
    <p className='text-muted-foreground mb-6 text-lg'>Join thousands of creators who have built successful tokens on Solana</p>
    <Button className='group' size='lg'>
      Get Started Now
      <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
    </Button>
  </motion.div>
)
