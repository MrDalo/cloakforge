'use client'

import { startTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { getLogger } from '@/lib/logger/logger'
import { revokeMintAuthorityFormSchema, type RevokeMintAuthorityFormData } from './revokeMintAuthorityFormSchema'
import { FormSections } from './FormSections'
import { useRevokeMintAuthority } from '@/hooks/solana/useRevokeMintAuthority'

const defaultValues: RevokeMintAuthorityFormData = {
  tokenAddress: '',
  confirmed: false,
  tokenInfo: undefined,
}

export const RevokeMintAuthorityForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('revoke-mint-authority')
  const { revokeMintAuthority } = useRevokeMintAuthority()

  const form = useForm<RevokeMintAuthorityFormData>({
    resolver: zodResolver(revokeMintAuthorityFormSchema),
    defaultValues,
    // onSubmit first pass avoids flagging "required" on fields the user hasn't touched yet
    // (e.g. blurring the token picker before selecting anything); onBlur reValidateMode still
    // gives live feedback once they've made a submit attempt or are actively editing a value.
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const logger = getLogger({
    context: 'revoke-mint-authority',
    component: 'RevokeMintAuthorityForm',
  })

  const onSubmit = async (data: RevokeMintAuthorityFormData): Promise<void> => {
    try {
      // Transform form data to hook parameters
      const params = {
        tokenAddress: data.tokenAddress.trim(),
      }

      // Execute the revoke mint authority operation
      const result = await revokeMintAuthority(params)

      if (result) {
        // Reset form on success — deferred to avoid concurrent Controller update (React 19)
        startTransition(() => form.reset(defaultValues))
      }
    } catch (error) {
      logger.error('Form submission failed', error)
      // Error handling is done by the hook (shows error toast)
      // No need to handle errors here
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
