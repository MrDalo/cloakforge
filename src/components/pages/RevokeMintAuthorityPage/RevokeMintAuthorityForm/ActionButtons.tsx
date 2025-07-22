import { useWallet } from '@solana/wallet-adapter-react'
import { ArrowLeft, ShieldOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActionButtonsProps {
  isSubmitting: boolean
  isValid: boolean
  onBack: () => void
}

export const ActionButtons = ({ isSubmitting, isValid, onBack }: ActionButtonsProps): React.ReactNode => {
  const { connected } = useWallet()

  return (
    <div className='flex flex-col gap-4 sm:flex-row'>
      <Button className='flex-1 sm:flex-none' disabled={isSubmitting} onClick={onBack} size='lg' type='button' variant='outline'>
        <ArrowLeft className='mr-2 h-4 w-4' />
        Back
      </Button>

      <Button className='flex-1' disabled={!connected || !isValid || isSubmitting} size='lg' type='submit' variant='secondary'>
        {isSubmitting ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Revoking Mint Authority...
          </>
        ) : (
          <>
            <ShieldOff className='mr-2 h-4 w-4' />
            Revoke Mint Authority
          </>
        )}
      </Button>
    </div>
  )
}
