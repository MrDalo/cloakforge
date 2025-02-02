/* eslint-disable no-console */
'use client'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

import TokenCreatorFormSchema from './token-creator-form-schema'
import TokenNameFormField from './token-name-form-field'
import TokenSymbolFormField from './token-symbol-form-field'
import DecimalsFormField from './decimals-form-field'
import LogoFormField from './logo-form-field'
import DescriptionFormField from './description-form-field'
import RevokeMintFormField from './revoke-mint-form-field'
import RevokeFreezeFormField from './revoke-freeze-form-field'
import WebsiteLinkFormField from './website-link-form-field'
import TwitterLinkFormField from './twitter-link-form-field'
import TelegramLinkFormField from './telegram-link-form-field'
import SupplyFormField from './supply-form-field'
import { useWallet } from '@solana/wallet-adapter-react'
import WalletConnectionButton from '@/components/ui/wallet-connection-button/wallet-connection-button'
import ImmutableFormField from './immutable-form-field'
import { FeeFieldsType } from './types'

const TokenCreatorForm = (): React.ReactNode => {
  const { publicKey } = useWallet()

  const [feeFields, setFeeFields] = useState<FeeFieldsType>({
    revoke_mint_authority: false,
    revoke_freeze_authority: false,
  })

  const finalSum = useMemo(() => {
    const baseFee = 0.08
    const additionalFee = 0.05
    console.log(feeFields)
    return (
      baseFee +
      (feeFields.revoke_mint_authority ? additionalFee : 0) +
      (feeFields.revoke_freeze_authority ? additionalFee : 0)
    )
  }, [feeFields])

  const form = useForm<z.infer<typeof TokenCreatorFormSchema>>({
    resolver: zodResolver(TokenCreatorFormSchema),
    defaultValues: {
      token_name: '', // Ensure empty string instead of undefined
      token_symbol: '',
      decimal: 9,
      supply: 0,
      description: '',
      immutable: false,
      revoke_mint_authority: false,
      revoke_freeze_authority: false,
      twitter: '',
      telegram: '',
      website: '',
      logo: undefined, // File input might require null initially
    },
  })

  const onSubmit = (values: z.infer<typeof TokenCreatorFormSchema>): void => {
    try {
      console.log(values)
      toast(
        <pre className='mt-2 w-[340px] rounded-md bg-slate-950 p-4'>
          <code className='text-white'>{JSON.stringify(values, null, 2)}</code>
        </pre>
      )
    } catch (error) {
      console.error('Form submission error', error)
      toast.error('Failed to submit the form. Please try again.')
    }
  }

  return (
    <Form {...form}>
      <form
        className='mx-auto max-w-3xl space-y-8 rounded-lg bg-card p-4 shadow-lg sm:p-10'
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className='grid w-full grid-cols-12 gap-4'>
          <div className='col-span-12 sm:col-span-6'>
            <TokenNameFormField form={form} />
          </div>

          <div className='col-span-12 w-full sm:col-span-6'>
            <TokenSymbolFormField form={form} />
          </div>
        </div>

        <div className='grid w-full grid-cols-12 gap-4'>
          <div className='col-span-12 sm:col-span-6'>
            <DecimalsFormField form={form} />
          </div>

          <div className='col-span-12 w-full sm:col-span-6'>
            <SupplyFormField form={form} />
          </div>
        </div>

        <LogoFormField form={form} />

        <DescriptionFormField form={form} />

        <ImmutableFormField form={form} />

        <RevokeMintFormField form={form} setFeeFields={setFeeFields} />

        <RevokeFreezeFormField form={form} setFeeFields={setFeeFields} />

        <TwitterLinkFormField form={form} />

        <TelegramLinkFormField form={form} />

        <WebsiteLinkFormField form={form} />
        <div className='flex w-full items-center justify-center'>
          {publicKey ? (
            <Button className='text-base' size='lg' type='submit'>
              Create token
            </Button>
          ) : (
            <WalletConnectionButton />
          )}
        </div>
        <div className='!mt-2 flex w-full items-center justify-center gap-1 text-primary'>
          <p>Final service fee:</p>
          <span className='text-primary-hover/60 line-through'>
            {finalSum + 0.3} SOL
          </span>
          <span className='font-semibold'>{finalSum} SOL</span>
        </div>
      </form>
    </Form>
  )
}

export default TokenCreatorForm
