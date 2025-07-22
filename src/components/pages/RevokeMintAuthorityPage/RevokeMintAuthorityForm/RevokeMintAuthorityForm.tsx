'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWallet } from '@solana/wallet-adapter-react'
import { motion } from 'framer-motion'
import { Form } from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { revokeMintAuthorityFormSchema, type RevokeMintAuthorityFormData } from './revokeMintAuthorityFormSchema'
import { FormHeader } from './FormHeader'
import { TokenSelectionForm } from './TokenSelectionForm'
import { AuthorityStatusForm } from './AuthorityStatusForm'
import { SupplyImpactForm } from './SupplyImpactForm'
import { ConfirmationForm } from './ConfirmationForm'
import { FeeBreakdown } from './FeeBreakdown'
import { ActionButtons } from './ActionButtons'

const defaultValues: RevokeMintAuthorityFormData = {
  tokenAddress: '',
  understandIrreversible: false,
  confirmRevoke: false,
}

export const RevokeMintAuthorityForm = (): React.ReactNode => {
  const { connected } = useWallet()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RevokeMintAuthorityFormData>({
    resolver: zodResolver(revokeMintAuthorityFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  const {
    handleSubmit,
    control,
    watch,
    formState: { isValid },
  } = form

  const tokenAddress = watch('tokenAddress')
  const understandIrreversible = watch('understandIrreversible')
  const confirmRevoke = watch('confirmRevoke')

  const onSubmit = async (data: RevokeMintAuthorityFormData): Promise<void> => {
    if (!connected) return

    setIsSubmitting(true)
    try {
      // TODO: Implement revoke mint authority logic
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _unused = data
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call
    } catch {
      // TODO: Handle error properly
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBack = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!tokenAddress
      case 2:
        return understandIrreversible && confirmRevoke
      default:
        return false
    }
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} className='mx-auto max-w-4xl' initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
      <Card className='border-secondary/20 bg-card/50 backdrop-blur-sm'>
        <CardContent className='p-8'>
          <Form {...form}>
            <form className='space-y-8' onSubmit={handleSubmit(onSubmit)}>
              <FormHeader />

              {currentStep === 1 && (
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className='space-y-8'
                  initial={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TokenSelectionForm control={control} watch={watch} />
                  {tokenAddress && <AuthorityStatusForm />}
                  {tokenAddress && <SupplyImpactForm />}

                  <div className='flex justify-end'>
                    <button
                      className='bg-secondary hover:bg-secondary/80 rounded-lg px-6 py-2 text-white transition-colors disabled:opacity-50'
                      disabled={!canProceed()}
                      onClick={() => setCurrentStep(2)}
                      type='button'
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className='space-y-8'
                  initial={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ConfirmationForm control={control} />
                  <FeeBreakdown />
                  <ActionButtons isSubmitting={isSubmitting} isValid={isValid && canProceed()} onBack={handleBack} />
                </motion.div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
