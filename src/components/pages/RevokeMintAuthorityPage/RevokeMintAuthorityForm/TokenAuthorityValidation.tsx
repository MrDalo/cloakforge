import { motion } from 'framer-motion'
import { Shield, ShieldCheck, ShieldX, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

const AuthorityHeader = ({ canRevoke }: { canRevoke: boolean }): React.ReactNode => (
  <div className='flex items-center gap-2'>
    <h4 className='font-semibold'>{canRevoke ? 'Authority Verified' : 'No Authority'}</h4>
    <Badge className={canRevoke ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} variant='secondary'>
      {canRevoke ? 'Can Revoke' : 'Cannot Revoke'}
    </Badge>
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
    <motion.div animate={{ opacity: 1, y: 0 }} className='space-y-6' initial={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }}>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <Shield className='text-warning-foreground/80 h-5 w-5' />
        <span>Authority Validation</span>
      </h3>

      <Card className={`border-2 ${canRevokeMintAuthority ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
        <CardContent className='p-4'>
          <div className='flex items-start gap-4'>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${canRevokeMintAuthority ? 'bg-green-100' : 'bg-red-100'}`}
            >
              {canRevokeMintAuthority ? <ShieldCheck className='h-5 w-5 text-green-600' /> : <ShieldX className='h-5 w-5 text-red-600' />}
            </div>

            <div className='flex-1'>
              <AuthorityHeader canRevoke={!!canRevokeMintAuthority} />

              <p className='text-muted-foreground mt-1 text-sm'>
                {canRevokeMintAuthority
                  ? `You are the mint authority for ${tokenInfo.name} (${tokenInfo.symbol}). You can revoke this authority to make the token supply fixed forever.`
                  : `You are not the mint authority for ${tokenInfo.name} (${tokenInfo.symbol}). Only the current mint authority can revoke this permission.`}
              </p>

              {tokenInfo.mintAuthority && (
                <div className='mt-3 space-y-2'>
                  <div className='text-xs'>
                    <span className='text-muted-foreground'>Current Mint Authority:</span>
                    <br />
                    <code className='bg-muted rounded px-1 py-0.5 text-xs'>{tokenInfo.mintAuthority}</code>
                  </div>
                  {tokenInfo.totalSupply !== undefined && (
                    <div className='text-xs'>
                      <span className='text-muted-foreground'>Current Supply:</span>{' '}
                      <span className='font-mono'>{tokenInfo.totalSupply.toLocaleString()}</span> tokens
                    </div>
                  )}
                </div>
              )}
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
    </motion.div>
  )
}
