'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/toolConfigs'
import { FormSections } from './FormSections'
import { TokenCreatorFormSchema, type TokenCreatorFormData } from './tokenCreatorFormSchema'
import type { UseTokenCreatorReturn } from '@/hooks/useTokenCreatorUnified'

interface TokenCreationFormProps {
  createToken: UseTokenCreatorReturn['createToken']
  isExecuting: UseTokenCreatorReturn['isExecuting']
  isWalletReady: UseTokenCreatorReturn['isWalletReady']
}

export const TokenCreationForm = ({ createToken, isExecuting, isWalletReady }: TokenCreationFormProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('token-creator')

  const form = useForm<TokenCreatorFormData>({
    resolver: zodResolver(TokenCreatorFormSchema),
    defaultValues: {
      name: '',
      symbol: '',
      description: '',
      totalSupply: '',
      decimals: '9',
      immutable: false,
      revokeMintAuthority: false,
      revokeFreezeAuthority: false,
      website: '',
      twitter: '',
      telegram: '',
      discord: '',
      logo: undefined,
    },
    mode: 'onBlur',
  })

  const handleSubmit = async (data: TokenCreatorFormData): Promise<void> => {
    const result = await createToken(data)
    if (result) {
      // Reset form after successful creation
      form.reset()
    }
  }

  return (
    <UnifiedFormWrapper>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <UnifiedFormCard
            header={{
              icon: toolConfig.icon,
              title: toolConfig.title,
              variant: toolConfig.variant,
            }}
            variant={toolConfig.variant}
          >
            <FormSections connected={isWalletReady} form={form} isSubmitting={isExecuting} />
          </UnifiedFormCard>
        </form>
      </Form>
    </UnifiedFormWrapper>
  )
}
