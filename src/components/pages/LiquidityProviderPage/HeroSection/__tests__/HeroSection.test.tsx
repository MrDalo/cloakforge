// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeroSection } from '../HeroSection'
import { features } from '../../liquidityProviderData'
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

    const button = screen.getByRole('button', { name: /create pool now/i })
    await user.click(button)

    expect(document.getElementById).toHaveBeenCalledWith('liquidity-provider-form')
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('should not scroll when form element is not found', async () => {
    const user = userEvent.setup()

    vi.spyOn(document, 'getElementById').mockReturnValue(null)

    renderWithProviders(<HeroSection />)

    const button = screen.getByRole('button', { name: /create pool now/i })
    await user.click(button)

    expect(document.getElementById).toHaveBeenCalledWith('liquidity-provider-form')
    // No error thrown — optional chaining on scrollIntoView handles the null case
  })

  it('should display feature indicators', () => {
    renderWithProviders(<HeroSection />)

    expect(screen.getByText('CPMM & CLMM Support')).toBeInTheDocument()
    expect(screen.getByText('Raydium SDK v2')).toBeInTheDocument()
  })

  it('should render feature cards', () => {
    renderWithProviders(<HeroSection />)

    features.forEach((feature) => {
      expect(screen.getByText(feature.title)).toBeInTheDocument()
      expect(screen.getByText(feature.description)).toBeInTheDocument()
    })
  })
})
