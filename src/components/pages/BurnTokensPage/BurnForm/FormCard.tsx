import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { FormHeaderWrapper } from './FormHeaderWrapper'
import { FormSections } from './FormSections'
import { BurnTokensFormData } from './burnTokensFormSchema'

interface FormCardProps {
  form: UseFormReturn<BurnTokensFormData>
  isLoading: boolean
  onSubmit: (data: BurnTokensFormData) => void
}

export const FormCard = ({ form, isLoading, onSubmit }: FormCardProps): React.ReactNode => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Card className='border-border bg-card border-2 shadow-xl'>
        <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
          <CardTitle className='text-center'>
            <FormHeaderWrapper />
          </CardTitle>
        </CardHeader>
        <CardContent className='p-8'>
          <FormSections form={form} isLoading={isLoading} />
        </CardContent>
      </Card>
    </form>
  </Form>
)
