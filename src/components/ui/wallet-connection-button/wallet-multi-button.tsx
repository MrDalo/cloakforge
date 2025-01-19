'use client'
/**
 * This file is part of the @solana/wallet-adapter-react-ui open-source project.
 * It is a modified version of the original file to fit project's needs.
 */

import React from 'react'
import { BaseWalletMultiButton } from './base-wallet-multi-button'
import { WalletButtonProps } from './wallet-button'

const LABELS = {
  'change-wallet': 'Change wallet',
  connecting: 'Connecting ...',
  'copy-address': 'Copy address',
  copied: 'Copied',
  disconnect: 'Disconnect',
  'has-wallet': 'Connect',
  'no-wallet': 'Select Wallet',
} as const

export const WalletMultiButton = (
  props: WalletButtonProps
): React.ReactNode => <BaseWalletMultiButton {...props} labels={LABELS} />
