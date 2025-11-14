import { UseFormReturn, useFieldArray, useWatch } from 'react-hook-form'
import { Plus, Minus, Users, Upload, Download, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { MultisenderFormData } from './multisenderFormSchema'

interface RecipientInputFormProps {
  form: UseFormReturn<MultisenderFormData>
}

export const RecipientInputForm = ({ form }: RecipientInputFormProps): React.ReactNode => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'recipients',
  })

  // Use useWatch for React Compiler compatibility
  const inputMode = useWatch({ control: form.control, name: 'inputMode', defaultValue: 'manual' })

  const downloadTemplate = (): void => {
    const csvContent =
      'recipient_address,amount\n7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,100\n9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM,250'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = 'multisender-template.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className='space-y-6'>
      <div className='text-center'>
        <h3 className='text-lg font-semibold'>Recipient Information</h3>
        <p className='text-muted-foreground text-sm'>Add recipient addresses and amounts for token distribution</p>
      </div>

      {/* Input Mode Selection */}
      <FormField
        control={form.control}
        name='inputMode'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='text-base'>Input Method</FormLabel>
            <FormControl>
              <div className='grid w-full grid-cols-2 gap-4'>
                <Button
                  className={`flex h-12 items-center justify-center space-x-2 ${
                    field.value === 'manual'
                      ? 'bg-info text-info-foreground hover:bg-info/70'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => field.onChange('manual')}
                  type='button'
                  variant={field.value === 'manual' ? 'default' : 'outline'}
                >
                  <Users className='h-4 w-4' />
                  <span>Manual Entry</span>
                </Button>
                <Button
                  className={`flex h-12 items-center justify-center space-x-2 ${
                    field.value === 'csv'
                      ? 'bg-info text-info-foreground hover:bg-info/70'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                  onClick={() => field.onChange('csv')}
                  type='button'
                  variant={field.value === 'csv' ? 'default' : 'outline'}
                >
                  <Upload className='h-4 w-4' />
                  <span>CSV Upload</span>
                </Button>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Manual Entry */}
      {inputMode === 'manual' && (
        <div className='space-y-4'>
          <Label className='text-base'>Recipients</Label>
          {fields.map((field, index) => (
            <div className='bg-muted/30 flex items-end space-x-4 rounded-lg p-4' key={field.id}>
              <FormField
                control={form.control}
                name={`recipients.${index}.address`}
                render={({ field: addressField }) => (
                  <FormItem className='flex-1'>
                    <FormLabel className='text-sm'>Recipient Address</FormLabel>
                    <FormControl>
                      <Input {...addressField} placeholder='Enter wallet address' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`recipients.${index}.amount`}
                render={({ field: amountField }) => (
                  <FormItem className='w-32'>
                    <FormLabel className='text-sm'>Amount</FormLabel>
                    <FormControl>
                      <Input {...amountField} placeholder='0.00' type='number' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='flex space-x-2'>
                <Button
                  className='h-10 w-10 p-0'
                  onClick={() => append({ address: '', amount: '' })}
                  size='sm'
                  type='button'
                  variant='outline'
                >
                  <Plus className='h-4 w-4' />
                </Button>
                {fields.length > 1 && (
                  <Button className='h-10 w-10 p-0' onClick={() => remove(index)} size='sm' type='button' variant='outline'>
                    <Minus className='h-4 w-4' />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CSV Upload */}
      {inputMode === 'csv' && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label className='text-base'>CSV Data</Label>
            <Button className='flex items-center space-x-2' onClick={downloadTemplate} size='sm' type='button' variant='outline'>
              <Download className='h-4 w-4' />
              <span>Download Template</span>
            </Button>
          </div>
          <FormField
            control={form.control}
            name='csvData'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    {...field}
                    className='min-h-32 font-mono text-sm'
                    placeholder='recipient_address,amount&#10;7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU,100&#10;9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM,250'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Alert className='bg-info/30 border-info'>
            <Info className='text-info-foreground/80 h-4 w-4' />
            <AlertDescription className='text-info-foreground/80'>
              Format: recipient_address,amount (one per line). First line should be headers.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
