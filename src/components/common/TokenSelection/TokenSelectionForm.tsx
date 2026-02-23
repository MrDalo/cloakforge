'use client'

import { useState } from 'react'
import { type Control } from 'react-hook-form'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'
import { type TokenSelectionMode, type TokenValidationFunction } from './types'
import { TokenSelectionModeToggle } from './TokenSelectionModeToggle'
import { WalletTokensList } from './WalletTokensList'
import { ManualTokenEntry } from './ManualTokenEntry'

interface TokenSelectionConfig {
  hookName:
    | 'useWalletTokensForBurnTool'
    | 'useWalletTokensForRevokeMintAuthority'
    | 'useWalletTokensForRevokeFreezeAuthority'
    | 'useWalletTokensForFreezeWallets'
    | 'useWalletTokensForUnfreezeWallets'
    | 'useWalletTokensForTransactionMultisender'
  context: string
  tokenFilter?: (token: TokenWithAuthorities) => boolean
  emptyStateMessage?: string
  selectLabel?: string
  placeholder?: string
  validateToken: TokenValidationFunction
  helpText?: string
  useMintAsValue?: boolean
}

interface TokenSelectionFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  onTokenSelect: (tokenAddress: string) => void
  selectedTokenData?: TokenWithAuthorities
  onSelectedTokenDataChange: (tokenData?: TokenWithAuthorities) => void
  config: TokenSelectionConfig
  defaultMode?: TokenSelectionMode
}

export const TokenSelectionForm = ({
  control,
  onTokenSelect,
  selectedTokenData,
  onSelectedTokenDataChange,
  config,
  defaultMode = 'wallet',
}: TokenSelectionFormProps): React.ReactNode => {
  const [selectionMode, setSelectionMode] = useState<TokenSelectionMode>(defaultMode)

  const handleModeChange = (mode: TokenSelectionMode): void => {
    setSelectionMode(mode)
    // Clear selection when switching modes
    onSelectedTokenDataChange(undefined)
  }

  return (
    <div className='space-y-6'>
      <TokenSelectionModeToggle mode={selectionMode} onModeChange={handleModeChange} />

      {selectionMode === 'wallet' ?
        <WalletTokensList
          context={config.context}
          control={control}
          emptyStateMessage={config.emptyStateMessage}
          hookName={config.hookName}
          onSelectedTokenDataChange={onSelectedTokenDataChange}
          onTokenSelect={onTokenSelect}
          placeholder={config.placeholder}
          selectLabel={config.selectLabel}
          selectedTokenData={selectedTokenData}
          tokenFilter={config.tokenFilter}
          useMintAsValue={config.useMintAsValue}
        />
      : <ManualTokenEntry
          context={config.context}
          control={control}
          description={config.helpText}
          onSelectedTokenDataChange={onSelectedTokenDataChange}
          validateToken={config.validateToken}
        />
      }
    </div>
  )
}
