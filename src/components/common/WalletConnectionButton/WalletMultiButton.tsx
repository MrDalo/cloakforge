'use client'
/**
 * This file is part of the @solana/wallet-adapter-react-ui open-source project.
 * It is a modified version of the original file to fit project's needs.
 */

import React from 'react'
import { BaseWalletMultiButton } from './BaseWalletMultiButton'
import { type WalletButtonProps } from './WalletButton'

const LABELS = {
  'change-wallet': 'Change wallet',
  connecting: 'Connecting ...',
  'copy-address': 'Copy address',
  copied: 'Copied',
  disconnect: 'Disconnect',
  'has-wallet': 'Connect',
  'no-wallet': 'Select Wallet',
} as const

type WalletMultiButtonProps = WalletButtonProps & {
  onWalletClick?: () => void
}

export const WalletMultiButton = ({ onWalletClick, ...props }: WalletMultiButtonProps): React.ReactNode => (
  <BaseWalletMultiButton {...props} labels={LABELS} onWalletClick={onWalletClick} />
)
