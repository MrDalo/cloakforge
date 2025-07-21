/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ColumnDef } from '@tanstack/react-table'
import { TransactionData } from './types'
import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Check, Copy, X } from 'lucide-react'
import { toast } from 'sonner'

export const Columns: ColumnDef<TransactionData>[] = [
	{
		accessorKey: 'signature',
		header: 'Signature',
		cell: (info) => (
			<div className='flex flex-row gap-1'>
				<a
					className='text-primary-hover hover:text-primary-hover/70 truncate'
					href={`https://solscan.io/tx/${info.getValue()}`}
					rel='noopener noreferrer'
					target='_blank'
					title={info.getValue() as string}
				>
					{info.getValue() as React.ReactNode}
				</a>
				<div className='flex items-center'>
					<Copy
						className='cursor-pointer text-gray-400 hover:text-gray-600'
						onClick={() => {
							navigator.clipboard.writeText(info.getValue() as string)
							toast.info('Address copied')
						}}
						size={16}
					/>
				</div>
			</div>
		),
		meta: 'max-w-[200px]',
	},
	{
		accessorKey: 'block',
		header: 'Block',
		cell: (info) => (
			<div className='flex flex-row gap-1'>
				<a
					className='text-primary-hover hover:text-primary-hover/70 truncate'
					href={`https://solscan.io/block/${info.getValue()}`}
					rel='noopener noreferrer'
					target='_blank'
					title={info.getValue() as string}
				>
					{info.getValue() as React.ReactNode}
				</a>
				<div className='flex items-center'>
					<Copy
						className='cursor-pointer text-gray-400 hover:text-gray-600'
						onClick={() => {
							navigator.clipboard.writeText(info.getValue() as string)
							toast.info('Address copied')
						}}
						size={16}
					/>
				</div>
			</div>
		),
		sortingFn: 'basic',
		meta: 'max-w-[120px]', // Limit width for block column
	},
	{
		accessorKey: 'time',
		header: 'Time',
		cell: (info) => {
			const value = info.getValue<number | null>()
			if (!value) return 'N/A'

			const now = Date.now()
			const transactionTime = value * 1000 // Convert seconds to milliseconds
			const diffMs = now - transactionTime

			// Convert difference to human-readable format
			const diffSeconds = Math.floor(diffMs / 1000)
			const diffMinutes = Math.floor(diffSeconds / 60)
			const diffHours = Math.floor(diffMinutes / 60)
			const diffDays = Math.floor(diffHours / 24)

			let timeAgo = ''
			if (diffDays > 0) {
				timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
			} else if (diffHours > 0) {
				timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
			} else if (diffMinutes > 0) {
				timeAgo = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
			} else {
				timeAgo = `${diffSeconds} second${diffSeconds > 1 ? 's' : ''} ago`
			}
			// return value ? new Date(value * 1000).toLocaleString() : 'N/A'
			return (
				<TooltipProvider delayDuration={200}>
					<Tooltip>
						<TooltipTrigger>{timeAgo}</TooltipTrigger>
						<TooltipContent>
							<p className='text-xs'>{value ? new Date(value * 1000).toLocaleString() : 'N/A'}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			)
		},
		sortingFn: 'datetime',
		meta: 'w-[110px]', // Limit width for time column
	},
	{
		accessorKey: 'source',
		header: 'Source',
		cell: (info) => (
			<div className='flex flex-row gap-1'>
				<a
					className='text-primary-hover hover:text-primary-hover/70 truncate'
					href={`https://solscan.io/account/${info.getValue()}`}
					rel='noopener noreferrer'
					target='_blank'
					title={info.getValue() as string}
				>
					{info.getValue() as React.ReactNode}
				</a>
				<div className='flex items-center'>
					<Copy
						className='cursor-pointer text-gray-400 hover:text-gray-600'
						onClick={() => {
							navigator.clipboard.writeText(info.getValue() as string)
							toast.info('Address copied')
						}}
						size={16}
					/>
				</div>
			</div>
		),
		meta: 'max-w-[150px]', // Limit width for source column
	},
	{
		accessorKey: 'destination',
		header: 'Destination',
		cell: (info) => (
			<div className='flex flex-row gap-1'>
				{(info.getValue() as string) === null ? (
					'N/A'
				) : (
					<a
						className='text-primary-hover hover:text-primary-hover/70 truncate'
						href={`https://solscan.io/account/${info.getValue()}`}
						rel='noopener noreferrer'
						target='_blank'
						title={info.getValue() as string}
					>
						{info.getValue() as React.ReactNode}
					</a>
				)}
				{(info.getValue() as string) === null ? null : (
					<div className='flex items-center'>
						<Copy
							className='cursor-pointer text-gray-400 hover:text-gray-600'
							onClick={() => {
								navigator.clipboard.writeText(info.getValue() as string)
								toast.info('Address copied')
							}}
							size={16}
						/>
					</div>
				)}
			</div>
		),
		meta: 'max-w-[150px]', // Limit width for destination column
	},
	{
		accessorKey: 'amount',
		header: 'Amount (SOL)',
		cell: (info) => {
			const amount = info.getValue<number>()
			const isIncoming = info.row.original.isIncoming // Check if the transaction is incoming
			const textClass = isIncoming ? 'text-green-500' : 'text-red-500'

			// Ensure the number is fully expanded without scientific notation
			const formattedAmount = new Intl.NumberFormat('en-US', {
				minimumFractionDigits: 0, // Minimum 9 decimal places
				maximumFractionDigits: 9, // Maximum 9 decimal places
			}).format(Math.abs(amount))

			return (
				<span className={`${textClass}`}>
					{isIncoming ? '+' : '-'}
					{formattedAmount} SOL
				</span>
			)
		},
		sortingFn: 'basic',
		meta: 'max-w-[150px]', // Limit width for amount column
	},
	{
		accessorKey: 'fee',
		header: 'Fee (SOL)',
		cell: (info) => `${parseFloat(info.getValue<number>().toFixed(6)).toString()} SOL`,
		sortingFn: 'basic',
		meta: 'max-w-[140px]', // Limit width for fee column
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: (info) => {
			const value = info.getValue<string>()
			return (
				<span className={value === 'finalized' ? 'text-green-500' : value === 'confirmed' ? 'text-yellow-500' : 'text-gray-500'}>{value}</span>
			)
		},
		meta: 'max-w-[100px]', // Limit width for status column
	},
	{
		accessorKey: 'isSuccess',
		header: 'Success',
		cell: (info) =>
			info.getValue<boolean | null>() === null ? (
				'Pending'
			) : info.getValue<boolean>() ? (
				<Check className='text-green-500' size={20} />
			) : (
				<X className='text-red-400' size={20} />
			),
		meta: 'max-w-[80px]', // Limit width for success column
	},
]
