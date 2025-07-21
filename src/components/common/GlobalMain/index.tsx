'use client'
import { cn } from '@/lib/utils'
import { useSideMenuOpenStore } from '@/stores/store'
import React from 'react'

const GlobalMain = ({
  children,
  className,
  isSideMenuOpenclassName,
  isSideMenuCloseclassName,
}: {
  children: React.ReactNode
  className?: string
  isSideMenuOpenclassName?: string
  isSideMenuCloseclassName?: string
}): React.ReactNode => {
  const { isSideMenuOpen } = useSideMenuOpenStore()
  return (
    <main
      className={cn(
        'text-foreground flex h-auto w-full flex-col items-start justify-start gap-4 pb-10 lg:pb-0',
        isSideMenuOpen ? 'px-[5%] lg:px-[3%] ' + isSideMenuOpenclassName : 'px-[5%] lg:pr-[5%] lg:pl-[10%] ' + isSideMenuCloseclassName,
        className
      )}
    >
      {children}
    </main>
  )
}

export default GlobalMain
