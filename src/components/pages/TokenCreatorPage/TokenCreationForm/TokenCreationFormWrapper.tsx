'use client'

import React from 'react'
import { useTokenCreator } from '@/hooks/useTokenCreatorUnified'
import { TokenCreationForm } from './TokenCreationForm'

export const TokenCreationFormWrapper = (): React.ReactNode => {
  const { createToken, isExecuting, isWalletReady } = useTokenCreator()

  return <TokenCreationForm createToken={createToken} isExecuting={isExecuting} isWalletReady={isWalletReady} />
}
