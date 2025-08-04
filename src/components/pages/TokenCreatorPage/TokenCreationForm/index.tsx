'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolConfig } from '@/lib/config/toolConfigs'
import { FormSections } from './FormSections'
import { TokenCreatorFormSchema, type TokenCreatorFormData } from './tokenCreatorFormSchema'
import { useTokenCreatorModern, validateTokenCreationRequirements } from '@/hooks/useTokenCreatorModern'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { useState } from 'react'

export const TokenCreationForm = (): React.ReactNode => {
  const toolConfig = getToolConfig('token-creator')
  const { createToken } = useTokenCreatorModern()
  const { connected, publicKey } = useWallet()
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSubmit = async (data: TokenCreatorFormData): Promise<void> => {
    // Validate requirements before submission
    const validation = validateTokenCreationRequirements(data, connected, publicKey)

    if (!validation.valid) {
      toast.error('Validation failed', {
        description: validation.errors.join(', '),
      })
      return
    }

    if (!connected || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }

    try {
      setIsSubmitting(true)

      const result = await createToken(data)

      if (result) {
        // Success - show result
        toast.success('Token created successfully!', {
          description: `Your token has been created. Mint address: ${result.mintAddress}`,
          duration: 15000,
        })

        // Reset form after successful creation
        form.reset()
      }
    } catch (error) {
      // Error handling is done in the hook
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Token creation submission error:', error)
      }
    } finally {
      setIsSubmitting(false)
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
            <FormSections connected={connected} form={form} isSubmitting={isSubmitting} publicKey={publicKey} />
          </UnifiedFormCard>
        </form>
      </Form>
    </UnifiedFormWrapper>
  )
}
