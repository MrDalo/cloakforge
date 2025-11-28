'use client'

import { Send } from 'lucide-react'
import HeroSectionLayout from '@/components/common/HeroSectionLayout/HeroSectionLayout'
import HeroHeading from '@/components/common/HeroHeading/HeroHeading'
import FeaturesGrid from './FeaturesGrid'

export const HeroSection = (): React.ReactNode => (
  <HeroSectionLayout variant='info'>
    <HeroHeading
      badgeIcon={Send}
      badgeText='Transaction Multisender'
      description='Send tokens to multiple recipients in a single transaction. Save up to 90% on fees with our advanced batch processing system.'
      title='Solana Transaction Multisender'
      variant='info'
    />
    <FeaturesGrid />
  </HeroSectionLayout>
)
