'use client'

import { startTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { getLogger } from '@/lib/logger/logger'
import { MultisenderFormSchema, type MultisenderFormData } from './multisenderSchema'
import { FormSections } from './FormSections'
import { useTransactionMultisender } from '@/hooks/solana/useTransactionMultisender'
import { isValidSolanaAddress } from '@/lib/solana'

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

      // Parse recipients from input
      const recipients: { address: string; amount: number }[] = []

      if (data.recipientsInput) {
        const lines = data.recipientsInput.split('\n').filter((line) => line.trim())

        for (const line of lines) {
          const parts = line.split(/[\s,]+/).filter(Boolean)
          if (parts.length >= 2) {
            const address = parts[0].trim()
            const amount = parseFloat(parts[1])

            if (isValidSolanaAddress(address) && !isNaN(amount) && amount > 0) {
              recipients.push({ address, amount })
            }
          }
        }
      }

      if (recipients.length === 0) {
        logger.warn('No valid recipients provided')
        return
      }

      // Call the multisender function
      await execute({
        tokenMintAddress: mintAddress,
        recipients,
        decimals: data.tokenInfo?.decimals ?? 9,
      })

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
