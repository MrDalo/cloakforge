'use client'

import { ShieldOff, Unlock } from 'lucide-react'
import { HeroSectionLayout } from '@/components/common'
import { FeatureHighlights } from './FeatureHighlights'
import { TrustReasons } from './TrustReasons'

export const HeroSection = () => {
  return (
    <HeroSectionLayout
      badgeIcon={ShieldOff}
      badgeText='Revoke Freeze Authority'
      floatingElement={
        <div className='border-secondary/20 absolute top-20 left-20 flex h-16 w-16 items-center justify-center rounded-lg border-2'>
          <Unlock className='text-secondary/40 h-6 w-6' />
        </div>
      }
      subtitle='Build ultimate trust with your community by permanently giving up the ability to freeze token accounts. Demonstrate your commitment to decentralization and user freedom.'
      title='Revoke Freeze Authority'
      variant='secondary'
    >
      <FeatureHighlights />
      <TrustReasons />
    </HeroSectionLayout>
  )
}

