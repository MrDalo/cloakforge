import { Send } from 'lucide-react'

export const FormHeader = (): React.ReactNode => (
  <div className='flex items-center justify-center space-x-3'>
    <Send className='text-info-foreground h-6 w-6' />
    <span className='font-medium'>Send to Multiple Recipients</span>
  </div>
)
