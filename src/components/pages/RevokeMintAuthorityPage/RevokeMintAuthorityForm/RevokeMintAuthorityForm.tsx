'use client'

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
  understandIrreversible: false,
  confirmRevoke: false,
  tokenInfo: undefined,
}

export const RevokeMintAuthorityForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('revoke-mint-authority')
  const { revokeMintAuthority } = useRevokeMintAuthority()

  const form = useForm<RevokeMintAuthorityFormData>({
    resolver: zodResolver(revokeMintAuthorityFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const logger = getLogger({
    context: 'revoke-mint-authority',
    component: 'RevokeMintAuthorityForm',
  })

  const onSubmit = async (data: RevokeMintAuthorityFormData): Promise<void> => {
    logger.info('Form submission started', {
      tokenAddress: data.tokenAddress,
      confirmedRevoke: data.confirmRevoke,
      understandsIrreversible: data.understandIrreversible,
    })

    try {
      // Transform form data to hook parameters
      const params = {
        tokenAddress: data.tokenAddress.trim(),
      }

      // Execute the revoke mint authority operation
      const result = await revokeMintAuthority(params)

      if (result) {
        logger.info('Revoke mint authority completed successfully', {
          signature: result.signature,
          tokenAddress: result.tokenAddress,
        })

        // Reset form on success
        form.reset(defaultValues)
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
