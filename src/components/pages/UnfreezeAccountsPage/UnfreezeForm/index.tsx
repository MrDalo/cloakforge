'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { RefreshCw } from 'lucide-react'
import { FormSections } from './FormSections'
import { UnfreezeAccountsFormSchema } from './unfreezeAccountsFormSchema'

export const UnfreezeForm = (): React.ReactNode => {
  const form = useForm({
    resolver: zodResolver(UnfreezeAccountsFormSchema),
    defaultValues: {
      tokenMint: '',
      accounts: [],
      batchSize: 5,
    },
    mode: 'onChange',
  })

  const handleSubmit = (data: unknown): void => {
    // Handle form submission logic here
    // Submit to blockchain
    // TODO: Implement account unfreezing logic with data
    void data // Prevent unused variable error until implementation
  }

  return (
    <UnifiedFormWrapper>
      <Form {...form}>
        <form id='unfreeze-accounts-form' onSubmit={form.handleSubmit(handleSubmit)}>
          <UnifiedFormCard
            header={{
              icon: RefreshCw,
              title: 'Unfreeze Accounts',
              variant: 'warning',
            }}
            variant='warning'
          >
            <FormSections form={form} />
          </UnifiedFormCard>
        </form>
      </Form>
    </UnifiedFormWrapper>
  )
}
