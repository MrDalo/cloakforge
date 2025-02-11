'use client'

import React from 'react'
import { useSideMenuOpenStore } from '@/stores/store'
import SidebarHeader from './sidebar-header'
import SidebarNavigation from './sidebar-navigation'
import { cn } from '@/lib/utils'

const Sidebar = (): React.ReactNode => {
  const { isSideMenuOpen } = useSideMenuOpenStore()

  return (
    <aside
      className={cn(
        'absolute left-0 top-0 z-30 box-border h-screen w-[90vw] shrink-0 overflow-hidden',
        'border-r border-border bg-card px-5 py-5 duration-300 lg:relative lg:w-72',
        isSideMenuOpen ? 'w-[90vw] px-5 lg:w-64' : 'w-0 px-0 lg:w-20 lg:px-2'
      )}
      data-testid='sidebar'
    >
      <div className='flex size-full flex-col flex-nowrap items-start justify-start gap-2'>
        <SidebarHeader />
        <SidebarNavigation />
        {/* <SidebarFooter /> */}
      </div>
    </aside>
  )
}

export default Sidebar
