'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { getLogger } from '@/lib/logger/logger'
import { UnfreezeAccountsFormSchema, type UnfreezeAccountsFormData } from './unfreezeAccountsFormSchema'
import { FormSections } from './FormSections'
import { useUnfreezeAccounts } from '@/hooks/solana/useUnfreezeAccounts'

const defaultValues: UnfreezeAccountsFormData = {
  tokenAddress: '',
  accounts: [],
  batchSize: 10,
}

export const UnfreezeForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('unfreeze-accounts')
  const { unfreezeAccount } = useUnfreezeAccounts()

  const form = useForm<UnfreezeAccountsFormData>({
    resolver: zodResolver(UnfreezeAccountsFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const logger = getLogger({
    context: 'unfreeze-accounts',
    component: 'UnfreezeForm',
  })

  const onSubmit = async (data: UnfreezeAccountsFormData): Promise<void> => {
    logger.info('Form submission started', {
      tokenAddress: data.tokenAddress,
      accountsCount: data.accounts.length,
    })

    try {
      const mintAddress = data.tokenAddress.trim()
      const accounts = data.accounts.filter(Boolean)

      // Process sequentially for now
      for (const account of accounts) {
        await unfreezeAccount({
          tokenAccount: account.trim(),
          mintAddress,
        })
      }

      // Reset form on success
      form.reset(defaultValues)
    } catch (error) {
      logger.error('Form submission failed', error, {
        tokenAddress: data.tokenAddress,
      })
      // Error handling is done by the hook
    }
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
      <UnifiedFormWrapper>
        <Form {...form}>
          <form id='unfreeze-accounts-form' onSubmit={form.handleSubmit(onSubmit)}>
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
