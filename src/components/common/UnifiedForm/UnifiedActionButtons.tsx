'use client'

import { type FieldValues, useFormState } from 'react-hook-form'
import WalletConnectionButton from '@/components/common/WalletConnectionButton/WalletConnectionButton'
import { ToolActionButton } from '@/components/common/ToolActionButton'
import { ConsentCheckbox } from '@/components/common/ConsentCheckbox'
import { ReceiptDownload } from '@/components/common/ReceiptDownload'
import { isConsentValid, useComplianceStore } from '@/lib/compliance/consentStore'
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
  requiresConsent = true,
}: UnifiedActionButtonsProps<T>): React.ReactNode => {
  const variant = submitConfig.variant || 'primary'
  const buttonClass = buttonVariants[variant]
  const { publicKey } = useWallet()

  const { isValid, isSubmitting } = useFormState({ control: form.control })
  const isFormValid = customValidation || isValid

  const consent = useComplianceStore((state) => state.consents[toolId])
  const armConsent = useComplianceStore((state) => state.armConsent)
  const hasConsent = !requiresConsent || isConsentValid(consent, publicKey?.toString())

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
          {requiresConsent && <ConsentCheckbox toolId={toolId} />}
          <ToolActionButton
            className={`${buttonClass} w-full rounded-xl py-4 shadow-lg transition-all duration-300 hover:shadow-xl`}
            disabled={!isFormValid || !hasConsent}
            isLoading={isSubmitting}
            // Remember which action is being signed so its confirmed signature joins the right receipt
            onClick={() => armConsent(toolId)}
            size='lg'
            toolId={toolId}
            type='submit'
          >
            <submitConfig.icon className='mr-3 h-5 w-5' />
            {isSubmitting ? submitConfig.loadingText : submitText}
          </ToolActionButton>
          {requiresConsent && <ReceiptDownload toolId={toolId} />}
        </div>
      )}
    </div>
  )
}
