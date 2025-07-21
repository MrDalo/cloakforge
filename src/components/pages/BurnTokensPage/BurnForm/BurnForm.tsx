'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { burnTokensFormSchema, type BurnTokensFormData } from './burnTokensFormSchema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { Flame } from 'lucide-react'
import { TokenSelectionForm } from './TokenSelectionForm'
import { BurnAmountForm } from './BurnAmountForm'
import { FeeBreakdown } from './FeeBreakdown'
import { ConfirmationForm } from './ConfirmationForm'
import { ActionButtons } from './ActionButtons'

interface BurnFormProps {
  onSubmit: (data: BurnTokensFormData) => void
  isLoading?: boolean
}

export const BurnForm = ({ onSubmit, isLoading = false }: BurnFormProps): React.ReactNode => {
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
    <Card className='mx-auto w-full max-w-2xl border-2'>
      <CardHeader className='pb-4 text-center'>
        <div className='bg-primary/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full'>
          <Flame className='text-primary h-6 w-6' />
        </div>
        <CardTitle className='text-2xl font-bold'>Burn Tokens</CardTitle>
        <p className='text-muted-foreground text-sm'>Permanently remove tokens from circulation to reduce total supply</p>
      </CardHeader>
      <CardContent className='space-y-6'>
        <Form {...form}>
          <form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
            <TokenSelectionForm control={form.control} setValue={form.setValue} />
            <BurnAmountForm control={form.control} watch={form.watch} />
            <FeeBreakdown burnAmount={form.watch('burnAmount')} tokenInfo={form.watch('tokenInfo')} />
            <ConfirmationForm control={form.control} />
            <ActionButtons isFormValid={form.formState.isValid} isLoading={isLoading} />
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
