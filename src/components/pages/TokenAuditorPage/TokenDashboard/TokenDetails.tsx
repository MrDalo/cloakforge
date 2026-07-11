'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Info, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { XLogo } from '@/components/common/XLogo'
import { type TokenData } from '../tokenAuditorData'

interface TokenDetailsProps {
  tokenData: TokenData
}

export const TokenDetails = ({ tokenData }: TokenDetailsProps): React.ReactNode => (
  <motion.div animate={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: -30 }} transition={{ duration: 0.8 }}>
    <Card className='border-border border-2'>
      <CardHeader className='from-primary/5 to-secondary/5 border-border border-b bg-gradient-to-r'>
        <CardTitle className='flex items-center space-x-2'>
          <Info className='text-primary h-5 w-5' />
          <span>Token Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6 p-6'>
        {/* Token Logo and Basic Info */}
        <div className='flex items-center space-x-4'>
          <Image
            alt={tokenData.name}
            className='border-border h-16 w-16 rounded-full border-2'
            height={64}
            src={tokenData.metadata.image?.trim() || '/token-fallback.svg'}
            width={64}
          />
          <div>
            <h3 className='text-xl font-medium'>{tokenData.name}</h3>
            <p className='text-muted-foreground'>{tokenData.symbol}</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label className='text-sm font-medium'>Description</Label>
          <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>{tokenData.metadata.description}</p>
        </div>

        {/* Technical Details */}
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <Label className='text-sm font-medium'>Decimals</Label>
            <p className='text-sm'>{tokenData.decimals}</p>
          </div>
          <div>
            <Label className='text-sm font-medium'>Total Supply</Label>
            <p className='text-sm'>{tokenData.supply}</p>
          </div>
        </div>

        {/* Social Links */}
        {(tokenData.metadata.website || tokenData.metadata.twitter || tokenData.metadata.telegram) && (
          <div>
            <Label className='mb-2 block text-sm font-medium'>Links</Label>
            <div className='flex space-x-2'>
              {tokenData.metadata.website && (
                <Button asChild size='sm' variant='outline'>
                  <a href={tokenData.metadata.website} rel='noopener noreferrer' target='_blank'>
                    <Globe className='mr-1 h-4 w-4' />
                    Website
                  </a>
                </Button>
              )}
              {tokenData.metadata.twitter && (
                <Button asChild size='sm' variant='outline'>
                  <a href={tokenData.metadata.twitter} rel='noopener noreferrer' target='_blank'>
                    <XLogo className='mr-1' size='sm' />
                    Twitter
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </motion.div>
)
