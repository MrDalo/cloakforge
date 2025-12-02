'use client'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { othersNavigationItems } from './navigationData'
import { NavigationMenuItem as CustomNavigationMenuItem } from './NavigationMenuItem'

export const OthersMenu = (): React.ReactNode => (
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger className='hover:bg-accent text-muted-foreground hover:text-foreground bg-transparent'>
          Others
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className='grid w-fit max-w-[500px] min-w-60 gap-3 p-6'>
            {othersNavigationItems[0].items.map((item) => (
              <CustomNavigationMenuItem item={item} key={item.title} />
            ))}
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
)
