/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/jsx-max-depth */
import { TokenAccountsReponseType } from '@/app/api/solana/token-accounts/route-commented'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { ChevronsUpDown } from 'lucide-react'
import React from 'react'

type Props = {
  tokens: TokenAccountsReponseType[]
}

const TokensPopover = ({ tokens }: Props): React.ReactNode => {
  const [open, setOpen] = React.useState(false)

  const sortedTokens = React.useMemo(
    () => [...tokens].sort((a, b) => b.amount - a.amount),
    [tokens]
  )

  if (sortedTokens.length === 0) {
    return <p className='text-gray-400'>No other tokens in you wallet</p>
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className='w-full justify-between gap-4'
          role='combobox'
          variant='outline'
        >
          <div className='flex flex-row items-center gap-1'>
            <img
              alt={`${sortedTokens[0].name} logo`}
              className='size-5 rounded-sm'
              src={sortedTokens[0].token_image || '/unknown-token.png'}
            />
            <span className='text-xs'>{sortedTokens[0].name}</span>
            <span className='text-xs text-gray-400'>
              {sortedTokens[0].symbol}
            </span>
          </div>
          <div className='flex flex-row items-center gap-1'>
            <span className='text-xs'>{sortedTokens[0].amount.toFixed(4)}</span>
            <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className='max-h-[240px] min-w-[300px] overflow-auto p-0 shadow-lg'>
        <ul className='w-full'>
          {sortedTokens.map((token, index) => (
            <li
              className={cn(
                'flex w-full items-center justify-between gap-4 bg-card p-2 hover:bg-gray-100'
              )}
              key={index}
            >
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger className='w-full' tabIndex={-1}>
                    <a
                      className='flex w-full items-center justify-between'
                      href={`https://solscan.io/token/${token.token_address}`}
                      rel='noreferrer'
                      target='_blank'
                    >
                      <div className='flex flex-row items-center gap-1'>
                        <img
                          alt={`${token.name} logo`}
                          className='size-5 rounded-sm'
                          src={token.token_image || '/unknown-token.png'}
                        />
                        <span className='text-xs'>{token.name}</span>
                        <span className='text-xs text-gray-400'>
                          {token.symbol}
                        </span>
                      </div>
                      <span className='text-xs'>{token.amount.toFixed(4)}</span>
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='flex flex-col items-center gap-1 text-xs'>
                      <span className='font-bold'>{token.symbol}</span>
                      <span>{token.token_address}</span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

export default TokensPopover
