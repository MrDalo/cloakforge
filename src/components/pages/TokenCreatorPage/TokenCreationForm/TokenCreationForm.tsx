'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { FormSections } from './FormSections'
import { TokenCreationSuccess } from './TokenCreationSuccess'
import { TokenCreatorFormSchema, type TokenCreatorFormData } from './tokenCreatorFormSchema'
import type { TokenCreatorResult, UseTokenCreatorReturn } from '@/hooks/solana/useTokenCreatorUnified'

interface TokenCreationFormProps {
  createToken: UseTokenCreatorReturn['createToken']
  isWalletReady: UseTokenCreatorReturn['isWalletReady']
  lastResult: UseTokenCreatorReturn['lastResult']
  reset: UseTokenCreatorReturn['reset']
}

export const TokenCreationForm = ({ createToken, isWalletReady, lastResult, reset }: TokenCreationFormProps): React.ReactNode => {
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

  const handleCreateAnother = (): void => {
    reset() // Reset the hook state to clear lastResult
    form.reset() // Reset the form
  }

  // Show success component if token was created successfully
  if (lastResult?.success) {
    return (
      <UnifiedFormWrapper>
        <TokenCreationSuccess onCreateAnother={handleCreateAnother} result={lastResult as TokenCreatorResult} />
      </UnifiedFormWrapper>
    )
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
            <FormSections connected={isWalletReady} form={form} />
          </UnifiedFormCard>
        </form>
      </Form>
    </UnifiedFormWrapper>
  )
}
