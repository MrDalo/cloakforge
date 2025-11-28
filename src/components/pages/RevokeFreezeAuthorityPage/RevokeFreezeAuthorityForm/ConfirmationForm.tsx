import { Control } from 'react-hook-form'
import { Shield, AlertTriangle } from 'lucide-react'
import { FormField, FormItem, FormControl } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RevokeFreezeAuthorityFormData } from './revokeFreezeAuthorityFormSchema'
import { InfoTooltip } from '@/components/common'

interface ConfirmationFormProps {
  control: Control<RevokeFreezeAuthorityFormData>
}

export const ConfirmationForm = ({ control }: ConfirmationFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <Alert className='border-warning bg-warning/30'>
      <AlertTriangle className='text-warning-foreground h-4 w-4' />
      <AlertDescription className='text-warning-foreground'>
        <strong>Important:</strong> Revoking freeze authority is permanent and irreversible. You will never be able to freeze token accounts
        again, even your own.
      </AlertDescription>
    </Alert>

    <h3 className='flex items-center space-x-2 text-lg font-medium'>
      <Shield className='text-secondary h-5 w-5' />
      <span>Confirmation</span>
    </h3>

    <div className='space-y-4'>
      <FormField
        control={control}
        name='understandIrreversible'
        render={({ field }) => (
          <FormItem>
            <div className='bg-warning/30 border-warning flex items-center justify-between rounded-lg border p-4'>
              <div className='flex items-center space-x-3'>
                <div>
                  <Label className='text-warning-foreground cursor-pointer' htmlFor='understandIrreversible'>
                    I understand this action is irreversible
                  </Label>
                  <p className='text-muted-foreground text-sm'>Freeze authority cannot be restored once revoked</p>
                </div>
                <InfoTooltip
                  icon_classname='text-muted-foreground h-4 w-4'
                  info_description='Revoking freeze authority permanently removes the ability to freeze any token accounts. This action builds trust but cannot be undone.'
                />
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
                    I want to build trust with my community
                  </Label>
                  <p className='text-muted-foreground text-sm'>Confirm you want to revoke freeze authority</p>
                </div>
                <InfoTooltip
                  icon_classname='text-muted-foreground h-4 w-4'
                  info_description='By revoking freeze authority, you demonstrate commitment to decentralization and build trust with your token holders.'
                />
              </div>
              <FormControl>
                <Switch checked={field.value} id='confirmRevoke' onCheckedChange={field.onChange} />
              </FormControl>
            </div>
          </FormItem>
        )}
      />
    </div>
  </div>
)
