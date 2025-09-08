'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { FormSections } from './FormSections'
import { MultisenderFormSchema, type MultisenderFormData } from './multisenderFormSchema'

export const MultisenderForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('transaction-multisender')

  const form = useForm<MultisenderFormData>({
    resolver: zodResolver(MultisenderFormSchema),
    defaultValues: {
      selectedToken: '',
      inputMode: 'manual',
      recipients: [{ address: '', amount: '' }],
      csvData: '',
      priorityFee: false,
      confirmSend: false,
    },
    mode: 'onChange',
  })

  const handleSubmit = (data: MultisenderFormData): void => {
    // Handle form submission logic here
    // Submit to blockchain
    // TODO: Implement multisender logic with data
    void data // Prevent unused variable error until implementation
  }

  return (
    <UnifiedFormWrapper id='multisender-form'>
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
