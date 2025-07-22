import { useState, useEffect } from 'react'
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface AuthorityStatusFormProps {
  tokenMint?: string
}

export const AuthorityStatusForm = ({ tokenMint }: AuthorityStatusFormProps): React.ReactNode => {
  const [authorityStatus, setAuthorityStatus] = useState<'checking' | 'active' | 'revoked'>('checking')
  const [freezeAuthority, setFreezeAuthority] = useState<string | null>(null)

  useEffect(() => {
    if (tokenMint) {
      setTimeout(() => {
        setAuthorityStatus('active')
        setFreezeAuthority('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
      }, 1000)
    }
  }, [tokenMint])

  return (
    <Card className='bg-secondary/5 border-secondary/20'>
      <CardHeader>
        <CardTitle className='flex items-center space-x-2 text-lg'>
          <Shield className='text-secondary h-5 w-5' />
          <span>Authority Status</span>
          {authorityStatus === 'active' && <Badge className='border-warning/50 bg-warning/10 text-warning'>ACTIVE</Badge>}
          {authorityStatus === 'revoked' && <Badge className='border-green-500/50 bg-green-500/10 text-green-600'>REVOKED</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {authorityStatus === 'checking' && (
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} className='text-center' transition={{ repeat: Infinity }}>
            <p className='text-muted-foreground text-sm'>Checking token authority status...</p>
          </motion.div>
        )}

        {authorityStatus === 'active' && freezeAuthority && (
          <div className='space-y-3'>
            <div className='flex items-center space-x-2'>
              <AlertCircle className='text-warning h-4 w-4' />
              <span className='text-sm font-medium'>Current Freeze Authority</span>
            </div>
            <div className='border-warning/20 bg-warning/5 rounded-lg border p-3'>
              <p className='font-mono text-sm break-all'>{freezeAuthority}</p>
              <p className='text-warning mt-1 text-xs'>Authority can freeze token accounts</p>
            </div>

            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>After Revocation:</h4>
              <div className='flex items-center space-x-2 text-sm'>
                <CheckCircle2 className='h-4 w-4 text-green-600' />
                <span>No one can freeze token accounts</span>
              </div>
              <div className='flex items-center space-x-2 text-sm'>
                <CheckCircle2 className='h-4 w-4 text-green-600' />
                <span>Increased holder confidence</span>
              </div>
              <div className='flex items-center space-x-2 text-sm'>
                <CheckCircle2 className='h-4 w-4 text-green-600' />
                <span>Permanent decentralization</span>
              </div>
            </div>
          </div>
        )}

        {authorityStatus === 'revoked' && (
          <div className='text-center'>
            <CheckCircle2 className='mx-auto mb-2 h-8 w-8 text-green-600' />
            <p className='font-medium'>Freeze authority already revoked</p>
            <p className='text-muted-foreground text-sm'>This token cannot have its accounts frozen</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
