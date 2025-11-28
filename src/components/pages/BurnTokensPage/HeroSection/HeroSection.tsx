'use client'

import { Flame } from 'lucide-react'
import HeroSectionLayout from '@/components/common/HeroSectionLayout/HeroSectionLayout'
import HeroHeading from '@/components/common/HeroHeading/HeroHeading'
import { FeatureHighlights } from './FeatureHighlights'
import { BurnReasons } from './BurnReasons'

export const HeroSection = (): React.ReactNode => (
  <HeroSectionLayout variant='destructive'>
    <HeroHeading
      badgeIcon={Flame}
      badgeText='Token Burner'
      description='Permanently remove tokens from circulation with the lowest fees and maximum security. Reduce supply, build trust, and implement deflationary tokenomics safely.'
      title='Burn Tokens'
      variant='destructive'
    />
    <FeatureHighlights />
    <BurnReasons />
  </HeroSectionLayout>
)
