import { Ban } from 'lucide-react'

export const FormHeader = (): React.ReactNode => (
  <div className='flex items-center justify-center space-x-3'>
    <Ban className='text-secondary h-6 w-6' />
    <span>Revoke Mint Authority</span>
  </div>
)
