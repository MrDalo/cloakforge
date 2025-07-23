import { UseFormReturn } from 'react-hook-form'
import { Dispatch, SetStateAction } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { FormSections } from './FormSections'
import { MultisenderFormData } from './multisenderFormSchema'
import { FormHeader } from './FormHeader'

interface FormCardProps {
  form: UseFormReturn<MultisenderFormData>
  isConnected: boolean
  setIsConnected: Dispatch<SetStateAction<boolean>>
  onSubmit: (data: MultisenderFormData) => void
}

export const FormCard = ({ form, isConnected, setIsConnected, onSubmit }: FormCardProps): React.ReactNode => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card className='border-border bg-card border-2 shadow-xl'>
        <CardHeader className='from-info/40 to-info/15 border-border border-b bg-gradient-to-r'>
          <CardTitle className='text-center'>
            <FormHeader />
          </CardTitle>
        </CardHeader>
        <CardContent className='p-8'>
          <FormSections form={form} isConnected={isConnected} setIsConnected={setIsConnected} />
        </CardContent>
      </Card>
    </form>
  </Form>
)
