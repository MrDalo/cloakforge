'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolConfig } from '@/lib/config/toolConfigs'
import { FormSections } from './FormSections'
import { FreezeFormSchema, type FreezeFormData } from './freezeFormSchema'

export const FreezeForm = (): React.ReactNode => {
  const toolConfig = getToolConfig('freeze-accounts')

  const form = useForm<FreezeFormData>({
    resolver: zodResolver(FreezeFormSchema),
    defaultValues: {
      selectedToken: '',
      freezeMode: 'single',
      targetAccount: '',
      batchAccounts: '',
      confirmFreeze: false,
    },
    mode: 'onChange',
  })

  const handleSubmit = (data: FreezeFormData): void => {
    // Handle form submission logic here
    // Submit to blockchain
    // TODO: Implement freeze logic with data
    void data // Prevent unused variable error until implementation
  }

  return (
    <UnifiedFormWrapper id='freeze-form'>
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
