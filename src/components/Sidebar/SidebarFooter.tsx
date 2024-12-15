'use client'
import React from 'react'
import { Button } from '../ui/button'
import { WalletMinimal } from 'lucide-react'
import { useSideMenuOpenStore } from '@/stores/store'

const SidebarFooter = (): React.ReactNode => {
  const { isSideMenuOpen } = useSideMenuOpenStore()
  return (
    <div
      className={`mt-auto flex w-full flex-row flex-nowrap justify-center duration-150 ${
        isSideMenuOpen ? 'gap-2 px-4' : 'gap-0 px-2'
      }`}
    >
      <Button className='flex flex-row gap-2'>
        <WalletMinimal className='size-4' />
        <span className={`${!isSideMenuOpen && 'hidden'}`}>
          Wallet connection
        </span>
      </Button>
    </div>
  )
}

export default SidebarFooter
