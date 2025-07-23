'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolConfig } from '@/lib/config/toolConfigs'
import { FormSections } from './FormSections'
import { TokenCreatorFormSchema, type TokenCreatorFormData } from './tokenCreatorFormSchema'

export const TokenCreationForm = (): React.ReactNode => {
  const toolConfig = getToolConfig('token-creator')

  const form = useForm<TokenCreatorFormData>({
    resolver: zodResolver(TokenCreatorFormSchema),
    defaultValues: {
      name: '',
      symbol: '',
      description: '',
      totalSupply: '',
      decimals: '9',
      revokeMintAuthority: false,
      revokeUpdateAuthority: false,
      website: '',
      twitter: '',
      telegram: '',
      discord: '',
      logo: undefined,
    },
    mode: 'onChange',
  })

  const handleSubmit = (data: TokenCreatorFormData): void => {
    // Handle form submission logic here
    // Submit to blockchain
    // TODO: Implement token creation logic with data
    void data // Prevent unused variable error until implementation
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
            <FormSections form={form} />
          </UnifiedFormCard>
        </form>
      </Form>
    </UnifiedFormWrapper>
  )
}
