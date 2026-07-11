'use client'

import { type FieldValues } from 'react-hook-form'
import WalletConnectionButton from '@/components/common/WalletConnectionButton/WalletConnectionButton'
import { ToolActionButton } from '@/components/common/ToolActionButton'
import { type UnifiedActionButtonsProps, type GradientVariant } from './types'
import { useWallet } from '@solana/wallet-adapter-react'

const buttonVariants: Record<GradientVariant, string> = {
  primary: 'bg-primary hover:bg-primary-hover text-primary-foreground',
  info: 'bg-info hover:bg-info/80 text-info-foreground',
  warning: 'bg-warning hover:bg-warning text-warning-foreground',
  danger: 'bg-destructive hover:bg-destructive text-destructive-foreground',
  success: 'bg-success hover:bg-success/80 text-success-foreground',
  emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white',
}

export const UnifiedActionButtons = <T extends FieldValues>({
  form,
  submitConfig,
  customValidation = false,
  toolId,
}: UnifiedActionButtonsProps<T>): React.ReactNode => {
  const variant = submitConfig.variant || 'primary'
  const buttonClass = buttonVariants[variant]
  const { publicKey } = useWallet()

  const formState = form.formState
  const isFormValid = customValidation || formState.isValid
  const isSubmitting = formState.isSubmitting

  const submitText = submitConfig.text

  return (
    <div className='space-y-4'>
      {!publicKey ? (
        <div className='text-center'>
          <p className='text-muted-foreground mb-4 text-sm'>Connect your wallet to continue</p>
          <WalletConnectionButton />
        </div>
      ) : (
        <div className='space-y-3'>
          <ToolActionButton
            className={`${buttonClass} w-full rounded-xl py-4 shadow-lg transition-all duration-300 hover:shadow-xl`}
            disabled={!isFormValid}
            isLoading={isSubmitting}
            size='lg'
            toolId={toolId}
            type='submit'
          >
            <submitConfig.icon className='mr-3 h-5 w-5' />
            {isSubmitting ? submitConfig.loadingText : submitText}
          </ToolActionButton>
        </div>
      )}
    </div>
  )
}
