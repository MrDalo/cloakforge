'use client'

import { Ban } from 'lucide-react'
import { HeroSectionLayout } from '@/components/common'
import { FeatureHighlights } from './FeatureHighlights'
import { TrustReasons } from './TrustReasons'

export const HeroSection = () => {
  return (
    <HeroSectionLayout
      badgeIcon={Ban}
      badgeText='Revoke Mint Authority'
      floatingElement={
        <div className='border-secondary/20 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-lg border-2'>
          <Ban className='text-secondary/40 h-6 w-6' />
        </div>
      }
      subtitle='Create a permanently fixed token supply by revoking mint authority. Build ultimate trust with your community and prevent future token inflation forever.'
      title='Revoke Mint Authority'
      variant='secondary'
    >
      <FeatureHighlights />
      <TrustReasons />
    </HeroSectionLayout>
  )
}

