import { type Control, type FieldValues } from 'react-hook-form'
import { type Connection, type PublicKey } from '@solana/web3.js'
import { type TokenWithAuthorities } from '@/hooks/queries/useWalletTokensForTool'

// Base form data interface that all token selection forms must extend
export interface BaseTokenFormData extends FieldValues {
  tokenAddress: string
}

// Token validation result
export interface TokenValidationResult {
  isValid: boolean
  tokenData?: TokenWithAuthorities
  error?: string
}

// Token validation function type
export type TokenValidationFunction = (tokenAddress: PublicKey, connection: Connection) => Promise<TokenValidationResult>

// Token selection mode
export type TokenSelectionMode = 'wallet' | 'manual'

// Common props for wallet tokens list component
export interface WalletTokensListProps<T extends BaseTokenFormData> {
  control: Control<T>
  onTokenSelect: (tokenAddress: string) => void
  selectedTokenData?: TokenWithAuthorities
  onSelectedTokenDataChange: (tokenData?: TokenWithAuthorities) => void
  tokenFilter?: (token: TokenWithAuthorities) => boolean
  emptyStateMessage?: string
  selectLabel?: string
  placeholder?: string
}

// Common props for manual token entry component
export interface ManualTokenEntryProps<T extends BaseTokenFormData> {
  control: Control<T>
  onSelectedTokenDataChange: (tokenData?: TokenWithAuthorities) => void
  validateToken: TokenValidationFunction
  placeholder?: string
  label?: string
  description?: string
  context: string
}

// Token selection mode toggle props
export interface TokenSelectionModeToggleProps {
  mode: TokenSelectionMode
  onModeChange: (mode: TokenSelectionMode) => void
  className?: string
}
