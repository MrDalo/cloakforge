/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
'use client'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

import TokenCreatorFormSchema from './TokenCreatorFormScheme'
import { useWallet } from '@solana/wallet-adapter-react'
import { FeeFieldsType } from './types'
import { getLogger } from '@/lib/logger/logger'
import createToken from '@/lib/solana/createToken'
import TokenNameFormField from './TokenNameFormField'
import TokenSymbolFormField from './TokenSymbolFormField'
import DecimalsFormField from './DecimalsFormField'
import SupplyFormField from './SupplyFormField'
import LogoFormField from './LogoFormField'
import DescriptionFormField from './DescriptionFormField'
import ImmutableFormField from './ImmutableFormField'
import RevokeMintFormField from './RevokeMintFormField'
import RevokeFreezeFormField from './RevokeFreezeFormField'
import TwitterLinkFormField from './TwitterLinkFormField'
import TelegramLinkFormField from './TelegramLinkFormField'
import WebsiteLinkFormField from './WebsiteLinkFormField'
import WalletConnectionButton from '@/components/common/WalletConnectionButton/WalletConnectionButton'

const TokenCreatorForm = (): React.ReactNode => {
	const { publicKey, signTransaction } = useWallet()
	const logger = getLogger({
		file: 'TokenCreatorForm.tsx',
	})

	const [feeFields, setFeeFields] = useState<FeeFieldsType>({
		revoke_mint_authority: false,
		revoke_freeze_authority: false,
	})

	const finalSum = useMemo(() => {
		const baseFee = 0.08
		const additionalFee = 0.05
		console.log(feeFields)
		return baseFee + (feeFields.revoke_mint_authority ? additionalFee : 0) + (feeFields.revoke_freeze_authority ? additionalFee : 0)
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

	const onSubmit = async (values: z.infer<typeof TokenCreatorFormSchema>): Promise<void> => {
		if (!publicKey || !signTransaction) {
			toast.error('Please connect your wallet.')
			return
		}

		try {
			const result = await createToken(publicKey, signTransaction, values)

			// if (result.success) {
			//   toast.success(result.message)
			// } else {
			//   toast.error(result.message)
			// }
		} catch (error) {
			logger.error(`'Form submission error - token creation form:  ${error}`)
			toast.error('Failed to create token. Please try again.')
		}
	}

	return (
		<Form {...form}>
			<form className='bg-card mx-auto max-w-3xl space-y-8 rounded-lg p-4 shadow-lg sm:p-10' onSubmit={form.handleSubmit(onSubmit)}>
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
				<div className='text-primary mt-2! flex w-full items-center justify-center gap-1'>
					<p>Final service fee:</p>
					<span className='text-primary-hover/60 line-through'>{finalSum + 0.3} SOL</span>
					<span className='font-semibold'>{finalSum} SOL</span>
				</div>
			</form>
		</Form>
	)
}

export default TokenCreatorForm
