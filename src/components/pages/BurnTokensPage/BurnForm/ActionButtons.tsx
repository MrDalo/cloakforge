'use client'

import { Button } from '@/components/ui/button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Flame, ArrowLeft } from 'lucide-react'

interface ActionButtonsProps {
  isFormValid: boolean
  isLoading: boolean
}

export const ActionButtons = ({ isFormValid, isLoading }: ActionButtonsProps): React.ReactNode => (
  <div className='flex gap-3'>
    <Button className='flex-1' disabled type='button' variant='outline'>
      <ArrowLeft className='mr-2 h-4 w-4' />
      Back
    </Button>
    <Button className='flex-1' disabled={!isFormValid || isLoading} type='submit'>
      {isLoading ?
        <>
          <LoadingSpinner />
          <span className='ml-2'>Burning...</span>
        </>
      : <>
          <Flame className='mr-2 h-4 w-4' />
          Burn Tokens
        </>
      }
    </Button>
  </div>
)
