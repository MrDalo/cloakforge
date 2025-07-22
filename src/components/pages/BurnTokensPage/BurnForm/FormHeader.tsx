import { Flame } from 'lucide-react'

export const FormHeader = (): React.ReactNode => (
  <div className='flex items-center justify-center space-x-3'>
    <Flame className='text-destructive-foreground/80 h-6 w-6' />
    <span className='font-medium'>Burn Your Tokens</span>
  </div>
)
