import { Card, CardContent } from '@/components/ui/card'
import LoadingSpinner from '@/components/common/LoadingSpinner'

/** Suspense fallback while the mint is read on-chain. */
export const TokenAuditorLoading = (): React.ReactNode => (
  <div aria-busy='true' className='bg-background flex min-h-screen items-center justify-center' role='status'>
    <Card className='w-full max-w-md'>
      <CardContent className='flex flex-col items-center space-y-4 p-8'>
        <LoadingSpinner className='size-8' />
        <div className='text-center'>
          <h3 className='text-lg font-medium'>Checking token</h3>
          <p className='text-muted-foreground text-sm'>Reading the mint, extensions, metadata and largest holders from Solana mainnet…</p>
        </div>
      </CardContent>
    </Card>
  </div>
)
