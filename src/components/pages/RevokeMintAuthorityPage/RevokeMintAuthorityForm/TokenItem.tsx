'use client'

import { Badge } from '@/components/ui/badge'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import Image from 'next/image'

interface TokenItemProps {
  token: TokenWithAuthorities
}

export const TokenItem = ({ token }: TokenItemProps): React.ReactNode => (
  <div className='flex w-full items-center justify-between gap-2'>
    <div className='flex min-w-0 flex-1 items-center justify-start gap-2'>
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
      <div className='min-w-0 flex-1 flex-col justify-start'>
        <div className='truncate text-left font-medium'>{token.name !== 'Unknown Token' ? token.name : token.symbol}</div>
        <div className='text-muted-foreground flex items-center gap-1 text-left text-xs'>
          <span className='shrink-0'>{token.symbol !== 'UNKNOWN' ? token.symbol : 'UNKNOWN'} •</span>
          <span className='truncate'>{token.mint}</span>
        </div>
      </div>
    </div>
    <div className='flex shrink-0 flex-col items-end justify-center gap-1'>
      <div className='text-muted-foreground text-xs'>
        {token.mintAuthority && (
          <Badge className='text-xs' variant='secondary'>
            Can Revoke
          </Badge>
        )}
        {!token.mintAuthority && (
          <Badge className='text-xs' variant='destructive'>
            No Authority
          </Badge>
        )}
      </div>
      <div className='text-muted-foreground hidden text-xs sm:inline-block'>
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
