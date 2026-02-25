'use client'

import { startTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { getLogger } from '@/lib/logger/logger'
import { FreezeFormSchema, type FreezeFormData } from './freezeFormSchema'
import { FormSections } from './FormSections'
import { useFreezeWallets } from '@/hooks/solana/useFreezeWallets'

const defaultValues: FreezeFormData = {
  tokenAddress: '',
  batchWallets: '',
  confirmFreeze: false,
}

export const FreezeForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('freeze-wallets')
  const { freezeWallets } = useFreezeWallets()

  const form = useForm<FreezeFormData>({
    resolver: zodResolver(FreezeFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const logger = getLogger({
    context: 'freeze-wallets',
    component: 'FreezeForm',
  })

  const onSubmit = async (data: FreezeFormData): Promise<void> => {
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

      // Call the batch freeze function
      await freezeWallets({
        walletAddresses,
        mintAddress,
      })

      // Reset form on success — deferred to avoid concurrent Controller update (React 19)
      startTransition(() => form.reset(defaultValues))
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
          <form id='freeze-wallets-form' onSubmit={form.handleSubmit(onSubmit)}>
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
