import { Card, CardContent } from '@/components/ui/card'

interface TokenAuditorLoadingProps {
  tokenAddress: string
}

const LoadingSpinner = (): React.ReactNode => (
  <div className='border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent' />
)

export const TokenAuditorLoading = ({ tokenAddress }: TokenAuditorLoadingProps): React.ReactNode => (
  <div className='bg-background flex min-h-screen items-center justify-center'>
    <Card className='w-full max-w-md'>
      <CardContent className='flex flex-col items-center space-y-4 p-8'>
        <LoadingSpinner />
        <div className='text-center'>
          <h3 className='text-lg font-medium'>Analyzing Token</h3>
          <p className='text-muted-foreground text-sm'>
            Fetching comprehensive data for
            <br />
            <span className='font-mono'>
              {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-8)}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
)
