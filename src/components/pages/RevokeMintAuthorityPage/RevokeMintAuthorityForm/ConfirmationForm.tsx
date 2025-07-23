import { Control } from 'react-hook-form'
import { Shield, HelpCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FormField, FormItem, FormControl } from '@/components/ui/form'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RevokeMintAuthorityFormData } from './revokeMintAuthorityFormSchema'

interface ConfirmationFormProps {
  control: Control<RevokeMintAuthorityFormData>
}

export const ConfirmationForm = ({ control }: ConfirmationFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Shield className='text-secondary h-5 w-5' />
      <span>Confirmation</span>
    </h3>

    <TooltipProvider>
      <div className='space-y-4'>
        <FormField
          control={control}
          name='understandIrreversible'
          render={({ field }) => (
            <FormItem>
              <div className='bg-warning/15 border-warning/30 flex items-center justify-between rounded-lg border p-4'>
                <div className='flex items-center space-x-3'>
                  <div>
                    <Label className='text-warning cursor-pointer' htmlFor='understandIrreversible'>
                      I understand this action is irreversible
                    </Label>
                    <p className='text-muted-foreground text-sm'>Mint authority cannot be restored once revoked</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className='text-muted-foreground h-4 w-4' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='max-w-xs'>
                        Revoking mint authority permanently prevents any additional token creation. This action builds trust but cannot be
                        undone.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormControl>
                  <Switch checked={field.value} id='understandIrreversible' onCheckedChange={field.onChange} />
                </FormControl>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name='confirmRevoke'
          render={({ field }) => (
            <FormItem>
              <div className='bg-secondary/5 border-secondary/20 flex items-center justify-between rounded-lg border p-4'>
                <div className='flex items-center space-x-3'>
                  <div>
                    <Label className='text-secondary cursor-pointer' htmlFor='confirmRevoke'>
                      I want to create a fixed supply forever
                    </Label>
                    <p className='text-muted-foreground text-sm'>Confirm you want to revoke mint authority</p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className='text-muted-foreground h-4 w-4' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='max-w-xs'>
                        By revoking mint authority, you create a permanently fixed supply that builds trust with your token holders.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormControl>
                  <Switch checked={field.value} id='confirmRevoke' onCheckedChange={field.onChange} />
                </FormControl>
              </div>
            </FormItem>
          )}
        />
      </div>
    </TooltipProvider>
  </div>
)
