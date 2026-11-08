// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const loadLink = async (network: string): Promise<typeof import('../index').ExplorerLink> => {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_SOLANA_NETWORK', network)
  return (await import('../index')).ExplorerLink
}

describe('ExplorerLink', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should link to the mainnet Solscan page without a cluster query', async () => {
    const ExplorerLink = await loadLink('mainnet-beta')
    render(<ExplorerLink label='sig' path='tx/sig123' />)

    const link = screen.getByRole('link', { name: 'sig' })
    expect(link).toHaveAttribute('href', 'https://solscan.io/tx/sig123')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('should point at the devnet cluster on the showcase', async () => {
    const ExplorerLink = await loadLink('devnet')
    render(<ExplorerLink label='sig' path='tx/sig123' />)

    expect(screen.getByRole('link', { name: 'sig' })).toHaveAttribute('href', 'https://solscan.io/tx/sig123?cluster=devnet')
  })
})
