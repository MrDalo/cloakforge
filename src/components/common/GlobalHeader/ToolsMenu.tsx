'use client'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { toolsNavigationItems } from './navigationData'
import { NavigationMenuItem as CustomNavigationMenuItem } from './NavigationMenuItem'

export const ToolsMenu = (): React.ReactNode => (
  <NavigationMenu>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger className='hover:bg-accent text-muted-foreground hover:text-foreground bg-transparent'>
          Tools
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <div className='grid grid-cols-2 gap-3 p-6 md:w-[500px] lg:w-[600px]'>
            {toolsNavigationItems[0].items.map((item) => (
              <CustomNavigationMenuItem item={item} key={item.title} />
            ))}
          </div>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
)
