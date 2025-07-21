'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const CTAButtons = (): React.ReactNode => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className='flex flex-col gap-4 sm:flex-row'
    initial={{ opacity: 0, y: 20 }}
    transition={{ delay: 0.7, duration: 0.8 }}
  >
    <Button
      asChild
      className='bg-primary hover:bg-primary-hover text-primary-foreground flex w-fit items-center justify-center rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl'
    >
      <Link href='/tools/token-creator'>
        <span>Create Your Token</span>
        <ArrowRight className='size-5' />
      </Link>
    </Button>
    <Button asChild className='hover:bg-accent w-fit rounded-lg border-2 px-8 py-3 transition-all duration-300' variant='secondary'>
      <Link href='/#security-privacy'>View Security & Privacy</Link>
    </Button>
  </motion.div>
)
