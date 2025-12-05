'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { getLogger } from '@/lib/logger/logger'
import { FreezeFormSchema, type FreezeFormData } from './freezeFormSchema'
import { FormSections } from './FormSections'
import { useFreezeAccounts } from '@/hooks/solana/useFreezeAccounts'

const defaultValues: FreezeFormData = {
  tokenAddress: '',
  freezeMode: 'single',
  targetWallet: '',
  batchWallets: '',
  confirmFreeze: false,
}

export const FreezeForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('freeze-accounts')
  const { freezeWallets } = useFreezeAccounts()

  const form = useForm<FreezeFormData>({
    resolver: zodResolver(FreezeFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  const logger = getLogger({
    context: 'freeze-accounts',
    component: 'FreezeForm',
  })

  const onSubmit = async (data: FreezeFormData): Promise<void> => {
    logger.info('Form submission started', {
      tokenAddress: data.tokenAddress,
      freezeMode: data.freezeMode,
    })

    try {
      const mintAddress = data.tokenAddress.trim()

      // Collect all wallet addresses
      let walletAddresses: string[] = []

      if (data.freezeMode === 'single' && data.targetWallet) {
        walletAddresses = [data.targetWallet.trim()]
      } else if (data.freezeMode === 'batch' && data.batchWallets) {
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
          <form id='freeze-accounts-form' onSubmit={form.handleSubmit(onSubmit)}>
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
