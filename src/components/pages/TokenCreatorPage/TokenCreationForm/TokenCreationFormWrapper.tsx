'use client'

import React from 'react'
import { useTokenCreator } from '@/hooks/useTokenCreatorUnified'
import { TokenCreationForm } from './TokenCreationForm'

export const TokenCreationFormWrapper = (): React.ReactNode => {
  const { createToken, isWalletReady } = useTokenCreator()

  return <TokenCreationForm createToken={createToken} isWalletReady={isWalletReady} />
}
