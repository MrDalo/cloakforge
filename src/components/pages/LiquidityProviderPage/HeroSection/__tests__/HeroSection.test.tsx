// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/dom'
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

  it('should render integration status badge', () => {
    renderWithProviders(<HeroSection />)

    expect(screen.getByText('Raydium Integration')).toBeInTheDocument()
  })

  it('should display feature indicators', () => {
    renderWithProviders(<HeroSection />)

    expect(screen.getByText('CPMM & CLMM Support')).toBeInTheDocument()
    expect(screen.getByText('Raydium Integration')).toBeInTheDocument()
  })

  it('should render feature cards', () => {
    renderWithProviders(<HeroSection />)

    features.forEach((feature) => {
      expect(screen.getByText(feature.title)).toBeInTheDocument()
      expect(screen.getByText(feature.description)).toBeInTheDocument()
    })
  })
})
