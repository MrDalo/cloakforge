'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, Shield, ShieldX } from 'lucide-react'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import Image from 'next/image'

export interface SelectedTokenDisplayProps {
  selectedTokenData: TokenWithAuthorities
  variant?: 'default' | 'warning' | 'destructive' | 'info' | 'success'
  mode?: 'balance' | 'authority'
  authorityType?: 'mint' | 'freeze' | 'update'
}

const AUTHORITY_LABELS: Record<'mint' | 'freeze' | 'update', string> = {
  mint: 'Mint Authority',
  freeze: 'Freeze Authority',
  update: 'Update Authority',
}

const getAuthorityFields = (
  token: TokenWithAuthorities,
  authorityType: 'mint' | 'freeze' | 'update'
): { hasAuth?: boolean; authKey?: string | null } => {
  if (authorityType === 'mint') return { hasAuth: token.hasMintAuthority, authKey: token.mintAuthority }
  if (authorityType === 'freeze') return { hasAuth: token.hasFreezeAuthority, authKey: token.freezeAuthority }
  return { hasAuth: token.hasUpdateAuthority, authKey: token.updateAuthority }
}

const TokenDetails = ({
  token,
  mode,
  authorityType,
}: {
  token: TokenWithAuthorities
  mode: 'balance' | 'authority'
  authorityType?: 'mint' | 'freeze' | 'update'
}): React.ReactNode => {
  let detailsText = ''

  if (mode === 'balance') {
    detailsText = `Balance: ${token.balance.uiAmount?.toLocaleString(undefined, { maximumFractionDigits: 9 }) ?? '0'}`
  } else if (mode === 'authority' && authorityType) {
    const { hasAuth, authKey } = getAuthorityFields(token, authorityType)
    const label = AUTHORITY_LABELS[authorityType]

    detailsText = `${label}: ${authKey ? (hasAuth ? 'Your wallet' : 'Other wallet') : 'None/Revoked'}`
  }

  return (
    <div className='min-w-0 flex-1'>
      <div className='font-semibold'>{token.name !== 'Unknown Token' ? token.name : token.mint}</div>
      <div className='text-muted-foreground flex items-center gap-1 text-sm'>
        <span className='shrink-0'>{token.symbol} •</span>
        <span className='truncate'>{token.mint}</span>
      </div>
      <div className='text-muted-foreground mt-1 text-xs'>{detailsText}</div>
    </div>
  )
}

export const SelectedTokenDisplay = ({
  selectedTokenData,
  variant = 'default',
  mode = 'balance',
  authorityType,
}: SelectedTokenDisplayProps): React.ReactNode => {
  // Determine styling based on mode and state
  let cardClassName: string
  let badgeContent: React.ReactNode
  let badgeClassName: string

  if (mode === 'authority' && authorityType) {
    const { hasAuth } = getAuthorityFields(selectedTokenData, authorityType)

    if (hasAuth) {
      cardClassName = 'border-green-500 bg-green-50'
      badgeClassName = 'bg-green-500 text-white'
      badgeContent = (
        <>
          <Shield className='mr-1 h-3 w-3' />
          Can Revoke
        </>
      )
    } else {
      cardClassName = 'border-warning bg-warning/30'
      badgeClassName = 'bg-red-500 text-white'
      badgeContent = (
        <>
          <ShieldX className='mr-1 h-3 w-3' />
          No Authority
        </>
      )
    }
  } else {
    // Balance mode styling
    switch (variant) {
      case 'destructive':
        cardClassName = 'border-destructive bg-destructive/30'
        break
      case 'info':
        cardClassName = 'border-info bg-info/30'
        break
      case 'warning':
        cardClassName = 'border-warning bg-warning/30'
        break
      case 'success':
        cardClassName = 'border-green-500 bg-green-50'
        break
      default:
        cardClassName = 'border-border bg-card'
    }

    badgeClassName = 'bg-green-500 text-white'
    badgeContent = selectedTokenData.source === 'metaplex' ? 'Verified' : 'Valid Token'
  }

  return (
    <Card className={cardClassName}>
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
                unoptimized
                width={40}
              />
            ) : null}
            <div
              className={`h-10 w-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 ${selectedTokenData.image ? 'hidden' : ''}`}
            />
            <TokenDetails authorityType={authorityType} mode={mode} token={selectedTokenData} />
          </div>
          <div className='ml-12 flex shrink-0 items-center gap-2 sm:ml-0 sm:justify-end'>
            <Badge className={badgeClassName} variant='secondary'>
              {badgeContent}
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
}
