'use client'

import { startTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { getLogger } from '@/lib/logger/logger'
import { toast } from 'sonner'
import { MultisenderFormSchema, TOKEN_NOT_VALIDATED_MESSAGE, isTokenValidated, type MultisenderFormData } from './multisenderSchema'
import { FormSections } from './FormSections'
import { parseRecipients, formatRecipients } from './parseRecipients'
import { useTransactionMultisender } from '@/hooks/solana/useTransactionMultisender'

const defaultValues: MultisenderFormData = {
  tokenAddress: '',
  recipientsInput: '',
  confirmSend: false,
}

export const MultisenderForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('transaction-multisender')
  const { execute } = useTransactionMultisender()

  const form = useForm<MultisenderFormData>({
    resolver: zodResolver(MultisenderFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const logger = getLogger({
    context: 'transaction-multisender',
    component: 'MultisenderForm',
  })

  const onSubmit = async (data: MultisenderFormData): Promise<void> => {
    try {
      const mintAddress = data.tokenAddress.trim()

      // The token metadata (decimals) must have been resolved for the address being sent —
      // never fall back to an assumed decimals value for a token transfer.
      if (!isTokenValidated(data) || !data.tokenInfo) {
        toast.error(TOKEN_NOT_VALIDATED_MESSAGE)
        return
      }

      const { recipients, invalidLines } = parseRecipients(data.recipientsInput)

      if (recipients.length === 0) {
        logger.warn('No valid recipients provided')
        toast.error('No valid recipients — check the address and amount on each line')
        return
      }

      if (invalidLines.length > 0) {
        // Invalid lines are shown in the form; they are excluded from the send
        logger.warn('Skipping invalid recipient lines', undefined, { count: invalidLines.length })
      }

      // Call the multisender function (returns null when the send failed or was rejected)
      const result = await execute({
        tokenMintAddress: mintAddress,
        recipients,
        decimals: data.tokenInfo.decimals,
      })

      if (!result) {
        // Keep the user's input so the send can be retried after fixing the problem
        return
      }

      if (result.failedRecipients > 0) {
        // Keep only the recipients that were not sent so a retry cannot pay anyone twice
        toast.warning(
          `${result.failedRecipients} of ${recipients.length} recipients were not sent — they were kept in the form for a retry.`
        )
        startTransition(() => {
          form.setValue('recipientsInput', formatRecipients(result.failedRecipientList), { shouldValidate: true })
          form.setValue('confirmSend', false)
        })
        return
      }

      // Reset form on success — deferred to avoid concurrent Controller update (React 19)
      startTransition(() => form.reset(defaultValues))
    } catch (error) {
      logger.error('Form submission failed', error)
      // Error handling is done by the hook (shows error toast)
    }
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
      <UnifiedFormWrapper>
        <Form {...form}>
          <form id='multisender-form' onSubmit={form.handleSubmit(onSubmit)}>
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
