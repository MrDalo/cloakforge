'use client'
/**
 * This file is part of the @solana/wallet-adapter-react-ui open-source project.
 * It is a modified version of the original file to fit project's needs.
 */

import type { WalletName } from '@solana/wallet-adapter-base'
import React from 'react'
import { WalletIcon } from '@solana/wallet-adapter-react-ui'
import { WalletButton } from './wallet-button'

type Props = React.ComponentProps<typeof WalletButton> & {
  walletIcon?: string
  walletName?: WalletName
}

export const BaseWalletConnectionButton = ({
  walletIcon,
  walletName,
  ...props
}: Props): React.ReactNode => (
  <WalletButton
    {...props}
    className='wallet-adapter-button-trigger'
    startIcon={
      walletIcon && walletName ? (
        <WalletIcon
          wallet={{ adapter: { icon: walletIcon, name: walletName } }}
        />
      ) : undefined
    }
  />
)
