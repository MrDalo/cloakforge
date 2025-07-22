'use client'

import { Home } from 'lucide-react'
import Link from 'next/link'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { othersNavigationItems, toolsNavigationItems } from './navigationData'

interface MobileNavigationMenuProps {
  onLinkClick: () => void
}

export const MobileNavigationMenu = ({ onLinkClick }: MobileNavigationMenuProps): React.ReactNode => (
  <nav className='flex flex-col space-y-4'>
    {/* Home */}
    <Link
      className='hover:bg-accent flex items-center space-x-3 rounded-lg p-3 transition-colors duration-200'
      href='/'
      onClick={onLinkClick}
    >
      <div className='bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
        <Home className='text-primary h-4 w-4' />
      </div>
      <span>Home</span>
    </Link>

    {/* Navigation Sections */}
    <Accordion className='w-full' collapsible type='single'>
      {/* Tools Section */}
      <AccordionItem className='border-b-0' value='tools'>
        <AccordionTrigger className='hover:bg-accent rounded-lg p-3 hover:no-underline'>
          <h3 className='text-muted-foreground text-sm font-medium'>Tools</h3>
        </AccordionTrigger>
        <AccordionContent className='pt-0 pb-2'>
          <div className='space-y-1 pl-3'>
            {toolsNavigationItems[0].items.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  className='hover:bg-accent flex items-center space-x-3 rounded-lg p-3 transition-colors duration-200'
                  href={item.href}
                  key={item.title}
                  onClick={onLinkClick}
                >
                  <div className='bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
                    <Icon className='text-primary h-4 w-4' />
                  </div>
                  <div>
                    <div className='text-sm font-medium'>{item.title}</div>
                    <p className='text-muted-foreground line-clamp-1 text-xs'>{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Others Section */}
      <AccordionItem className='border-b-0' value='others'>
        <AccordionTrigger className='hover:bg-accent rounded-lg p-3 hover:no-underline'>
          <h3 className='text-muted-foreground text-sm font-medium'>Others</h3>
        </AccordionTrigger>
        <AccordionContent className='pt-0 pb-2'>
          <div className='space-y-1 pl-3'>
            {othersNavigationItems[0].items.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  className='hover:bg-accent flex items-center space-x-3 rounded-lg p-3 transition-colors duration-200'
                  href={item.href}
                  key={item.title}
                  onClick={onLinkClick}
                >
                  <div className='bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg'>
                    <Icon className='text-primary h-4 w-4' />
                  </div>
                  <div>
                    <div className='text-sm font-medium'>{item.title}</div>
                    <p className='text-muted-foreground line-clamp-1 text-xs'>{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </nav>
)
