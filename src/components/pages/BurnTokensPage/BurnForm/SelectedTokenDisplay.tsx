'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import Image from 'next/image'

interface SelectedTokenDisplayProps {
  selectedTokenData: TokenWithAuthorities
}

export const SelectedTokenDisplay = ({ selectedTokenData }: SelectedTokenDisplayProps): React.ReactNode => (
  <Card className='border-destructive bg-destructive/30'>
    <CardContent className='p-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {selectedTokenData.image ? (
            <Image
              alt={`${selectedTokenData.name} logo`}
              className='h-10 w-10 rounded-full'
              height={40}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.classList.remove('hidden')
              }}
              src={selectedTokenData.image}
              width={40}
            />
          ) : null}
          <div
            className={`h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ${selectedTokenData.image ? 'hidden' : ''}`}
          />
          <div>
            <div className='font-semibold'>
              {selectedTokenData.name !== 'Unknown Token' ? selectedTokenData.name : selectedTokenData.symbol}
            </div>
            <div className='text-muted-foreground text-sm'>
              {selectedTokenData.symbol} • {selectedTokenData.mint.slice(0, 8)}...
            </div>
            <div className='text-muted-foreground mt-1 text-xs'>Balance: {selectedTokenData.balance.uiAmount.toLocaleString()}</div>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Badge className={`${'bg-green-500 text-white'}`} variant='secondary'>
            {selectedTokenData.source === 'metaplex' ? 'Verified' : 'Valid Token'}
          </Badge>
          <Button
            onClick={() => window.open(`https://solscan.io/token/${selectedTokenData.mint}`, '_blank')}
            size='sm'
            type='button'
            variant='ghost'
          >
            <ExternalLink className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)
