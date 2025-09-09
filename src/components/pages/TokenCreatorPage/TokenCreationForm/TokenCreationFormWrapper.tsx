'use client'

import React from 'react'
import { useTokenCreator } from '@/hooks/solana/useTokenCreator'
import { TokenCreationForm } from './TokenCreationForm'

export const TokenCreationFormWrapper = (): React.ReactNode => {
  const { createToken, isWalletReady, lastResult, reset } = useTokenCreator()

  return <TokenCreationForm createToken={createToken} isWalletReady={isWalletReady} lastResult={lastResult} reset={reset} />
}
