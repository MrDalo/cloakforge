import { CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ExplorerLink } from '@/components/common'

interface TokenCreationSuccessProps {
  mintAddress: string
  signature: string
  tokenName: string
  tokenSymbol: string
  onReset: () => void
}

export const TokenCreationSuccess = ({
  mintAddress,
  signature,
  tokenName,
  tokenSymbol,
  onReset,
}: TokenCreationSuccessProps): React.ReactNode => {
  const copyToClipboard = async (text: string, label: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Card className='border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'>
      <CardHeader className='text-center'>
        <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
          <CheckCircle className='h-8 w-8 text-green-600 dark:text-green-400' />
        </div>
        <CardTitle className='text-green-800 dark:text-green-200'>Token Created Successfully!</CardTitle>
        <p className='text-green-700 dark:text-green-300'>
          Your {tokenName} ({tokenSymbol}) token has been created on the Solana blockchain.
        </p>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Token Address */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-green-800 dark:text-green-200'>Token Mint Address</label>
          <div className='flex items-center gap-2'>
            <code className='flex-1 rounded bg-green-100 p-2 font-mono text-xs text-green-800 dark:bg-green-900 dark:text-green-200'>
              {mintAddress}
            </code>
            <Button onClick={() => copyToClipboard(mintAddress, 'Token address')} size='sm' variant='outline'>
              <Copy className='h-4 w-4' />
            </Button>
            <ExplorerLink
              type='token'
              value={mintAddress}
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' hover:no-underline'}
              showIcon={false}
            >
              <ExternalLink className='h-4 w-4' />
            </ExplorerLink>
          </div>
        </div>

        {/* Transaction Signature */}
        <div className='space-y-2'>
          <label className='text-sm font-medium text-green-800 dark:text-green-200'>Transaction Signature</label>
          <div className='flex items-center gap-2'>
            <code className='flex-1 rounded bg-green-100 p-2 font-mono text-xs text-green-800 dark:bg-green-900 dark:text-green-200'>
              {signature}
            </code>
            <Button onClick={() => copyToClipboard(signature, 'Transaction signature')} size='sm' variant='outline'>
              <Copy className='h-4 w-4' />
            </Button>
            <ExplorerLink
              type='tx'
              value={signature}
              className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' hover:no-underline'}
              showIcon={false}
            >
              <ExternalLink className='h-4 w-4' />
            </ExplorerLink>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col gap-3 pt-4 sm:flex-row'>
          <Button className='flex-1' onClick={onReset} variant='outline'>
            Create Another Token
          </Button>
          <ExplorerLink
            type='token'
            value={mintAddress}
            className={buttonVariants({ variant: 'default' }) + ' flex-1 hover:no-underline'}
            showIcon={false}
          >
            View on Solscan
          </ExplorerLink>
        </div>

        {/* Next Steps */}
        <div className='rounded-lg bg-green-100 p-4 dark:bg-green-900'>
          <h4 className='mb-2 font-medium text-green-800 dark:text-green-200'>Next Steps</h4>
          <ul className='space-y-1 text-sm text-green-700 dark:text-green-300'>
            <li>• Add your token to wallet using the mint address</li>
            <li>• Create liquidity pools on DEXs like Raydium or Orca</li>
            <li>• Share your token address with your community</li>
            <li>• Consider using our other tools for token management</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
