'use client'

import { NavigationMenuLink } from '@/components/ui/navigation-menu'
import { NavigationItem } from './navigationData'

interface NavigationMenuItemProps {
  item: NavigationItem
}

export const NavigationMenuItem = ({ item }: NavigationMenuItemProps): React.ReactNode => {
  const Icon = item.icon

  return (
    <NavigationMenuLink
      className='group hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block w-fit space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none'
      href={item.href}
      key={item.title}
    >
      <div className='flex items-center space-x-3'>
        <div className='bg-primary/10 group-hover:bg-primary/20 flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-200'>
          <Icon className='text-primary size-5' />
        </div>
        <div>
          <div className='mb-1 text-sm leading-none font-medium'>{item.title}</div>
          <p className='text-muted-foreground line-clamp-2 text-xs leading-snug'>{item.description}</p>
        </div>
      </div>
    </NavigationMenuLink>
  )
}
