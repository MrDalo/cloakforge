'use client'
/**
 * This file is part of the @solana/wallet-adapter-react-ui open-source project.
 * It is a modified version of the original file to fit project's needs.
 */

import { useWalletMultiButton } from '@solana/wallet-adapter-base-ui'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Copy, LogOut, User, WalletMinimal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BaseWalletConnectionButton } from './BaseWalletConnectionButton'
import { WalletButtonProps } from './WalletButton'

type Props = WalletButtonProps & {
	labels: Omit<
		{
			[TButtonState in ReturnType<typeof useWalletMultiButton>['buttonState']]: string
		},
		'connected' | 'disconnecting'
	> & {
		'copy-address': string
		copied: string
		'change-wallet': string
		disconnect: string
	}
}

export const BaseWalletMultiButton = ({ children, labels, ...props }: Props): React.ReactNode => {
	const { setVisible: setModalVisible } = useWalletModal()
	const { buttonState, onConnect, onDisconnect, publicKey, walletIcon, walletName } = useWalletMultiButton({
		onSelectWallet() {
			setModalVisible(true)
		},
	})
	const router = useRouter()
	const [copied, setCopied] = useState(false)
	const [menuOpen, setMenuOpen] = useState(false)
	const ref = useRef<HTMLUListElement>(null)
	useEffect(() => {
		const listener = (event: MouseEvent | TouchEvent): void => {
			const node = ref.current

			// Do nothing if clicking dropdown or its descendants
			if (!node || node.contains(event.target as Node)) return

			setMenuOpen(false)
		}

		document.addEventListener('mousedown', listener)
		document.addEventListener('touchstart', listener)

		return (): void => {
			document.removeEventListener('mousedown', listener)
			document.removeEventListener('touchstart', listener)
		}
	}, [])
	const content = useMemo(() => {
		if (children) {
			return children
		} else if (publicKey) {
			const base58 = publicKey.toBase58()
			return base58.slice(0, 4) + '..' + base58.slice(-4)
		} else if (buttonState === 'connecting' || buttonState === 'has-wallet') {
			return labels[buttonState]
		} else {
			return labels['no-wallet']
		}
	}, [buttonState, children, labels, publicKey])
	return (
		<div className='wallet-adapter-dropdown'>
			<BaseWalletConnectionButton
				{...props}
				aria-expanded={menuOpen}
				className={cn('flex flex-row items-center justify-center gap-1', props.className)}
				onClick={() => {
					switch (buttonState) {
						case 'no-wallet':
							setModalVisible(true)
							break
						case 'has-wallet':
							if (onConnect) {
								onConnect()
							}
							break
						case 'connected':
							setMenuOpen(true)
							break
					}
				}}
				style={{ pointerEvents: menuOpen ? 'none' : 'auto', ...props.style }}
				walletIcon={walletIcon}
				walletName={walletName}
			>
				{buttonState === 'no-wallet' && (
					<span className='wallet-adapter-button-start-icon'>
						<WalletMinimal size={24} />
					</span>
				)}
				<p>{content}</p>
			</BaseWalletConnectionButton>
			<ul
				aria-label='dropdown-list'
				className={`wallet-adapter-dropdown-list ${menuOpen && 'wallet-adapter-dropdown-list-active'}`}
				ref={ref}
				role='menu'
			>
				{publicKey ? (
					<li
						className='wallet-adapter-dropdown-list-item flex flex-row items-center justify-center gap-2'
						onClick={async () => {
							await navigator.clipboard.writeText(publicKey.toBase58())
							setCopied(true)
							toast.info('Address copied')
							setTimeout(() => setCopied(false), 600)
						}}
						role='menuitem'
					>
						<span>
							<Copy size={20} />
						</span>
						<p> {copied ? labels['copied'] : labels['copy-address']} </p>
					</li>
				) : null}
				<li
					className='wallet-adapter-dropdown-list-item flex flex-row items-center justify-center gap-2'
					onClick={() => {
						router.push('/account')
					}}
					role='menuitem'
				>
					<span>
						<User size={20} />
					</span>
					<p> Account info </p>
				</li>
				<li
					className='wallet-adapter-dropdown-list-item flex flex-row items-center justify-center gap-2'
					onClick={() => {
						setModalVisible(true)
						setMenuOpen(false)
					}}
					role='menuitem'
				>
					<span>
						<WalletMinimal size={20} />
					</span>
					<p> {labels['change-wallet']} </p>
				</li>
				{onDisconnect ? (
					<li
						className='wallet-adapter-dropdown-list-item flex flex-row items-center justify-center gap-2'
						onClick={async () => {
							onDisconnect()
							setMenuOpen(false)
							toast.success('Wallet disconnected')
						}}
						role='menuitem'
					>
						<span>
							<LogOut size={20} />
						</span>
						<p> {labels['disconnect']} </p>
					</li>
				) : null}
			</ul>
		</div>
	)
}
