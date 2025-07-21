import { Coins } from 'lucide-react'

export const FormHeader = (): React.ReactNode => (
  <div className='flex items-center justify-center space-x-3'>
    <Coins className='text-primary h-6 w-6' />
    <span>Create Your Token</span>
  </div>
)
