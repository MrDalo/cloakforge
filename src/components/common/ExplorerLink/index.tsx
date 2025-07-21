'use client'

export const ExplorerLink = ({ path, label, className }: { path: string; label: string; className?: string }): React.ReactNode => (
  <a className={className ? className : `link font-mono`} href={`https://solscan.io/${path}`} rel='noopener noreferrer' target='_blank'>
    {label}
  </a>
)
