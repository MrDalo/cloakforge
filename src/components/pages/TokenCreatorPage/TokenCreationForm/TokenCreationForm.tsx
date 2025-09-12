'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { FormSections } from './FormSections'
import { TokenCreationSuccess } from './TokenCreationSuccess'
import { TokenCreatorFormSchema, type TokenCreatorFormData } from './tokenCreatorFormSchema'
import type { useTokenCreator } from '@/hooks/solana/useTokenCreator'
import { TokenCreatorResult } from '@/types/tokenCreator'

interface TokenCreationFormProps {
  createToken: ReturnType<typeof useTokenCreator>['createToken']
  isWalletReady: ReturnType<typeof useTokenCreator>['isWalletReady']
  lastResult: ReturnType<typeof useTokenCreator>['lastResult']
  reset: ReturnType<typeof useTokenCreator>['reset']
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
    // Transform form data to match the hook's TokenCreatorParams interface
    const tokenParams = {
      name: data.name,
      symbol: data.symbol,
      description: data.description || undefined,
      decimals: parseInt(data.decimals),
      totalSupply: parseFloat(data.totalSupply),
      // Use the form fields directly (no more transformation needed)
      immutable: data.immutable,
      revokeFreezeAuthority: data.revokeFreezeAuthority,
      revokeMintAuthority: data.revokeMintAuthority,
      // Include metadata fields
      website: data.website || undefined,
      twitter: data.twitter || undefined,
      telegram: data.telegram || undefined,
      discord: data.discord || undefined,
      logo: data.logo || undefined, // File object for IPFS upload
    }

    const result = await createToken(tokenParams)
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
  if (lastResult) {
    return (
      <UnifiedFormWrapper>
        <TokenCreationSuccess onCreateAnother={handleCreateAnother} result={lastResult as TokenCreatorResult} />
      </UnifiedFormWrapper>
    )
  }

  return (
    <UnifiedFormWrapper>
      <Form {...form}>
        <form id='create-token-form' onSubmit={form.handleSubmit(handleSubmit)}>
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
