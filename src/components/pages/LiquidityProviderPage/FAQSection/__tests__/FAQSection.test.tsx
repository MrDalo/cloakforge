// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { FAQSection } from '../FAQSection'
import { liquidityProviderFAQ } from '../faqData'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'

describe('FAQSection', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should render FAQ section title', () => {
    renderWithProviders(<FAQSection />)

    expect(screen.getByText(/Frequently Asked Questions/)).toBeInTheDocument()
  })

  it('should toggle FAQ items when clicked', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FAQSection />)

    const firstQuestion = liquidityProviderFAQ[0]

    const questionButton = screen.getByText(firstQuestion.question)
    await user.click(questionButton)

    expect(screen.getByText(firstQuestion.answer)).toBeInTheDocument()
  })

  it('should hide answer before clicking', () => {
    renderWithProviders(<FAQSection />)

    const firstQuestion = liquidityProviderFAQ[0]

    expect(screen.queryByText(firstQuestion.answer)).not.toBeInTheDocument()
  })

  it('should collapse an open FAQ item when clicked again', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FAQSection />)

    const firstQuestion = liquidityProviderFAQ[0]
    const questionButton = screen.getByText(firstQuestion.question)

    // Open
    await user.click(questionButton)
    expect(screen.getByText(firstQuestion.answer)).toBeInTheDocument()

    // Close
    await user.click(questionButton)
    expect(screen.queryByText(firstQuestion.answer)).not.toBeInTheDocument()
  })

  it('should render all FAQ items', () => {
    renderWithProviders(<FAQSection />)

    liquidityProviderFAQ.forEach((faq) => {
      expect(screen.getByText(faq.question)).toBeInTheDocument()
    })
  })
})
