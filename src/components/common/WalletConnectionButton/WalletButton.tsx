'use client'
/**
 * This file is part of the @solana/wallet-adapter-react-ui open-source project.
 * It is a modified version of the original file to fit project's needs.
 */

import React, { CSSProperties, FC, MouseEvent, PropsWithChildren, ReactElement } from 'react'

export type WalletButtonProps = PropsWithChildren<{
	className?: string
	disabled?: boolean
	endIcon?: ReactElement
	onClick?: (e: MouseEvent<HTMLButtonElement>) => void
	startIcon?: ReactElement
	style?: CSSProperties
	tabIndex?: number
}>

export const WalletButton: FC<WalletButtonProps> = (props) => (
	<button
		className={`wallet-adapter-button ${props.className || ''}`}
		disabled={props.disabled}
		onClick={props.onClick}
		style={props.style}
		tabIndex={props.tabIndex || 0}
		type='button'
	>
		{props.startIcon && <i className='wallet-adapter-button-start-icon'>{props.startIcon}</i>}
		{props.children}
		{props.endIcon && <i className='wallet-adapter-button-end-icon'>{props.endIcon}</i>}
	</button>
)
