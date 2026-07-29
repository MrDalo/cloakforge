'use client'

import { startTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { getLogger } from '@/lib/logger/logger'
import { updateMetadataFormSchema, type UpdateMetadataFormData } from './updateMetadataFormSchema'
import { FormSections } from './FormSections'
import type { useUpdateMetadata } from '@/hooks/solana/useUpdateMetadata'

const defaultValues: UpdateMetadataFormData = {
  tokenAddress: '',
  tokenInfo: undefined,
  name: '',
  symbol: '',
  description: '',
  website: '',
  twitter: '',
  telegram: '',
  discord: '',
  logo: undefined,
  currentLogoUrl: '',
}

interface UpdateMetadataFormProps {
  updateMetadata: ReturnType<typeof useUpdateMetadata>['updateMetadata']
}

export const UpdateMetadataForm = ({ updateMetadata }: UpdateMetadataFormProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('update-metadata')

  const form = useForm<UpdateMetadataFormData>({
    resolver: zodResolver(updateMetadataFormSchema),
    defaultValues,
    // onSubmit first pass avoids flagging "required" on fields the user hasn't touched yet
    // (e.g. blurring the token picker before selecting anything); onBlur reValidateMode still
    // gives live feedback once they've made a submit attempt or are actively editing a value.
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const logger = getLogger({
    context: 'update-metadata',
    component: 'UpdateMetadataForm',
  })

  const onSubmit = async (data: UpdateMetadataFormData): Promise<void> => {
    try {
      const result = await updateMetadata({
        tokenAddress: data.tokenAddress.trim(),
        name: data.name.trim(),
        symbol: data.symbol.trim().toUpperCase(),
        description: data.description || undefined,
        website: data.website || undefined,
        twitter: data.twitter || undefined,
        telegram: data.telegram || undefined,
        discord: data.discord || undefined,
        logo: data.logo || undefined,
        currentLogoUrl: data.currentLogoUrl || undefined,
        original: {
          name: data.tokenInfo?.name,
          symbol: data.tokenInfo?.symbol,
          description: data.tokenInfo?.originalDescription,
          website: data.tokenInfo?.originalWebsite,
          twitter: data.tokenInfo?.originalTwitter,
          telegram: data.tokenInfo?.originalTelegram,
          discord: data.tokenInfo?.originalDiscord,
        },
      })

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
          <form id='update-metadata-form' onSubmit={form.handleSubmit(onSubmit)}>
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
