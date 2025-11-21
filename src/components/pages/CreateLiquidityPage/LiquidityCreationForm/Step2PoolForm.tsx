'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Transaction, Keypair } from '@solana/web3.js'
import { useState, useEffect } from 'react'
import { Resolver, useForm, SubmitHandler } from 'react-hook-form'
import { toast } from 'sonner'

import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { handleRaydiumError } from '@/lib/solana/raydium/errors'
import { ExplorerLink } from '@/components/common'
import { CreatePoolInput, createPoolSchema } from '@/lib/schemas/createLiquiditySchema'

interface Step2PoolFormProps {
  marketId: string | null
  baseMint: string | null
  quoteMint: string | null
}

export function Step2PoolForm({ marketId, baseMint, quoteMint }: Step2PoolFormProps) {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [isLoading, setIsLoading] = useState(false)
  const [poolSignature, setPoolSignature] = useState<string | null>(null)

  const form = useForm<CreatePoolInput>({
    resolver: zodResolver(createPoolSchema) as Resolver<CreatePoolInput>,
    defaultValues: {
      marketId: marketId || '',
      baseMint: baseMint || '',
      quoteMint: quoteMint || '',
      baseAmount: 0,
      quoteAmount: 0,
    },
  })

  // Update form values if props change
  useEffect(() => {
    if (marketId) form.setValue('marketId', marketId)
    if (baseMint) form.setValue('baseMint', baseMint)
    if (quoteMint) form.setValue('quoteMint', quoteMint)
  }, [marketId, baseMint, quoteMint, form])

  const onSubmit: SubmitHandler<CreatePoolInput> = async (data) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/solana/create-pool', {
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

      const { transaction: serializedTx, signers: signerSecretKeys } = result.data

      // Deserialize Transaction
      const transaction = Transaction.from(Buffer.from(serializedTx, 'base64'))

      // Reconstruct Signers
      const signers = signerSecretKeys.map((secretKey: number[]) => Keypair.fromSecretKey(new Uint8Array(secretKey)))

      // Sign Transaction
      transaction.sign(...signers)
      const signedTx = await signTransaction(transaction)

      // Send & Confirm
      const signature = await connection.sendRawTransaction(signedTx.serialize())
      await connection.confirmTransaction(signature, 'confirmed')

      toast.success('Liquidity Pool created successfully!')
      setPoolSignature(signature)
    } catch (error) {
      const message = handleRaydiumError(error)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!marketId) {
    return <div className="text-center p-4">Please complete Step 1 first.</div>
  }

  if (poolSignature) {
    return (
      <div className="text-center space-y-6 p-6 border rounded-lg bg-green-50 dark:bg-green-900/10">
        <h3 className="text-2xl font-bold text-green-600">Pool Created Successfully! 🎉</h3>
        <p className="text-muted-foreground">
          Your liquidity pool is now live on Raydium.
        </p>
        <div className="flex justify-center gap-4">
          <ExplorerLink path={`tx/${poolSignature}`} label="View Transaction" />
          <Button variant="outline" onClick={() => window.open(`https://raydium.io/liquidity/add/?coin0=${baseMint}&coin1=${quoteMint}`, '_blank')}>
            Manage on Raydium
          </Button>
        </div>
        <Button variant="ghost" onClick={() => setPoolSignature(null)}>
          Create Another Pool
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="marketId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Market ID</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="hidden md:block"></div> {/* Spacer */}

          <FormField
            control={form.control}
            name="baseMint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Token</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quoteMint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quote Token</FormLabel>
                <FormControl>
                  <Input {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="baseAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Token Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Amount of base tokens to add to liquidity.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quoteAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quote Token Amount</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Amount of quote tokens (SOL/USDC) to add.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Time (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field} 
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                    onChange={e => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        field.onChange(date);
                    }}
                  />
                </FormControl>
                <FormDescription>Leave blank to start immediately.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <LoadingSpinner /> : 'Initialize Liquidity Pool'}
        </Button>
      </form>
    </Form>
  )
}
