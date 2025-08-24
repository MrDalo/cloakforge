'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/toolConfigs'
import { FormSections } from './FormSections'
import { burnTokensFormSchema, type BurnTokensFormData } from './burnTokensFormSchema'

interface BurnFormProps {
  onSubmit: (data: BurnTokensFormData) => void
  isLoading?: boolean
}

export const BurnForm = ({ onSubmit, isLoading = false }: BurnFormProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('burn-tokens')

  const form = useForm<BurnTokensFormData>({
    resolver: zodResolver(burnTokensFormSchema),
    defaultValues: {
      tokenAddress: '',
      burnAmount: 0,
      confirmed: false,
      tokenInfo: undefined,
    },
  })

  return (
    <UnifiedFormWrapper>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <UnifiedFormCard
            header={{
              icon: toolConfig.icon,
              title: toolConfig.title,
              variant: toolConfig.variant,
            }}
            variant={toolConfig.variant}
          >
            <FormSections form={form} isLoading={isLoading} />
          </UnifiedFormCard>
        </form>
      </Form>
    </UnifiedFormWrapper>
  )
}
