'use client'

import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { useLiquidityProvider } from '@/hooks/solana/useLiquidityProvider'
import { FormSections } from './FormSections'
import { PendingPositionNotice } from './PendingPositionNotice'
import { DEFAULT_FEE_TIER, type LiquidityProviderFormData, LiquidityProviderFormSchema } from './liquidityProviderFormSchema'
import type { z } from 'zod'

type LiquidityProviderFormInput = z.input<typeof LiquidityProviderFormSchema>

export const LiquidityProviderForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('liquidity-provider')
  const { provideLiquidity, isExecuting, pendingPosition, openPositionInExistingPool, dismissPendingPosition } = useLiquidityProvider()

  const form = useForm<LiquidityProviderFormInput, undefined, LiquidityProviderFormData>({
    resolver: zodResolver(LiquidityProviderFormSchema),
    defaultValues: {
      poolType: 'CPMM',
      tokenA: '',
      tokenB: 'SOL',
      customTokenB: '',
      amountA: '',
      amountB: '',
      feeTier: DEFAULT_FEE_TIER,
      slippageTolerance: '0.5',
      minPrice: '',
      maxPrice: '',
      initialPrice: '',
    },
    mode: 'onBlur',
  })

  const slippageTolerance = useWatch({ control: form.control, name: 'slippageTolerance', defaultValue: '0.5' })

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
      {pendingPosition && (
        <PendingPositionNotice
          isExecuting={isExecuting}
          onDismiss={dismissPendingPosition}
          onOpenPosition={(slippage) => void openPositionInExistingPool(slippage)}
          pendingPosition={pendingPosition}
          slippageTolerance={slippageTolerance ?? '0.5'}
        />
      )}
    </UnifiedFormWrapper>
  )
}
