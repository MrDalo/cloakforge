import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('next/font/google', () => ({ DM_Sans: () => ({ variable: '--font-dm-sans' }) }))
vi.mock('@/providers/AppProvider', () => ({ default: ({ children }: { children: React.ReactNode }) => <>{children}</> }))
vi.mock('@/components/ui/sonner', () => ({ default: () => null }))
vi.mock('@/components/common/GlobalHeader', () => ({ GlobalHeader: () => null }))
vi.mock('@/components/common/GlobalFooter', () => ({ GlobalFooter: () => null }))
vi.mock('@/components/common/DonationSection', () => ({ DonationSection: () => <section id='donate'>donate</section> }))
vi.mock('@/components/common/AnnouncementBanner', () => ({ AnnouncementBanner: () => null }))
vi.mock('@/components/common/JsonLd', () => ({ JsonLd: () => null }))

const renderLayout = async (network: string): Promise<string> => {
  vi.resetModules()
  vi.stubEnv('NEXT_PUBLIC_SOLANA_NETWORK', network)
  const { default: RootLayout } = await import('../layout')
  return renderToStaticMarkup(<RootLayout>content</RootLayout>)
}

describe('root layout network handling', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should show the network banner and hide donations on the devnet showcase', async () => {
    const html = await renderLayout('devnet')

    expect(html).toContain('Solana Devnet showcase')
    expect(html).not.toContain('id="donate"')
  })

  it('should keep donations and omit the banner on mainnet', async () => {
    const html = await renderLayout('mainnet-beta')

    expect(html).not.toContain('showcase')
    expect(html).toContain('id="donate"')
  })
})
