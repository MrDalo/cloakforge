'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useLiquidityProvider } from '@/hooks/solana/useLiquidityProvider'
import { useToolConfiguration } from '@/components/common/ToolActionButton/ToolActionButton'
import { FormSections } from './FormSections'
import { type LiquidityProviderFormData, LiquidityProviderFormSchema } from './liquidityProviderFormSchema'
import type { z } from 'zod'

type LiquidityProviderFormInput = z.input<typeof LiquidityProviderFormSchema>

export const LiquidityProviderForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('liquidity-provider')
  const { provideLiquidity, isExecuting } = useLiquidityProvider()

  // Get tool configuration from Contentful
  const { fees } = useToolConfiguration('liquidity-provider')

  const form = useForm<LiquidityProviderFormInput, undefined, LiquidityProviderFormData>({
    resolver: zodResolver(LiquidityProviderFormSchema),
    defaultValues: {
      poolType: 'CPMM',
      tokenA: '',
      tokenB: 'SOL',
      customTokenB: '',
      amountA: '',
      amountB: '',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      minPrice: '',
      maxPrice: '',
      deadline: '20',
      platformFee: fees?.baseFee?.toString() || '0.1', // Use Contentful fee if available
    },
    mode: 'onBlur',
  })

  const handleSubmit = (data: LiquidityProviderFormData): void => {
    void provideLiquidity(data)
  }

  return (
    <UnifiedFormWrapper>
      <Form {...form}>
        <form id='liquidity-provider-form' onSubmit={form.handleSubmit(handleSubmit)}>
          <UnifiedFormCard
            header={{
              icon: toolConfig.icon,
              title: toolConfig.title,
              variant: toolConfig.variant,
            }}
            variant={toolConfig.variant}
          >
            <FormSections form={form} isLoading={isExecuting} />
          </UnifiedFormCard>
        </form>
      </Form>
    </UnifiedFormWrapper>
  )
}
