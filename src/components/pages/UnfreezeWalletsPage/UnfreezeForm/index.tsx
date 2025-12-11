'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { getLogger } from '@/lib/logger/logger'
import { UnfreezeWalletsFormSchema, type UnfreezeWalletsFormData } from './unfreezeWalletsFormSchema'
import { FormSections } from './FormSections'
import { useUnfreezeWallets } from '@/hooks/solana/useUnfreezeWallets'

const defaultValues: UnfreezeWalletsFormData = {
  tokenAddress: '',
  batchWallets: '',
  confirmUnfreeze: false,
}

export const UnfreezeForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('unfreeze-wallets')
  const { unfreezeWallets } = useUnfreezeWallets()

  const form = useForm<UnfreezeWalletsFormData>({
    resolver: zodResolver(UnfreezeWalletsFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const logger = getLogger({
    context: 'unfreeze-wallets',
    component: 'UnfreezeForm',
  })

  const onSubmit = async (data: UnfreezeWalletsFormData): Promise<void> => {
    logger.info('Form submission started', {
      tokenAddress: data.tokenAddress,
    })

    try {
      const mintAddress = data.tokenAddress.trim()

      // Collect all wallet addresses
      let walletAddresses: string[] = []

      if (data.batchWallets) {
        walletAddresses = data.batchWallets
          .split(/,?\n/)
          .map((addr) => addr.trim())
          .filter(Boolean)
      }

      if (walletAddresses.length === 0) {
        logger.error('No wallet addresses provided')
        return
      }

      // Call the batch unfreeze function
      await unfreezeWallets({
        walletAddresses,
        mintAddress,
      })

      // Reset form on success
      form.reset(defaultValues)
    } catch (error) {
      logger.error('Form submission failed', error, {
        tokenAddress: data.tokenAddress,
      })
      // Error handling is done by the hook (shows error toast)
    }
  }

  return (
    <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }}>
      <UnifiedFormWrapper>
        <Form {...form}>
          <form id='unfreeze-wallets-form' onSubmit={form.handleSubmit(onSubmit)}>
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
