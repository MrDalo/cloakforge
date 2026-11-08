// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const loadBanner = async (network?: string): Promise<typeof import('../NetworkBanner').NetworkBanner> => {
  vi.resetModules()
  if (network === undefined) vi.unstubAllEnvs()
  else vi.stubEnv('NEXT_PUBLIC_SOLANA_NETWORK', network)
  return (await import('../NetworkBanner')).NetworkBanner
}

describe('NetworkBanner', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should render nothing on mainnet', async () => {
    const NetworkBanner = await loadBanner('mainnet-beta')
    const { container } = render(<NetworkBanner />)

    expect(container).toBeEmptyDOMElement()
  })

  it('should show the devnet notice and a link to the terms', async () => {
    const NetworkBanner = await loadBanner('devnet')
    render(<NetworkBanner />)

    expect(screen.getByRole('complementary', { name: 'Network notice' })).toHaveTextContent(
      'Solana Devnet showcase — test tokens only, no real value. Do not send real funds.'
    )
    expect(screen.getByRole('link', { name: 'What does this mean?' })).toHaveAttribute('href', '/terms-of-service#devnet-showcase')
  })

  it('should name the testnet cluster on testnet', async () => {
    const NetworkBanner = await loadBanner('testnet')
    render(<NetworkBanner />)

    expect(screen.getByText(/Solana Testnet showcase/)).toBeInTheDocument()
  })

  it('should not be dismissible', async () => {
    const NetworkBanner = await loadBanner('devnet')
    render(<NetworkBanner />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
