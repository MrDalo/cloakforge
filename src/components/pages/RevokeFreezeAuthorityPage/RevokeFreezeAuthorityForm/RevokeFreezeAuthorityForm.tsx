'use client'

import { startTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { getLogger } from '@/lib/logger/logger'
import { revokeFreezeAuthorityFormSchema, type RevokeFreezeAuthorityFormData } from './revokeFreezeAuthorityFormSchema'
import { FormSections } from './FormSections'
import { useRevokeFreezeAuthority } from '@/hooks/solana/useRevokeFreezeAuthority'

const defaultValues: RevokeFreezeAuthorityFormData = {
  tokenAddress: '',
  confirmed: false,
  tokenInfo: undefined,
}

export const RevokeFreezeAuthorityForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('revoke-freeze-authority')
  const { revokeFreezeAuthority } = useRevokeFreezeAuthority()

  const form = useForm<RevokeFreezeAuthorityFormData>({
    resolver: zodResolver(revokeFreezeAuthorityFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const logger = getLogger({
    context: 'revoke-freeze-authority',
    component: 'RevokeFreezeAuthorityForm',
  })

  const onSubmit = async (data: RevokeFreezeAuthorityFormData): Promise<void> => {
    logger.info('Form submission started', {
      tokenAddress: data.tokenAddress,
      confirmed: data.confirmed,
    })

    try {
      // Transform form data to hook parameters
      const params = {
        tokenAddress: data.tokenAddress.trim(),
      }

      // Execute the revoke freeze authority operation
      const result = await revokeFreezeAuthority(params)

      if (result) {
        logger.info('Revoke freeze authority completed successfully', {
          signature: result.signature,
          tokenAddress: result.tokenAddress,
        })

        // Reset form on success — deferred to avoid concurrent Controller update (React 19)
        startTransition(() => form.reset(defaultValues))
      }
    } catch (error) {
      logger.error('Form submission failed', error, {
        tokenAddress: data.tokenAddress,
      })
      // Error handling is done by the hook (shows error toast)
      // No need to handle errors here
    }
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
      <UnifiedFormWrapper>
        <Form {...form}>
          <form id='revoke-freeze-authority-form' onSubmit={form.handleSubmit(onSubmit)}>
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
