import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { solanaAddressSchema } from '@/lib/schemas/apiSchemas'

const formSchema = z.object({
  tokenAddress: solanaAddressSchema,
})

type FormValues = z.infer<typeof formSchema>

interface TokenAuditorFormProps {
  onSubmit: (values: FormValues) => void
  isLoading: boolean
}

export const TokenAuditorForm = ({ onSubmit, isLoading }: TokenAuditorFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tokenAddress: '',
    },
  })

  return (
    <Form {...form}>
      <form className='flex w-full max-w-2xl items-end gap-4' onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='tokenAddress'
          render={({ field }) => (
            <FormItem className='w-full'>
              <FormLabel>Token Address</FormLabel>
              <FormControl>
                <Input placeholder='Enter SPL Token Address...' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isLoading} type='submit'>
          {isLoading ? (
            'Auditing...'
          ) : (
            <>
              <Search className='mr-2 h-4 w-4' />
              Audit
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
