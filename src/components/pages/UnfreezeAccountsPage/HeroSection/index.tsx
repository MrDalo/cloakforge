'use client'

import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import HeroSectionLayout from '@/components/common/HeroSectionLayout/HeroSectionLayout'
import HeroHeading from '@/components/common/HeroHeading/HeroHeading'
import FeaturesGrid from './FeaturesGrid'

export const HeroSection = (): React.ReactNode => (
  <HeroSectionLayout
    floatingElement={
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          rotate: [0, 180, 360],
        }}
        className='border-warning-foreground/40 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-full border-2'
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <RefreshCw className='text-warning-foreground/40 h-6 w-6' />
      </motion.div>
    }
    variant='warning'
  >
    <HeroHeading
      badgeIcon={RefreshCw}
      badgeText='Account Management'
      description='Instantly restore account functionality with secure, batch-enabled unfreezing operations. Maintain full control over your token accounts with professional-grade tools.'
      title='Unfreeze Solana Accounts'
      variant='warning'
    />
    <FeaturesGrid />
  </HeroSectionLayout>
)
