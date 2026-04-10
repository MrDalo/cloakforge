'use client'

// Placeholder component for Step2PoolForm
// TODO: Implement pool configuration form step

interface Step2PoolFormProps {
  baseMint: string | null
  marketId: string | null
  quoteMint: string | null
}

export const Step2PoolForm = ({ baseMint, marketId, quoteMint }: Step2PoolFormProps): React.ReactNode => (
  <div className='p-6'>
    <h3 className='mb-4 text-lg font-medium'>Step 2: Pool Configuration</h3>
    <p className='text-muted-foreground'>Pool configuration form coming soon...</p>
    <div className='mt-4 text-sm text-gray-600'>
      <p>Market ID: {marketId || 'Not selected'}</p>
      <p>Base Mint: {baseMint || 'Not selected'}</p>
      <p>Quote Mint: {quoteMint || 'Not selected'}</p>
    </div>
  </div>
)
