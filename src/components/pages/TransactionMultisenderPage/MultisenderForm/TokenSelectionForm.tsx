import { UseFormReturn } from 'react-hook-form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { MultisenderFormData, TokenData } from './multisenderFormSchema'

interface TokenSelectionFormProps {
  form: UseFormReturn<MultisenderFormData>
}

const userTokens: TokenData[] = [
  {
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    name: 'Solana',
    symbol: 'SOL',
    balance: '125.50',
  },
  {
    address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    name: 'USD Coin',
    symbol: 'USDC',
    balance: '1,250.00',
  },
]

export const TokenSelectionForm = ({ form }: TokenSelectionFormProps): React.ReactNode => (
  <div className='space-y-6'>
    <div className='text-center'>
      <h3 className='text-lg font-semibold'>Token Selection</h3>
      <p className='text-muted-foreground text-sm'>Choose which token to distribute to multiple recipients</p>
    </div>

    <FormField
      control={form.control}
      name='selectedToken'
      render={({ field }) => (
        <FormItem>
          <FormLabel className='text-base'>Select Token to Send</FormLabel>
          <FormControl>
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className='h-12'>
                <SelectValue placeholder='Choose a token from your connected wallet' />
              </SelectTrigger>
              <SelectContent>
                {userTokens.map((token) => (
                  <SelectItem key={token.address} value={token.address}>
                    <div className='flex items-center space-x-3'>
                      <div className='bg-info/10 flex h-8 w-8 items-center justify-center rounded-full'>
                        <span className='text-info-foreground/80 text-xs font-medium'>{token.symbol.substring(0, 2)}</span>
                      </div>
                      <div>
                        <div className='font-medium'>
                          {token.name} ({token.symbol})
                        </div>
                        <div className='text-muted-foreground text-xs'>Balance: {token.balance}</div>
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
  </div>
)
