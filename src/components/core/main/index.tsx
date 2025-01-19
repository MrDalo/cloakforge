'use client'
import { cn } from '@/lib/utils'
import { useSideMenuOpenStore } from '@/stores/store'
import React from 'react'

const Main = ({
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
        'flex min-h-screen w-full flex-col items-start justify-start gap-4 overflow-x-hidden pb-10 text-foreground lg:overflow-y-auto lg:pb-0',
        isSideMenuOpen
          ? 'px-[5%] lg:px-[3%] ' + isSideMenuOpenclassName
          : 'px-[5%] lg:pl-[10%] lg:pr-[5%] ' + isSideMenuCloseclassName,
        className
      )}
    >
      {children}
    </main>
  )
}

export default Main
