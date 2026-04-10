'use client'

// Placeholder component for Step1MarketForm
// TODO: Implement market selection form step

interface Step1MarketFormProps {
  onSuccess: (id: string, base: string, quote: string) => void
}

export const Step1MarketForm = ({ onSuccess }: Step1MarketFormProps): React.ReactNode => (
  <div className='p-6'>
    <h3 className='mb-4 text-lg font-medium'>Step 1: Market Selection</h3>
    <p className='text-muted-foreground'>Market selection form coming soon...</p>
    <button
      className='bg-primary text-primary-foreground mt-4 rounded px-4 py-2'
      onClick={() => onSuccess('placeholder-id', 'placeholder-base', 'placeholder-quote')}
    >
      Continue (Placeholder)
    </button>
  </div>
)
