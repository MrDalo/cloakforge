'use client'

export const TableHeader = (): React.ReactNode => (
	<thead>
		<tr className='border-border border-b-2'>
			<th className='px-4 py-4 text-left' />
			<th className='text-muted-foreground px-4 py-4 text-center'>Traditional</th>
			<th className='text-primary px-4 py-4 text-center'>Crypto Forge</th>
			<th className='text-secondary px-4 py-4 text-center'>Benefit</th>
		</tr>
	</thead>
)
