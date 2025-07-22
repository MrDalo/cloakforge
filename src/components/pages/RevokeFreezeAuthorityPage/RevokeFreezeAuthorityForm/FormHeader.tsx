import { ShieldOff } from 'lucide-react'

export const FormHeader = (): React.ReactNode => (
  <div className='flex items-center justify-center space-x-3'>
    <ShieldOff className='text-secondary h-6 w-6' />
    <span className='font-medium'>Revoke Freeze Authority</span>
  </div>
)
