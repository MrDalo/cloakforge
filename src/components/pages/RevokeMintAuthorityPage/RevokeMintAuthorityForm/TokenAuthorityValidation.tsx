import React from 'react'
import { ShieldCheck, ShieldX, AlertTriangle, Info, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TokenAuthorityValidationProps {
  form: {
    watch: (name?: string | string[]) => unknown
  }
}

interface TokenInfo {
  name?: string
  symbol?: string
  mintAuthority?: string
  totalSupply?: number
  canRevokeMintAuthority?: boolean
}

const AuthorityIcon = ({ canRevoke }: { canRevoke: boolean }): React.ReactElement => (
  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${canRevoke ? 'bg-success' : 'bg-warning'}`}>
    {canRevoke ? <ShieldCheck className='text-success-foreground h-5 w-5' /> : <ShieldX className='text-warning-foreground h-5 w-5' />}
  </div>
)

const ExplorerButton = ({ tokenAddress }: { tokenAddress: string }): React.ReactElement => (
  <Button
    className='p-2'
    onClick={() => window.open(`https://solscan.io/token/${tokenAddress}`, '_blank')}
    size='sm'
    type='button'
    variant='ghost'
  >
    <ExternalLink className='h-4 w-4' />
  </Button>
)

const TokenAuthorityDetails = ({ tokenInfo, canRevoke }: { tokenInfo: TokenInfo; canRevoke: boolean }): React.ReactElement => (
  <div className='min-w-0 flex-1'>
    <div className='font-semibold'>{tokenInfo.name || 'Unknown Token'}</div>
    <div className='text-muted-foreground flex items-center gap-1 text-sm'>
      <span className='shrink-0'>{tokenInfo.symbol || 'UNKNOWN'} •</span>
      <span className='text-xs'>{canRevoke ? 'You have mint authority' : 'No mint authority'}</span>
    </div>
    {tokenInfo.mintAuthority && (
      <div className='text-muted-foreground mt-1 text-xs'>
        <span>Authority:</span>{' '}
        <code className='bg-muted rounded px-1 py-0.5'>
          {tokenInfo.mintAuthority.slice(0, 8)}...{tokenInfo.mintAuthority.slice(-4)}
        </code>
      </div>
    )}
    {tokenInfo.totalSupply !== undefined && (
      <div className='text-muted-foreground mt-1 text-xs'>Supply: {tokenInfo.totalSupply.toLocaleString()} tokens</div>
    )}
  </div>
)

export const TokenAuthorityValidation = ({ form }: TokenAuthorityValidationProps): React.ReactNode => {
  const tokenInfo = form.watch('tokenInfo') as TokenInfo | undefined
  const tokenAddress = form.watch('tokenAddress') as string

  if (!tokenAddress || !tokenInfo) {
    return null
  }

  const canRevokeMintAuthority = tokenInfo.canRevokeMintAuthority

  return (
    <>
      <Card className={`${canRevokeMintAuthority ? 'border border-green-500 bg-green-50' : 'border-warning-foreground bg-warning'}`}>
        <CardContent className='p-4'>
          <div className='flex w-full flex-col justify-between gap-2 sm:flex-row sm:items-center'>
            <div className='flex min-w-0 grow items-center gap-3'>
              {/* Authority Icon */}
              <AuthorityIcon canRevoke={!!canRevokeMintAuthority} />

              {/* Token Authority Details */}
              <TokenAuthorityDetails canRevoke={!!canRevokeMintAuthority} tokenInfo={tokenInfo} />
            </div>

            {/* Authority Badge and Explorer Link */}
            <div className='ml-12 flex shrink-0 items-center gap-2 sm:ml-0 sm:justify-end'>
              <Badge
                className={`${canRevokeMintAuthority ? 'bg-success-foreground text-white' : 'bg-warning-foreground text-white'}`}
                variant='secondary'
              >
                {canRevokeMintAuthority ? 'Can Revoke' : 'No Authority'}
              </Badge>
              <ExplorerButton tokenAddress={tokenAddress} />
            </div>
          </div>
        </CardContent>
      </Card>

      {canRevokeMintAuthority && (
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <strong>Important:</strong> Revoking mint authority is irreversible. After this action, no new tokens can ever be minted, making
            the token supply permanently fixed. This action cannot be undone.
          </AlertDescription>
        </Alert>
      )}

      {!canRevokeMintAuthority && tokenInfo.mintAuthority && (
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            This token already has a mint authority assigned to a different wallet. Only that wallet can revoke the mint authority. If you
            believe you should have access, make sure you&apos;re connected with the correct wallet.
          </AlertDescription>
        </Alert>
      )}

      {!canRevokeMintAuthority && !tokenInfo.mintAuthority && (
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            This token&apos;s mint authority has already been revoked. The token supply is now permanently fixed and no new tokens can be
            minted.
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
