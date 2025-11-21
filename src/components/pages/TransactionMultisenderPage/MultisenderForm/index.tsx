'use client'

import { useState } from 'react'
import { useForm, FormProvider, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWallet } from '@solana/wallet-adapter-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormSections } from './FormSections'
import { FeeBreakdown } from './FeeBreakdown'
import { multisenderFormSchema, type MultisenderFormData } from './schema'
import { useTransactionMultisender } from '@/hooks/solana/useTransactionMultisender'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { WalletConnectionButton } from '@/components/common/WalletConnectionButton'
import { ToolActionButton } from '@/components/common/ToolActionButton'
import { getLogger } from '@/lib/logger/logger'

export const MultisenderForm = () => {
  const { connected, publicKey } = useWallet()
  const { execute, isExecuting } = useTransactionMultisender()
  const [selectedTokenData, setSelectedTokenData] = useState<TokenWithAuthorities | undefined>(undefined)
  const logger = getLogger({ context: 'MultisenderForm' })

  const methods = useForm<MultisenderFormData>({
    resolver: zodResolver(multisenderFormSchema) as Resolver<MultisenderFormData>,
    defaultValues: {
      selectedToken: '',
      recipientsInput: '',
      recipients: [],
      decimals: 9,
    },
  })

  const onSubmit = async (data: MultisenderFormData) => {
    if (!connected || !publicKey) {
      toast.error('Please connect your wallet')
      return
    }

    if (!data.selectedToken) {
      toast.error('Please select a token')
      return
    }

    try {
      await execute({
        tokenMintAddress: data.selectedToken,
        recipients: data.recipients,
        decimals: selectedTokenData?.decimals ?? 9,
      })

      // Reset form on success
      methods.reset()
      setSelectedTokenData(undefined)
    } catch (error) {
      // Error is handled by the hook
      logger.error('Transaction failed', error)
    }
  }

  if (!connected) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-10 text-center'>
          <h3 className='mb-4 text-lg font-medium'>Connect Wallet to Continue</h3>
          <p className='text-muted-foreground mb-6 max-w-md'>Connect your Solana wallet to start sending tokens to multiple recipients.</p>
          <WalletConnectionButton />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Multisender</CardTitle>
      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form className='space-y-8' onSubmit={methods.handleSubmit(onSubmit)}>
            <FormSections onTokenSelect={setSelectedTokenData} selectedToken={selectedTokenData} />

            <FeeBreakdown />

            <ToolActionButton
              className='w-full'
              disabled={isExecuting || !methods.formState.isValid}
              isLoading={isExecuting}
              toolId='transaction-multisender'
              type='submit'
            >
              Send Tokens
            </ToolActionButton>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  )
}
