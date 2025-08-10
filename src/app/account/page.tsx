'use client'

import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import NotConnectedWallet from '@/components/pages/AccountPage/NotConnectedWallet'
import ConnectedAccountContent from '@/components/pages/AccountPage/ConnectedAccountContent'

const AccountPage: React.FC = () => {
  const { publicKey } = useWallet()
  const [page] = useState(1)

  // Not connected state - use same layout as HeroSection
  if (!publicKey) {
    return <NotConnectedWallet />
  }

  // Now that we have publicKey, we can render the connected component
  return <ConnectedAccountContent page={page} publicKey={publicKey} />
}

export default AccountPage
