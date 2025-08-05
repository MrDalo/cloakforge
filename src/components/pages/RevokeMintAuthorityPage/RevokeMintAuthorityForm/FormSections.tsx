import { UseFormReturn } from 'react-hook-form'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { UnifiedActionButtons } from '@/components/common'
import { getToolConfig } from '@/lib/config/toolConfigs'
import { TokenSelectionForm } from './TokenSelectionForm'
import { AuthorityStatusForm } from './AuthorityStatusForm'
import { SupplyImpactForm } from './SupplyImpactForm'
import { ConfirmationForm } from './ConfirmationForm'
import { FeeBreakdown } from './FeeBreakdown'
import { RevokeMintAuthorityFormData } from './revokeMintAuthorityFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<RevokeMintAuthorityFormData>
}

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolConfig('revoke-mint-authority')
  const [currentStep, setCurrentStep] = useState(1)

  const tokenAddress = form.watch('tokenAddress')
  const understandIrreversible = form.watch('understandIrreversible')
  const confirmRevoke = form.watch('confirmRevoke')

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return Boolean(tokenAddress)
      case 2:
        return understandIrreversible && confirmRevoke
      default:
        return false
    }
  }

  const handleBack = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNext = (): void => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  return (
    <div className='space-y-8'>
      {currentStep === 1 && (
        <motion.div animate={{ opacity: 1, x: 0 }} className='space-y-8' initial={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
          <TokenSelectionForm control={form.control} watch={form.watch} />
          {tokenAddress && <AuthorityStatusForm />}
          {tokenAddress && <SupplyImpactForm />}

          <div className='flex justify-end'>
            <Button disabled={!canProceed()} onClick={handleNext} size='lg' type='button' variant='default'>
              Continue to Confirmation
            </Button>
          </div>
        </motion.div>
      )}

      {currentStep === 2 && (
        <motion.div animate={{ opacity: 1, x: 0 }} className='space-y-8' initial={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
          <ConfirmationForm control={form.control} />
          <FeeBreakdown />

          <div className='flex flex-col gap-4'>
            <div className='flex-1'>
              <UnifiedActionButtons
                customValidation={canProceed()}
                form={form}
                submitConfig={{
                  text: toolConfig.submitText,
                  loadingText: toolConfig.loadingText,
                  icon: toolConfig.icon,
                  variant: toolConfig.variant,
                }}
                toolId='revoke-mint-authority'
              />
            </div>
            <div className='flex flex-1 items-center justify-center'>
              <Button onClick={handleBack} size='lg' type='button' variant='outline'>
                Back to Selection
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
