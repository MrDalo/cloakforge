'use client'

import { Droplets } from 'lucide-react'
import HeroSectionLayout from '@/components/common/HeroSectionLayout/HeroSectionLayout'
import HeroHeading from '@/components/common/HeroHeading/HeroHeading'
import FeaturesGrid from './FeaturesGrid'

export const HeroSection = (): React.ReactNode => (
  <HeroSectionLayout>
    <HeroHeading
      badgeIcon={Droplets}
      badgeText='Liquidity Provider'
      description='Add liquidity to Solana DEXs with optimal routing, minimal slippage, and maximum yield potential. Professional-grade tools for liquidity providers.'
      title='Create Liquidity Pools'
    />
    <FeaturesGrid />
  </HeroSectionLayout>
)
