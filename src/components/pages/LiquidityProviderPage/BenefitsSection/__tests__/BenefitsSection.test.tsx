// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { liquidityProviderBenefitsConfig } from '../benefitsConfig'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'

// framer-motion passes animation-specific props (whileInView, whileHover, etc.) to
// DOM elements in jsdom, causing React warnings. Stub it to render plain elements.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('BenefitsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the section title referencing the tool name', () => {
    renderWithProviders(<BenefitsSection config={liquidityProviderBenefitsConfig} />)

    // The heading renders "Why Choose CloakForge for {title}?" — check by heading role
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent(liquidityProviderBenefitsConfig.title)
  })

  it('should render the subtitle', () => {
    renderWithProviders(<BenefitsSection config={liquidityProviderBenefitsConfig} />)

    expect(screen.getByText(liquidityProviderBenefitsConfig.subtitle)).toBeInTheDocument()
  })

  it('should render all value prop titles', () => {
    renderWithProviders(<BenefitsSection config={liquidityProviderBenefitsConfig} />)

    liquidityProviderBenefitsConfig.valueProps.forEach((prop) => {
      expect(screen.getByText(prop.title)).toBeInTheDocument()
    })
  })

  it('should render all value prop descriptions', () => {
    renderWithProviders(<BenefitsSection config={liquidityProviderBenefitsConfig} />)

    liquidityProviderBenefitsConfig.valueProps.forEach((prop) => {
      expect(screen.getByText(prop.description)).toBeInTheDocument()
    })
  })

  it('should render all value prop highlight badges', () => {
    renderWithProviders(<BenefitsSection config={liquidityProviderBenefitsConfig} />)

    liquidityProviderBenefitsConfig.valueProps.forEach((prop) => {
      expect(screen.getByText(prop.highlight)).toBeInTheDocument()
    })
  })

  it('should render the CTA title', () => {
    renderWithProviders(<BenefitsSection config={liquidityProviderBenefitsConfig} />)

    expect(screen.getByText(liquidityProviderBenefitsConfig.cta.title)).toBeInTheDocument()
  })

  it('should render the CTA description', () => {
    renderWithProviders(<BenefitsSection config={liquidityProviderBenefitsConfig} />)

    expect(screen.getByText(liquidityProviderBenefitsConfig.cta.description)).toBeInTheDocument()
  })

  it('should render the CTA button with correct text', () => {
    renderWithProviders(<BenefitsSection config={liquidityProviderBenefitsConfig} />)

    expect(screen.getByRole('button', { name: liquidityProviderBenefitsConfig.cta.buttonText })).toBeInTheDocument()
  })

  it('should call onButtonClick when CTA button is clicked', async () => {
    const user = userEvent.setup()

    const mockOnButtonClick = vi.fn()
    const configWithMockedClick = {
      ...liquidityProviderBenefitsConfig,
      cta: {
        ...liquidityProviderBenefitsConfig.cta,
        onButtonClick: mockOnButtonClick,
      },
    }

    renderWithProviders(<BenefitsSection config={configWithMockedClick} />)

    const button = screen.getByRole('button', { name: liquidityProviderBenefitsConfig.cta.buttonText })
    await user.click(button)

    expect(mockOnButtonClick).toHaveBeenCalledOnce()
  })

  it('should render correct number of value prop cards', () => {
    renderWithProviders(<BenefitsSection config={liquidityProviderBenefitsConfig} />)

    // Each value prop should render its title — verify count matches config
    const titles = liquidityProviderBenefitsConfig.valueProps.map((p) => p.title)
    titles.forEach((title) => {
      expect(screen.getByText(title)).toBeInTheDocument()
    })
    expect(liquidityProviderBenefitsConfig.valueProps).toHaveLength(5)
  })
})
