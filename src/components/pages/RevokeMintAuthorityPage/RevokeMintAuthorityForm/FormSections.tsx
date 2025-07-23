import { UseFormReturn } from 'react-hook-form'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Code } from 'lucide-react'
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

  const isCustomValid = canProceed()

  return (
    <div className='space-y-8'>
      {currentStep === 1 && (
        <motion.div animate={{ opacity: 1, x: 0 }} className='space-y-8' initial={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
          <TokenSelectionForm control={form.control} watch={form.watch} />
          {tokenAddress && <AuthorityStatusForm />}
          {tokenAddress && <SupplyImpactForm />}

          <div className='flex justify-end'>
            <button
              className='bg-secondary hover:bg-secondary/80 rounded-lg px-6 py-2 text-white transition-colors disabled:opacity-50'
              disabled={!canProceed()}
              onClick={handleNext}
              type='button'
            >
              Continue
            </button>
          </div>
        </motion.div>
      )}

      {currentStep === 2 && (
        <motion.div animate={{ opacity: 1, x: 0 }} className='space-y-8' initial={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
          <ConfirmationForm control={form.control} />
          <FeeBreakdown />

          <div className='flex gap-4'>
            <button
              className='border-border text-muted-foreground hover:bg-muted/50 flex-1 rounded-xl border py-3'
              onClick={handleBack}
              type='button'
            >
              Back
            </button>
            <div className='flex-1'>
              <UnifiedActionButtons
                customValidation={isCustomValid}
                form={form}
                previewConfig={
                  toolConfig.showPreview && toolConfig.previewText
                    ? {
                        text: toolConfig.previewText,
                        icon: Code,
                      }
                    : undefined
                }
                showPreview={toolConfig.showPreview}
                submitConfig={{
                  text: toolConfig.submitText,
                  loadingText: toolConfig.loadingText,
                  icon: toolConfig.icon,
                  variant: toolConfig.variant,
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
