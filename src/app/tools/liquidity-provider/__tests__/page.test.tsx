// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const loadPage = async (network: string): Promise<typeof import('../page').default> => {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_SOLANA_NETWORK', network)
  // Stub only the heavy client form; the notice is re-evaluated against the stubbed network.
  vi.doMock('@/components/pages/LiquidityProviderPage', async () => ({
    LiquidityProviderPageContent: () => <div data-testid='lp-form'>form</div>,
    MainnetOnlyNotice: (
      await vi.importActual<typeof import('@/components/pages/LiquidityProviderPage/MainnetOnlyNotice')>(
        '@/components/pages/LiquidityProviderPage/MainnetOnlyNotice'
      )
    ).MainnetOnlyNotice,
  }))
  return (await import('../page')).default
}

describe('liquidity-provider page', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should render the tool on mainnet', async () => {
    const Page = await loadPage('mainnet-beta')
    render(<Page />)

    expect(screen.getByTestId('lp-form')).toBeInTheDocument()
  })

  it('should render the mainnet-only notice instead of the form on devnet', async () => {
    const Page = await loadPage('devnet')
    render(<Page />)

    expect(screen.queryByTestId('lp-form')).not.toBeInTheDocument()
    expect(screen.getByText('Available on mainnet only')).toBeInTheDocument()
    expect(screen.getByText(/not part of this devnet showcase/)).toBeInTheDocument()
  })
})
