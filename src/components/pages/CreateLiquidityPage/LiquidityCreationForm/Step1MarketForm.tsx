'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Keypair, Transaction } from '@solana/web3.js'
import { useState } from 'react'
import { Resolver, SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { CreateMarketInput, createMarketSchema } from '@/lib/schemas/createLiquiditySchema'
import { handleRaydiumError } from '@/lib/solana/raydium/errors'

interface Step1MarketFormProps {
  onSuccess: (marketId: string, baseMint: string, quoteMint: string) => void
}

export const Step1MarketForm = ({ onSuccess }: Step1MarketFormProps) => {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreateMarketInput>({
    resolver: zodResolver(createMarketSchema) as Resolver<CreateMarketInput>,
    defaultValues: {
      baseMint: '',
      quoteMint: 'So11111111111111111111111111111111111111112', // SOL
      lotSize: 1,
      tickSize: 0.01,
      useAdvancedOptions: false,
      optimizeForLowCost: true,
    },
  })

  const onSubmit: SubmitHandler<CreateMarketInput> = async (data) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet')
      return
    }

    setIsLoading(true)
    try {
      // 1. Call API to create transaction
      const response = await fetch('/api/solana/create-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          walletAddress: publicKey.toString(),
        }),
      })

      const result = await response.json()

      if (result.status !== 'success') {
        throw new Error(result.error_message)
      }

      const { transaction: serializedTx, signers: signerSecretKeys, marketId } = result.data

      // 2. Deserialize Transaction
      const transaction = Transaction.from(Buffer.from(serializedTx, 'base64'))

      // 3. Reconstruct Signers (Ephemeral Keypairs)
      const signers = signerSecretKeys.map((secretKey: number[]) => Keypair.fromSecretKey(new Uint8Array(secretKey)))

      // 4. Sign Transaction (Wallet + Ephemeral Signers)
      transaction.sign(...signers)
      const signedTx = await signTransaction(transaction)

      // 5. Send & Confirm
      const signature = await connection.sendRawTransaction(signedTx.serialize())
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Market created successfully!')
      onSuccess(marketId, data.baseMint, data.quoteMint)
    } catch (error) {
      const message = handleRaydiumError(error)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form className='space-y-6' onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='baseMint'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Token Address</FormLabel>
              <FormControl>
                <Input placeholder='Enter your token address' {...field} />
              </FormControl>
              <FormDescription>The token you want to create a pool for.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='quoteMint'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quote Token Address</FormLabel>
              <FormControl>
                <Input placeholder='Enter quote token address (SOL/USDC)' {...field} />
              </FormControl>
              <FormDescription>Usually SOL or USDC.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='optimizeForLowCost'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
              <div className='space-y-0.5'>
                <FormLabel className='text-base'>Optimize for Low Cost</FormLabel>
                <FormDescription>Reduces market creation cost from ~3 SOL to ~0.3 SOL by using smaller event queues.</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button className='w-full' disabled={isLoading} type='submit'>
          {isLoading ? <LoadingSpinner /> : 'Create OpenBook Market (~0.3 SOL)'}
        </Button>
      </form>
    </Form>
  )
}
