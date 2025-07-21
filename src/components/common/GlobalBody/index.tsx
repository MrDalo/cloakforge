'use client'
import { useSideMenuOpenStore } from '@/stores/store'
import { DM_Sans } from 'next/font/google'
import React from 'react'

const DMSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
})

const GlobalBody = ({ children }: { children: React.ReactNode }): React.ReactNode => {
  const { isSideMenuOpen } = useSideMenuOpenStore()
  return (
    <body
      className={`${DMSans.variable} font-dm-sans relative flex flex-col flex-nowrap scroll-smooth antialiased ${isSideMenuOpen ? 'overflow-y-hidden' : 'overflow-y-auto'} bg-background w-full`}
    >
      {children}
    </body>
  )
}

export default GlobalBody
