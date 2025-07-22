import { ShieldX, Loader2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActionButtonsProps {
  isSubmitting: boolean
  isFormValid: boolean
  isConnected: boolean
  onConnectWallet: () => void
}

export const ActionButtons = ({ isSubmitting, isFormValid, isConnected, onConnectWallet }: ActionButtonsProps): React.ReactNode => (
  <div className='space-y-4'>
    {!isConnected ? (
      <Button
        className='bg-primary hover:bg-primary-hover text-primary-foreground w-full rounded-xl py-4 shadow-lg transition-all duration-300 hover:shadow-xl'
        onClick={onConnectWallet}
        size='lg'
        type='button'
      >
        <Wallet className='mr-3 h-5 w-5' />
        Connect Wallet to Continue
      </Button>
    ) : (
      <Button
        className='bg-secondary hover:bg-secondary/90 w-full transition-all duration-200'
        disabled={!isFormValid || isSubmitting}
        size='lg'
        type='submit'
      >
        {isSubmitting ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Revoking Freeze Authority...
          </>
        ) : (
          <>
            <ShieldX className='mr-2 h-4 w-4' />
            Revoke Freeze Authority
          </>
        )}
      </Button>
    )}

    <div className='rounded-lg p-4'>
      <p className='text-muted-foreground text-center text-sm'>
        This action builds trust with your community by permanently removing your ability to freeze token accounts. Once confirmed, this
        cannot be undone.
      </p>
    </div>
  </div>
)
