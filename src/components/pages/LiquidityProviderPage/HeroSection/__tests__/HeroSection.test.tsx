// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeroSection } from '../HeroSection'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'

describe('HeroSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should render hero content correctly', () => {
    renderWithProviders(<HeroSection />)

    // The h1 contains mixed text nodes and a <span>, so we search within the heading
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Professional')
    expect(heading).toHaveTextContent('Liquidity')
    expect(heading).toHaveTextContent('Provider')
    expect(screen.getByText(/Create CPMM and CLMM liquidity pools/)).toBeInTheDocument()
  })

  it('should scroll to form when button clicked', async () => {
    const user = userEvent.setup()

    const mockScrollIntoView = vi.fn()
    const mockElement = { scrollIntoView: mockScrollIntoView }
    vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as unknown as HTMLElement)

    renderWithProviders(<HeroSection />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(document.getElementById).toHaveBeenCalledWith('liquidity-provider-form')
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('should display feature indicators', () => {
    renderWithProviders(<HeroSection />)

    expect(screen.getByText('CPMM & CLMM Support')).toBeInTheDocument()
    expect(screen.getByText('Raydium SDK v2')).toBeInTheDocument()
  })

  it('should render feature cards', async () => {
    renderWithProviders(<HeroSection />)

    const { features } = await import('../../liquidityProviderData')

    features.forEach((feature) => {
      expect(screen.getByText(feature.title)).toBeInTheDocument()
      expect(screen.getByText(feature.description)).toBeInTheDocument()
    })
  })
})
