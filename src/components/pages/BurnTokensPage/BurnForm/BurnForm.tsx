'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { burnTokensFormSchema, type BurnTokensFormData } from './burnTokensFormSchema'
import { FormCard } from './FormCard'

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

  return <FormCard form={form} isLoading={isLoading} onSubmit={onSubmit} />
}
