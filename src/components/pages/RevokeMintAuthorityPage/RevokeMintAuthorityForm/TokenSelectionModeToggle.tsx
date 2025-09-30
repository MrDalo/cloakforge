'use client'

import { Button } from '@/components/ui/button'
import { Shield, Wallet } from 'lucide-react'

interface TokenSelectionModeToggleProps {
  selectionMode: 'wallet' | 'manual'
  onModeSwitch: (mode: 'wallet' | 'manual') => void
}

export const TokenSelectionModeToggle = ({ selectionMode, onModeSwitch }: TokenSelectionModeToggleProps): React.ReactNode => (
  <div className='flex flex-col items-center justify-between gap-3 sm:flex-row'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Shield className='text-warning-foreground/80 h-5 w-5' />
      <span>Token Selection</span>
    </h3>

    <div className='flex gap-2'>
      <Button
        className='flex items-center gap-2'
        onClick={() => onModeSwitch('wallet')}
        size='sm'
        type='button'
        variant={selectionMode === 'wallet' ? 'default' : 'outline'}
      >
        <Wallet className='h-4 w-4' />
        My Tokens
      </Button>
      <Button onClick={() => onModeSwitch('manual')} size='sm' type='button' variant={selectionMode === 'manual' ? 'default' : 'outline'}>
        Manual Entry
      </Button>
    </div>
  </div>
)
