import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { TooltipArrow } from '@radix-ui/react-tooltip'
import Link from 'next/link'
import React from 'react'

type NavListItemProps = {
  isActive: boolean
  isOpen: boolean
  title: string
  href: string
  className?: string
  children: React.ReactNode
  onClickFunction?: () => void
}

const NavListItem = ({
  className,
  title,
  href = '/',
  isActive,
  isOpen,
  children,
  onClickFunction,
}: NavListItemProps): React.ReactNode => (
  <li className='w-full'>
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger className='w-full'>
          <Link
            className={cn(
              'group flex select-none flex-row items-center gap-3 rounded-lg py-2 leading-none text-foreground no-underline outline-hidden transition-colors duration-100 lg:hover:bg-primary-hover lg:hover:text-background',
              className,
              isActive && 'bg-primary text-background',
              isOpen ? 'justify-start px-3' : 'w-full justify-center px-0'
            )}
            href={href}
            onClick={onClickFunction}
          >
            <p
              className={cn(
                'text-base sm:text-sm',
                isActive && 'text-background'
              )}
            >
              {children}
            </p>
            {isOpen && (
              <p className='h-full whitespace-nowrap text-base font-normal sm:text-sm'>
                {title}
              </p>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent
          arrowPadding={10}
          className='hidden border-0 lg:inline-block'
          side='right'
        >
          <p>{title}</p>
          <TooltipArrow className='border-0 fill-primary-hover' />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </li>
)
NavListItem.displayName = 'NavListItem'

export { NavListItem }
