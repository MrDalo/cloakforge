import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Key, Coins, Infinity as InfinityIcon } from 'lucide-react'

interface AuthorityStatusFormProps {
  tokenMint?: string
}

export const AuthorityStatusForm = ({ tokenMint }: AuthorityStatusFormProps): React.ReactNode => {
  if (!tokenMint) return null

  return (
    <div className='space-y-6'>
      <h3 className='flex items-center space-x-2 text-lg font-medium'>
        <Key className='text-secondary h-5 w-5' />
        <span>Authority Status</span>
      </h3>

      <Card className='bg-secondary/5 border-secondary/20'>
        <CardContent className='space-y-4 p-6'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-3'>
              <Coins className='text-secondary h-5 w-5' />
              <span className='font-medium'>Current Mint Authority</span>
            </div>
            <Badge className='bg-secondary/10 text-secondary' variant='secondary'>
              Active
            </Badge>
          </div>

          <p className='text-muted-foreground text-sm'>You currently have the ability to mint additional tokens and increase supply</p>

          <div className='bg-background rounded-lg border p-3'>
            <div className='text-muted-foreground mb-1 text-xs'>Authority Address:</div>
            <div className='font-mono text-sm break-all'>7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU</div>
          </div>
        </CardContent>
      </Card>

      <motion.div
        animate={{ opacity: 1, height: 'auto' }}
        className='border-secondary/20 bg-secondary/5 rounded-lg border p-4'
        initial={{ opacity: 0, height: 0 }}
      >
        <div className='mb-2 flex items-center space-x-2'>
          <InfinityIcon className='text-secondary h-4 w-4' />
          <span className='text-sm font-medium'>After Revocation:</span>
        </div>
        <ul className='text-muted-foreground ml-6 space-y-1 text-sm'>
          <li>• Token supply becomes permanently fixed</li>
          <li>• No additional tokens can ever be minted</li>
          <li>• Mint authority will be set to null forever</li>
          <li>• This action cannot be undone</li>
        </ul>
      </motion.div>
    </div>
  )
}
