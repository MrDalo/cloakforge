'use client'

import { motion } from 'framer-motion'
import { ScanEye, Search } from 'lucide-react'
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
        className='border-primary/20 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-full border-2'
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <Search className='text-primary/40 h-6 w-6' />
      </motion.div>
    }
  >
    <HeroHeading
      badgeIcon={ScanEye}
      badgeText='Token Auditor'
      description='Comprehensive security analysis and real-time data for any Solana SPL token. Get instant insights on authority status, holder distribution, and potential risks.'
      title='Solana Token Auditor'
    />
    <FeaturesGrid />
  </HeroSectionLayout>
)

export default HeroSection
