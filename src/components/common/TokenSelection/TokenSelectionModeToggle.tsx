'use client'

import { Button } from '@/components/ui/button'
import { type TokenSelectionModeToggleProps } from './types'

export const TokenSelectionModeToggle = ({ mode, onModeChange, className }: TokenSelectionModeToggleProps): React.ReactNode => (
  <div className={`flex items-center gap-2 ${className || ''}`}>
    <span className='text-muted-foreground text-sm'>Selection mode:</span>
    <div className='flex overflow-hidden rounded-lg border'>
      <Button
        className={`rounded-none ${mode === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
        onClick={() => onModeChange('manual')}
        size='sm'
        type='button'
        variant='ghost'
      >
        Manual Entry
      </Button>
      <Button
        className={`rounded-none ${mode === 'wallet' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
        onClick={() => onModeChange('wallet')}
        size='sm'
        type='button'
        variant='ghost'
      >
        My Tokens
      </Button>
    </div>
  </div>
)
