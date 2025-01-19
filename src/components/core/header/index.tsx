'use client'

import React from 'react'
import { useSideMenuOpenStore } from '@/stores/store'
import BurgerButton from '@/../public/burger-button.svg'
import WalletConnectionButton from '../../ui/WalletConnectionButton/WalletConnectionButton'

const Header = (): React.ReactNode => {
  const { toggleSideMenuState } = useSideMenuOpenStore()
  return (
    <header className='flex h-[84px] w-full flex-row items-start justify-between gap-0 px-6 pt-6 lg:flex-row-reverse'>
      <BurgerButton
        className='mr-5 mt-3 flex cursor-pointer lg:hidden'
        onClick={() => toggleSideMenuState()}
      />

      <WalletConnectionButton />
    </header>
  )
}

export default Header
