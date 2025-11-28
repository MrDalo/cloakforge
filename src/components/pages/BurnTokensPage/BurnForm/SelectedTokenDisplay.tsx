'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink } from 'lucide-react'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import Image from 'next/image'
import { ExplorerLink } from '@/components/common'

interface SelectedTokenDisplayProps {
  selectedTokenData: TokenWithAuthorities
}

const TokenDetails = ({ token }: { token: TokenWithAuthorities }): React.ReactNode => (
  <div className='min-w-0 flex-1'>
    <div className='font-semibold'>{token.name !== 'Unknown Token' ? token.name : token.mint}</div>
    <div className='text-muted-foreground flex items-center gap-1 text-sm'>
      <span className='shrink-0'>{token.symbol} •</span>
      <span className='truncate'>{token.mint}</span>
    </div>
    <div className='text-muted-foreground mt-1 text-xs'>Balance: {token.balance.uiAmount.toLocaleString()}</div>
  </div>
)

export const SelectedTokenDisplay = ({ selectedTokenData }: SelectedTokenDisplayProps): React.ReactNode => (
  <Card className='border-destructive bg-destructive/30'>
    <CardContent className='p-4'>
      <div className='flex w-full flex-col justify-between gap-2 sm:flex-row sm:items-center'>
        <div className='flex min-w-0 grow items-center gap-3'>
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
            className={`h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 ${selectedTokenData.image ? 'hidden' : ''}`}
          />
          <TokenDetails token={selectedTokenData} />
        </div>
        <div className='ml-12 flex shrink-0 items-center gap-2 sm:ml-0 sm:justify-end'>
          <Badge className={`${'bg-green-500 text-white'}`} variant='secondary'>
            {selectedTokenData.source === 'metaplex' ? 'Verified' : 'Valid Token'}
          </Badge>
          <Button asChild size='sm' variant='ghost'>
            <ExplorerLink path={`token/${selectedTokenData.mint}`}>
              <ExternalLink className='h-4 w-4' />
            </ExplorerLink>
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)
