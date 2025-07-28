import { UseFormReturn } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { mockUserTokens } from '../freezeAccountsData'
import { FreezeFormData } from './freezeFormSchema'

interface TokenSelectionFormProps {
  form: UseFormReturn<FreezeFormData>
}

export const TokenSelectionForm = ({ form }: TokenSelectionFormProps): React.ReactNode => (
  <div className='space-y-4'>
    <FormField
      control={form.control}
      name='selectedToken'
      render={({ field }) => (
        <FormItem>
          <FormLabel className='text-base'>Select Token to Manage</FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className='h-12'>
                <SelectValue placeholder='Choose a token from your connected wallet' />
              </SelectTrigger>
              <SelectContent>
                {mockUserTokens.map((token) => (
                  <SelectItem key={token.address} value={token.address}>
                    <div className='flex items-center space-x-3'>
                      <div className='bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full'>
                        <span className='text-primary text-xs font-medium'>{token.symbol.substring(0, 2)}</span>
                      </div>
                      <div>
                        <div className='font-medium'>
                          {token.name} ({token.symbol})
                        </div>
                        <div className='text-muted-foreground text-xs'>
                          {token.address.substring(0, 8)}...{token.address.substring(-8)}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {form.watch('selectedToken') && (
      <div className='bg-muted/30 grid gap-4 rounded-lg p-4 md:grid-cols-3'>
        {((): React.ReactNode => {
          const selectedTokenData = mockUserTokens.find((token) => token.address === form.watch('selectedToken'))
          if (!selectedTokenData) return null

          return (
            <>
              <div className='text-center'>
                <div className='text-lg font-medium'>{selectedTokenData.balance}</div>
                <div className='text-muted-foreground text-sm'>Total Supply</div>
              </div>
              <div className='text-center'>
                <div className='text-secondary text-lg font-medium'>{selectedTokenData.active}</div>
                <div className='text-muted-foreground text-sm'>Active Accounts</div>
              </div>
              <div className='text-center'>
                <div className='text-info text-lg font-medium'>{selectedTokenData.frozen}</div>
                <div className='text-muted-foreground text-sm'>Frozen Accounts</div>
              </div>
            </>
          )
        })()}
      </div>
    )}
  </div>
)
