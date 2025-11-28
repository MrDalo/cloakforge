'use client'

import { Coins } from 'lucide-react'
import HeroSectionLayout from '@/components/common/HeroSectionLayout/HeroSectionLayout'
import HeroHeading from '@/components/common/HeroHeading/HeroHeading'
import FeaturesGrid from './FeaturesGrid'

export const HeroSection = (): React.ReactNode => (
  <HeroSectionLayout>
    <HeroHeading
      badgeIcon={Coins}
      badgeText='SPL Token Creator'
      description='Create professional SPL-2022 tokens on Solana with the lowest fees, advanced features, and complete privacy. No coding required.'
      title='Solana Token Creator'
    />
    <FeaturesGrid />
  </HeroSectionLayout>
)
