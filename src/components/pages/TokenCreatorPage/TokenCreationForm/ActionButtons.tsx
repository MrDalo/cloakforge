'use client'

import { UseFormReturn } from 'react-hook-form'
import { Wallet, Coins, Code } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TokenCreatorFormData } from './tokenCreatorFormSchema'

interface ActionButtonsProps {
  form: UseFormReturn<TokenCreatorFormData>
  isConnected: boolean
  setIsConnected: React.Dispatch<React.SetStateAction<boolean>>
}

export const ActionButtons = ({ form, isConnected, setIsConnected }: ActionButtonsProps): React.ReactNode => {
  const fees = { creation: 0.001, metadata: 0.0005, total: 0.0015 } // Sample fee calculation

  return (
    <div className='space-y-4'>
      {!isConnected ? (
        <Button
          className='bg-primary hover:bg-primary-hover text-primary-foreground w-full rounded-xl py-4 shadow-lg transition-all duration-300 hover:shadow-xl'
          onClick={() => setIsConnected(true)}
          size='lg'
          type='button'
        >
          <Wallet className='mr-3 h-5 w-5' />
          Connect Wallet to Continue
        </Button>
      ) : (
        <div className='space-y-3'>
          <Button
            className='bg-primary hover:bg-primary-hover text-primary-foreground w-full rounded-xl py-4 shadow-lg transition-all duration-300 hover:shadow-xl'
            disabled={form.formState.isSubmitting || !form.formState.isValid}
            size='lg'
            type='submit'
          >
            <Coins className='mr-3 h-5 w-5' />
            {form.formState.isSubmitting ? 'Creating Token...' : `Create Token (~${fees.total} SOL)`}
          </Button>

          <Button
            className='border-border text-muted-foreground hover:bg-muted/50 w-full rounded-xl border py-3'
            size='lg'
            type='button'
            variant='outline'
          >
            <Code className='mr-3 h-4 w-4' />
            Preview Transaction
          </Button>
        </div>
      )}
    </div>
  )
}
