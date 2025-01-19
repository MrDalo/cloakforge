'use client'

import React from 'react'
import { useSideMenuOpenStore } from '@/stores/store'
import SidebarNavigation from './SidebarNavigation'
import SidebarHeader from './SidebarHeader'

const Sidebar = (): React.ReactNode => {
  const { isSideMenuOpen } = useSideMenuOpenStore()

  return (
    <aside
      className={`default-box-shadow fixed top-0 z-50 flex h-dvh w-[90%] flex-col flex-nowrap items-start justify-start gap-10 overflow-y-auto overflow-x-hidden pb-10 pt-6 duration-300 lg:min-w-[240px] lg:max-w-[240px] lg:rounded-r-xl ${
        isSideMenuOpen
          ? 'left-0 bg-card lg:relative lg:pl-0'
          : 'left-[calc((-100vw))] bg-transparent pl-[calc((100vw-70px))] lg:absolute lg:left-[-160px] lg:bg-card lg:pl-[160px]'
      } `}
    >
      <SidebarHeader />
      <SidebarNavigation />
      {/* <SidebarFooter /> */}
    </aside>
  )
}

export default Sidebar
