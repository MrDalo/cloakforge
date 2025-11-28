'use client'

import { Snowflake } from 'lucide-react'
import HeroSectionLayout from '@/components/common/HeroSectionLayout/HeroSectionLayout'
import HeroHeading from '@/components/common/HeroHeading/HeroHeading'
import FeaturesGrid from './FeaturesGrid'

const HeroSection = (): React.ReactNode => (
  <HeroSectionLayout variant='info'>
    <HeroHeading
      badgeIcon={Snowflake}
      badgeText='Account Control'
      description='Take immediate control over token accounts. Freeze individual or multiple accounts to prevent unauthorized transactions and enhance security.'
      title='Freeze Token Accounts'
      variant='info'
    />
    <FeaturesGrid />
  </HeroSectionLayout>
)

export default HeroSection
