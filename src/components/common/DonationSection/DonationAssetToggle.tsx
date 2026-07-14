'use client'

import { Button } from '@/components/ui/button'
import { type DonationFormData } from './donationSchema'

interface DonationAssetToggleProps {
  assetType: DonationFormData['assetType']
  onAssetTypeChange: (assetType: DonationFormData['assetType']) => void
}

export const DonationAssetToggle = ({ assetType, onAssetTypeChange }: DonationAssetToggleProps): React.ReactNode => (
  <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
    <span className='text-muted-foreground text-sm'>Donate with:</span>
    <div className='flex w-fit overflow-hidden rounded-lg border'>
      <Button
        className={`rounded-none ${assetType === 'SOL' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
        onClick={() => onAssetTypeChange('SOL')}
        size='sm'
        type='button'
        variant='ghost'
      >
        SOL
      </Button>
      <Button
        className={`rounded-none ${assetType === 'SPL' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
        onClick={() => onAssetTypeChange('SPL')}
        size='sm'
        type='button'
        variant='ghost'
      >
        A token in my wallet
      </Button>
    </div>
  </div>
)
