'use client'

import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Coins } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { mockTokens } from '../unfreezeAccountsData'

interface TokenSelectionFormProps {
  form: UseFormReturn<{
    tokenMint: string
    accounts: string[]
    batchSize: number
  }>
}

export const TokenSelectionForm = ({ form }: TokenSelectionFormProps): React.ReactNode => {
  const handleTokenSelect = (address: string): void => {
    form.setValue('tokenMint', address)
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center space-x-2'>
        <Coins className='text-warning-foreground/70 h-5 w-5' />
        <h3 className='text-lg font-semibold'>Select Token</h3>
      </div>

      <FormField
        control={form.control}
        name='tokenMint'
        render={({ field }) => (
          <FormItem>
            <FormLabel>Token Mint Address</FormLabel>
            <div className='flex space-x-2'>
              <FormControl>
                <Input {...field} placeholder='Enter token mint address or select from your tokens below' />
              </FormControl>
              <Button size='icon' type='button' variant='outline'>
                <Search className='h-4 w-4' />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className='border-warning/20 rounded-lg border p-4'>
        <h4 className='mb-4 font-medium'>Your Tokens</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Accounts</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTokens.map((token) => (
              <TableRow key={token.address}>
                <TableCell>
                  <div>
                    <div className='font-medium'>{token.name}</div>
                    <div className='text-muted-foreground text-sm'>{token.symbol}</div>
                  </div>
                </TableCell>
                <TableCell>{token.balance}</TableCell>
                <TableCell>
                  <div className='flex space-x-2'>
                    <Badge variant='outline'>{token.frozen} frozen</Badge>
                    <Badge variant='secondary'>{token.active} active</Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <Button onClick={() => handleTokenSelect(token.address)} size='sm' variant='outline'>
                    Select
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
