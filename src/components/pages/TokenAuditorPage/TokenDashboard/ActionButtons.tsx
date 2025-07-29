'use client'

import { motion } from 'framer-motion'
import { Search, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const ActionButtons = (): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='flex justify-center space-x-4'
    initial={{ opacity: 0, y: 30 }}
    transition={{ delay: 0.6, duration: 0.8 }}
  >
    <Button
      className='bg-primary hover:bg-primary-hover text-primary-foreground'
      onClick={() => (window.location.href = '/tools/token-auditor')}
    >
      <Search className='mr-2 h-4 w-4' />
      Audit Another Token
    </Button>
    <Button onClick={() => window.location.reload()} variant='outline'>
      <RefreshCw className='mr-2 h-4 w-4' />
      Refresh Data
    </Button>
  </motion.div>
)
