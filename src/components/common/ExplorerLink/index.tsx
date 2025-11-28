'use client'

import React from 'react'

interface ExplorerLinkProps {
  path: string
  label?: string
  className?: string
  children?: React.ReactNode
}

export const ExplorerLink = ({ path, label, className, children }: ExplorerLinkProps): React.ReactNode => (
  <a className={className ? className : `link font-mono`} href={`https://solscan.io/${path}`} rel='noopener noreferrer' target='_blank'>
    {children || label}
  </a>
)
