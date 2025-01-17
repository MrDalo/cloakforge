'use client'

import React from 'react'
import { useSideMenuOpenStore } from '@/stores/store'
import BurgerButton from '@/../public/burger-button.svg'
import WalletConnectionButton from '../Sidebar/WalletConnectionButton/WalletConnectionButton'

const Header = (): React.ReactNode => {
  const { toggleSideMenuState } = useSideMenuOpenStore()
  return (
    <header className='flex h-[84px] w-full flex-row items-start justify-between gap-0 px-6 pt-6 lg:hidden'>
      <BurgerButton
        className='mr-5 mt-3 cursor-pointer'
        onClick={() => toggleSideMenuState()}
      />

      <WalletConnectionButton />
    </header>
  )
}

export default Header
