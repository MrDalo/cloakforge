'use client'

import { Badge } from '@/components/ui/badge'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import Image from 'next/image'

interface TokenItemProps {
  token: TokenWithAuthorities
}

export const TokenItem = ({ token }: TokenItemProps): React.ReactNode => (
  <div className='flex w-full grow items-center justify-between gap-4'>
    <div className='flex items-center justify-start gap-4'>
      {token.image ? (
        <Image
          alt={`${token.name} logo`}
          className='h-6 w-6 rounded-full'
          height={24}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.nextElementSibling?.classList.remove('hidden')
          }}
          src={token.image}
          width={24}
        />
      ) : null}
      <div className={`h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 ${token.image ? 'hidden' : ''}`} />
      <div className='flex flex-col justify-start'>
        <div className='font-medium'>
          {token.name !== 'Unknown Token' ? token.name : `${token.mint.slice(0, 4)}...${token.mint.slice(-4)}`}
        </div>
        <div className='text-muted-foreground text-xs'>
          {token.symbol !== 'UNKNOWN' ? token.symbol : `${token.mint.slice(0, 3)}`} • {token.mint.slice(0, 8)}...
        </div>
      </div>
    </div>
    <div className='flex flex-col items-end justify-center gap-1'>
      <div className='font-medium'>{token.balance.uiAmount.toLocaleString()}</div>
      <div className='text-muted-foreground text-xs'>
        {token.source === 'metaplex' && (
          <Badge className='text-xs' variant='secondary'>
            Verified
          </Badge>
        )}
        {token.source === 'token-2022' && (
          <Badge className='text-xs' variant='outline'>
            Token-2022
          </Badge>
        )}
        {token.source === 'unknown' && (
          <Badge className='text-xs' variant='destructive'>
            No Metadata
          </Badge>
        )}
      </div>
    </div>
  </div>
)
