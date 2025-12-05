import { UseFormReturn } from 'react-hook-form'
import { Ban, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { FreezeFormData } from './freezeFormSchema'

interface FreezeModeSelectionProps {
  form: UseFormReturn<FreezeFormData>
}

export const FreezeModeSelection = ({ form }: FreezeModeSelectionProps): React.ReactNode => (
  <FormField
    control={form.control}
    name='freezeMode'
    render={({ field }) => (
      <FormItem>
        <div className='flex items-center space-x-2'>
          <Users className='text-info-foreground/70 h-5 w-5' />
          <h3 className='text-lg font-semibold'>Freeze mode</h3>
        </div>
        <FormControl>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card
              className={`cursor-pointer transition-all duration-200 ${
                field.value === 'single' ? 'border-info bg-info/20 shadow-lg' : 'border-border hover:border-info-foreground/40'
              }`}
              onClick={() => field.onChange('single')}
            >
              <CardContent className='p-4 text-center'>
                <Ban className='text-info-foreground/80 mx-auto mb-2 h-8 w-8' />
                <h3 className='mb-1 font-medium'>Single Wallet</h3>
                <p className='text-muted-foreground text-sm'>Freeze one wallet&apos;s tokens</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer transition-all duration-200 ${
                field.value === 'batch' ? 'border-info bg-info/20 shadow-lg' : 'border-border hover:border-info-foreground/40'
              }`}
              onClick={() => field.onChange('batch')}
            >
              <CardContent className='p-4 text-center'>
                <Users className='text-info-foreground/80 mx-auto mb-2 h-8 w-8' />
                <h3 className='mb-1 font-medium'>Batch Freeze</h3>
                <p className='text-muted-foreground text-sm'>Freeze multiple wallets</p>
              </CardContent>
            </Card>
          </div>
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)
