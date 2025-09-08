'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { FormSections } from './FormSections'
import { LiquidityCreatorFormData, LiquidityCreatorFormSchema } from './liquidityCreatorFormSchema'

export const LiquidityCreationForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('create-liquidity')

  const form = useForm<LiquidityCreatorFormData>({
    resolver: zodResolver(LiquidityCreatorFormSchema),
    defaultValues: {
      tokenA: '',
      tokenB: '',
      amountA: '',
      amountB: '',
      dex: '',
      slippageTolerance: '0.5',
      deadline: '20',
      feeTier: '',
      minPrice: '',
      maxPrice: '',
    },
    mode: 'onChange',
  })

  const handleSubmit = (data: LiquidityCreatorFormData): void => {
    // Handle form submission logic here
    // Submit to blockchain
    // TODO: Implement liquidity creation logic with data
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
