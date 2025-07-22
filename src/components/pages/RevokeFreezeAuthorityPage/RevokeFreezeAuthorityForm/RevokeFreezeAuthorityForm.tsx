/* eslint-disable react/jsx-max-depth */
import { FormProvider, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormHeader } from './FormHeader'
import { TokenSelectionForm } from './TokenSelectionForm'
import { AuthorityStatusForm } from './AuthorityStatusForm'
import { ConfirmationForm } from './ConfirmationForm'
import { FeeBreakdown } from './FeeBreakdown'
import { ActionButtons } from './ActionButtons'
import { revokeFreezeAuthorityFormSchema, RevokeFreezeAuthorityFormData } from './revokeFreezeAuthorityFormSchema'
import { motion } from 'framer-motion'
import { useState } from 'react'

export const RevokeFreezeAuthorityForm = (): React.ReactNode => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const form = useForm<RevokeFreezeAuthorityFormData>({
    resolver: zodResolver(revokeFreezeAuthorityFormSchema),
    defaultValues: {
      tokenAddress: '',
      understandIrreversible: false,
      confirmRevoke: false,
    },
  })

  const handleSubmit = async (data: RevokeFreezeAuthorityFormData): Promise<void> => {
    setIsSubmitting(true)
    try {
      // TODO: Implement revoke freeze authority logic
      console.log('Revoking freeze authority for:', data.tokenAddress)
      await new Promise((resolve) => setTimeout(resolve, 2000))
    } catch (error) {
      // Error handling
      console.error('Failed to revoke freeze authority:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const watchedTokenAddress = form.watch('tokenAddress')
  const watchedConfirmations = form.watch(['understandIrreversible', 'confirmRevoke'])
  const isFormValid = Boolean(watchedTokenAddress) && watchedConfirmations.every(Boolean)

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className='mx-auto max-w-4xl space-y-8'
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <Card className='border-border bg-card border-2 shadow-xl'>
            <CardHeader className='from-secondary/5 to-secondary/10 border-border border-b bg-gradient-to-r'>
              <CardTitle className='text-center'>
                <FormHeader />
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-8 p-8'>
              <TokenSelectionForm control={form.control} watch={form.watch} />
              {watchedTokenAddress && <AuthorityStatusForm tokenMint={watchedTokenAddress} />}
              <ConfirmationForm control={form.control} />
              <FeeBreakdown />
              <ActionButtons
                isConnected={isConnected}
                isFormValid={isFormValid}
                isSubmitting={isSubmitting}
                onConnectWallet={() => setIsConnected(true)}
              />
            </CardContent>
          </Card>
        </form>
      </Form>
    </motion.div>
  )
}
