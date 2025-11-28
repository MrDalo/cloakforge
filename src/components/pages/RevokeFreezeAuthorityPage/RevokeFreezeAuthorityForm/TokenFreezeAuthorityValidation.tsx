import React from 'react'
import { ShieldCheck, ShieldX, AlertTriangle, Info, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UseFormReturn, useWatch } from 'react-hook-form'
import { RevokeFreezeAuthorityFormData } from './revokeFreezeAuthorityFormSchema'
import { ExplorerLink } from '@/components/common'

interface TokenFreezeAuthorityValidationProps {
  form: UseFormReturn<RevokeFreezeAuthorityFormData>
}

interface TokenInfo {
  name?: string
  symbol?: string
  freezeAuthority?: string
  totalSupply?: number
  canRevokeFreezeAuthority?: boolean
}

const AuthorityIcon = ({ canRevoke }: { canRevoke: boolean }): React.ReactElement => (
  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${canRevoke ? 'bg-success' : 'bg-warning'}`}>
    {canRevoke ? <ShieldCheck className='text-success-foreground h-5 w-5' /> : <ShieldX className='text-warning-foreground h-5 w-5' />}
  </div>
)

const ExplorerButton = ({ tokenAddress }: { tokenAddress: string }): React.ReactElement => (
  <Button asChild className='p-2' size='sm' variant='ghost'>
    <ExplorerLink path={`token/${tokenAddress}`}>
      <ExternalLink className='h-4 w-4' />
    </ExplorerLink>
  </Button>
)

const TokenAuthorityDetails = ({ tokenInfo, canRevoke }: { tokenInfo: TokenInfo; canRevoke: boolean }): React.ReactElement => (
  <div className='min-w-0 flex-1'>
    <div className='font-semibold'>{tokenInfo.name || 'Unknown Token'}</div>
    <div className='text-muted-foreground flex items-center gap-1 text-sm'>
      <span className='shrink-0'>{tokenInfo.symbol || 'UNKNOWN'} •</span>
      <span className='text-xs'>{canRevoke ? 'You have freeze authority' : 'No freeze authority'}</span>
    </div>
    {tokenInfo.freezeAuthority && (
      <div className='text-muted-foreground mt-1 text-xs'>
        <span>Authority:</span>{' '}
        <code className='bg-muted rounded px-1 py-0.5'>
          {tokenInfo.freezeAuthority.slice(0, 8)}...{tokenInfo.freezeAuthority.slice(-4)}
        </code>
      </div>
    )}
    {tokenInfo.totalSupply !== undefined && (
      <div className='text-muted-foreground mt-1 text-xs'>Supply: {tokenInfo.totalSupply.toLocaleString()} tokens</div>
    )}
  </div>
)

export const TokenFreezeAuthorityValidation = ({ form }: TokenFreezeAuthorityValidationProps): React.ReactNode => {
  // Use useWatch for React Compiler compatibility
  const tokenInfo = useWatch({ control: form.control, name: 'tokenInfo' }) as TokenInfo | undefined
  const tokenAddress = useWatch({ control: form.control, name: 'tokenAddress', defaultValue: '' }) as string

  if (!tokenAddress || !tokenInfo) {
    return null
  }

  const canRevokeFreezeAuthority = tokenInfo.canRevokeFreezeAuthority

  return (
    <>
      <Card className={`${canRevokeFreezeAuthority ? 'border border-green-500 bg-green-50' : 'border-warning-foreground bg-warning'}`}>
        <CardContent className='p-4'>
          <div className='flex w-full flex-col justify-between gap-2 sm:flex-row sm:items-center'>
            <div className='flex min-w-0 grow items-center gap-3'>
              {/* Authority Icon */}
              <AuthorityIcon canRevoke={!!canRevokeFreezeAuthority} />

              {/* Token Authority Details */}
              <TokenAuthorityDetails canRevoke={!!canRevokeFreezeAuthority} tokenInfo={tokenInfo} />
            </div>

            {/* Authority Badge and Explorer Link */}
            <div className='ml-12 flex shrink-0 items-center gap-2 sm:ml-0 sm:justify-end'>
              <Badge
                className={`${canRevokeFreezeAuthority ? 'bg-success-foreground text-white' : 'bg-warning-foreground text-white'}`}
                variant='secondary'
              >
                {canRevokeFreezeAuthority ? 'Can Revoke' : 'No Authority'}
              </Badge>
              <ExplorerButton tokenAddress={tokenAddress} />
            </div>
          </div>
        </CardContent>
      </Card>

      {canRevokeFreezeAuthority && (
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <strong>Important:</strong> Revoking freeze authority is irreversible. After this action, token accounts can never be frozen or
            thawed again, and all account holders will have permanent, unrestricted access to their tokens. This action cannot be undone.
          </AlertDescription>
        </Alert>
      )}

      {!canRevokeFreezeAuthority && tokenInfo.freezeAuthority && (
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            This token already has a freeze authority assigned to a different wallet. Only that wallet can revoke the freeze authority. If
            you believe you should have access, make sure you&apos;re connected with the correct wallet.
          </AlertDescription>
        </Alert>
      )}

      {!canRevokeFreezeAuthority && !tokenInfo.freezeAuthority && (
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            This token&apos;s freeze authority has already been revoked. Token accounts can no longer be frozen or thawed, giving all
            holders permanent access to their tokens.
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
