import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/common'

interface TokenAuditorLoadingProps {
  tokenAddress: string
}

export const TokenAuditorLoading = ({ tokenAddress }: TokenAuditorLoadingProps): React.ReactNode => (
  <div className='bg-background flex min-h-screen items-center justify-center'>
    <Card className='w-full max-w-md'>
      <CardContent className='flex flex-col items-center space-y-4 p-8'>
        <LoadingSpinner className='h-8 w-8' />
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
