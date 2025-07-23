import { UseFormReturn } from 'react-hook-form'
import { useState, Dispatch, SetStateAction } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WalletConnectionButton } from '@/components/common'
import { MultisenderFormData, Stats } from './multisenderFormSchema'

interface ActionButtonsProps {
  form: UseFormReturn<MultisenderFormData>
  isConnected: boolean
  setIsConnected: Dispatch<SetStateAction<boolean>>
}

export const ActionButtons = ({ form, isConnected }: ActionButtonsProps): React.ReactNode => {
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const selectedToken = form.watch('selectedToken')
  const inputMode = form.watch('inputMode')
  const recipients = form.watch('recipients')
  const csvData = form.watch('csvData')
  const confirmSend = form.watch('confirmSend')

  // Calculate statistics
  const stats: Stats = {
    validRecipients:
      inputMode === 'manual'
        ? recipients?.filter((r) => r.address && r.amount).length || 0
        : csvData?.split('\n').filter((line) => line.trim() && !line.startsWith('recipient_address')).length || 0,
    totalAmount: 0, // Not needed for validation
  }

  const handleSubmit = (): void => {
    setIsLoading(true)
    // Simulate transaction processing
    setTimeout(() => {
      setIsLoading(false)
    }, 3000)
  }

  return (
    <div className='flex flex-col space-y-4'>
      {!isConnected ? (
        <div className='text-center'>
          <p className='text-muted-foreground mb-4 text-sm'>Connect your wallet to send tokens</p>
          <WalletConnectionButton />
        </div>
      ) : (
        <Button
          className='bg-info hover:bg-info/90 h-12 w-full'
          disabled={!selectedToken || stats.validRecipients === 0 || !confirmSend || isLoading}
          onClick={handleSubmit}
          size='lg'
          type='submit'
        >
          {isLoading ? (
            <div className='flex items-center space-x-2'>
              <div className='border-info-foreground/30 border-t-info-foreground h-4 w-4 animate-spin rounded-full border-2' />
              <span>Sending to {stats.validRecipients} Recipients...</span>
            </div>
          ) : (
            <div className='flex items-center space-x-2'>
              <Send className='h-5 w-5' />
              <span>
                Send to {stats.validRecipients} Recipient{stats.validRecipients !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </Button>
      )}
    </div>
  )
}
