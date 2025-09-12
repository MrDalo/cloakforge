'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { revokeMintAuthorityFormSchema, type RevokeMintAuthorityFormData } from './revokeMintAuthorityFormSchema'
import { FormSections } from './FormSections'

const defaultValues: RevokeMintAuthorityFormData = {
  tokenAddress: '',
  understandIrreversible: false,
  confirmRevoke: false,
}

export const RevokeMintAuthorityForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('revoke-mint-authority')

  const form = useForm<RevokeMintAuthorityFormData>({
    resolver: zodResolver(revokeMintAuthorityFormSchema),
    defaultValues,
    mode: 'onChange',
  })

  const onSubmit = async (data: RevokeMintAuthorityFormData): Promise<void> => {
    try {
      // TODO: Implement revoke mint authority logic
      void data
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate API call
    } catch (error) {
      // TODO: Handle error properly
      void error
    }
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
      <UnifiedFormWrapper>
        <Form {...form}>
          <form id='revoke-mint-authority-form' onSubmit={form.handleSubmit(onSubmit)}>
            <UnifiedFormCard
              header={{
                icon: toolConfig.icon,
                title: toolConfig.title,
                variant: toolConfig.variant,
              }}
              variant={toolConfig.variant}
            >
              <FormSections form={form} />
            </UnifiedFormCard>
          </form>
        </Form>
      </UnifiedFormWrapper>
    </motion.div>
  )
}
