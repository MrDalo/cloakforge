'use client'

import WalletConnectionButton from '@/components/Sidebar/WalletConnectionButton/WalletConnectionButton'

const Home = (): React.ReactNode => (
  <div className=''>
    <WalletConnectionButton className='absolute right-6 top-6 z-50 hidden lg:inline-block' />
  </div>
)

export default Home
