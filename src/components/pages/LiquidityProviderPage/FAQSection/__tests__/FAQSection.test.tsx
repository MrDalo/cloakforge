// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FAQSection } from '../FAQSection'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'

describe('FAQSection', () => {
  it('should render FAQ section title', () => {
    renderWithProviders(<FAQSection />)

    expect(screen.getByText(/Frequently Asked Questions/)).toBeInTheDocument()
  })

  it('should toggle FAQ items when clicked', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FAQSection />)

    const { liquidityProviderFAQ } = await import('../faqData')
    const firstQuestion = liquidityProviderFAQ[0]

    const questionButton = screen.getByText(firstQuestion.question)
    await user.click(questionButton)

    expect(screen.getByText(firstQuestion.answer)).toBeInTheDocument()
  })

  it('should hide answer before clicking', async () => {
    renderWithProviders(<FAQSection />)

    const { liquidityProviderFAQ } = await import('../faqData')
    const firstQuestion = liquidityProviderFAQ[0]

    expect(screen.queryByText(firstQuestion.answer)).not.toBeInTheDocument()
  })

  it('should collapse an open FAQ item when clicked again', async () => {
    const user = userEvent.setup()

    renderWithProviders(<FAQSection />)

    const { liquidityProviderFAQ } = await import('../faqData')
    const firstQuestion = liquidityProviderFAQ[0]

    const questionButton = screen.getByText(firstQuestion.question)

    // Open
    await user.click(questionButton)
    expect(screen.getByText(firstQuestion.answer)).toBeInTheDocument()

    // Close
    await user.click(questionButton)
    expect(screen.queryByText(firstQuestion.answer)).not.toBeInTheDocument()
  })

  it('should render all FAQ items', async () => {
    renderWithProviders(<FAQSection />)

    const { liquidityProviderFAQ } = await import('../faqData')

    liquidityProviderFAQ.forEach((faq) => {
      expect(screen.getByText(faq.question)).toBeInTheDocument()
    })
  })
})
