// @vitest-environment jsdom
/**
 * FAQ pricing across all tool pages:
 * - every pricing FAQ states the live price (Contentful -> cached -> fallback fees)
 * - every priced answer says that prices may change over time
 * - no price placeholder ever leaks into the rendered text
 * - the visible FAQ sections render the prices resolved on the server
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ToolConfiguration } from '@/lib/contentful/client'
import type { CoreToolType } from '@/types/toolTypes'
import { TOOL_FEE_FALLBACKS } from '@/lib/config/toolFeeFallbacks'
import { PRICING_CHANGE_NOTICE, applyLivePricing, formatSol, hasPricePlaceholder } from '@/lib/config/livePricing'
import { ToolConfigProvider } from '@/providers/ToolConfigProvider'
import { burnTokensFAQs } from '../BurnTokensPage/FAQSection/faqData'
import { liquidityProviderFAQ } from '../LiquidityProviderPage/FAQSection/faqData'
import { revokeFreezeAuthorityFAQs } from '../RevokeFreezeAuthorityPage/FAQSection/faqData'
import { revokeMetadataAuthorityFAQs } from '../RevokeMetadataAuthorityPage/FAQSection/faqData'
import { revokeMintAuthorityFAQs } from '../RevokeMintAuthorityPage/FAQSection/faqData'
import { tokenCreatorFAQs } from '../TokenCreatorPage/FAQSection/faqData'
import { updateMetadataFAQs } from '../UpdateMetadataPage/FAQSection/faqData'
import { faqs as freezeWalletsFAQs } from '../FreezeWalletsPage/freezeWalletsData'
import { faqs as unfreezeWalletsFAQs } from '../UnfreezeWalletsPage/unfreezeWalletsData'
import { faqs as multisenderFAQs } from '../TransactionMultisenderPage/multisenderData'
import { faqData as tokenAuditorFAQs } from '../TokenAuditorPage/tokenAuditorData'
import { FAQSection as BurnTokensFAQSection } from '../BurnTokensPage/FAQSection'
import MultisenderFAQSection from '../TransactionMultisenderPage/FAQSection'
import { FAQSection as TokenCreatorFAQSection } from '../TokenCreatorPage/FAQSection'
import { FAQSection as LiquidityProviderFAQSection } from '../LiquidityProviderPage/FAQSection/FAQSection'
import { FAQSection as RevokeFreezeAuthorityFAQSection } from '../RevokeFreezeAuthorityPage/FAQSection/FAQSection'
import { FAQSection as RevokeMetadataAuthorityFAQSection } from '../RevokeMetadataAuthorityPage/FAQSection/FAQSection'
import { FAQSection as RevokeMintAuthorityFAQSection } from '../RevokeMintAuthorityPage/FAQSection/FAQSection'
import { FAQSection as UpdateMetadataFAQSection } from '../UpdateMetadataPage/FAQSection/FAQSection'
import { FAQSection as UnfreezeWalletsFAQSection } from '../UnfreezeWalletsPage/FAQSection'
import { FAQSection as TokenAuditorFAQSection } from '../TokenAuditorPage/FAQSection'
import FreezeWalletsFAQSection from '../FreezeWalletsPage/FAQSection'

interface Faq {
  question: string
  answer: string
}

/** The pricing question of every paid tool */
const PRICING_FAQS: [toolId: CoreToolType, faqs: Faq[], question: string][] = [
  ['burn-tokens', burnTokensFAQs, 'How much does it cost to burn tokens?'],
  ['liquidity-provider', liquidityProviderFAQ, 'What are the costs for creating a liquidity pool?'],
  ['revoke-freeze-authority', revokeFreezeAuthorityFAQs, 'How much does it cost to revoke freeze authority?'],
  ['revoke-metadata-authority', revokeMetadataAuthorityFAQs, 'How much does it cost to revoke metadata authority?'],
  ['revoke-mint-authority', revokeMintAuthorityFAQs, 'How much does it cost to revoke mint authority?'],
  ['token-creator', tokenCreatorFAQs, 'How much does token creation cost?'],
  ['update-metadata', updateMetadataFAQs, 'How much does updating metadata cost?'],
  ['freeze-wallets', freezeWalletsFAQs, 'How are freezing fees calculated?'],
  ['unfreeze-wallets', unfreezeWalletsFAQs, 'How much does unfreezing cost?'],
  ['transaction-multisender', multisenderFAQs, 'How are fees calculated?'],
]

const ALL_FAQ_SETS: [name: string, faqs: Faq[]][] = [
  ...PRICING_FAQS.map(([toolId, faqs]) => [toolId, faqs] as [string, Faq[]]),
  ['token-auditor', tokenAuditorFAQs],
]

const CONTENTFUL_DOWN: ToolConfiguration[] = []
const contentfulPrice = (toolId: string, baseFee: number): ToolConfiguration[] => [{ toolId, isEnabled: true, baseFee, networkFee: 0.0007 }]

const pricedAnswer = (faqs: Faq[], question: string, configs: ToolConfiguration[]): string => {
  const faq = applyLivePricing(faqs, configs).find((entry) => entry.question === question)
  if (!faq) throw new Error(`FAQ "${question}" not found`)
  return faq.answer
}

beforeAll(() => {
  // framer-motion viewport animations
  if (!globalThis.IntersectionObserver) {
    globalThis.IntersectionObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): [] {
        return []
      }
    } as unknown as typeof IntersectionObserver
  }
})

describe('tool FAQ pricing answers', () => {
  it.each(PRICING_FAQS)('%s: should state the live Contentful price', (toolId, faqs, question) => {
    const answer = pricedAnswer(faqs, question, contentfulPrice(toolId, 0.777))

    expect(answer).toContain('0.777 SOL')
  })

  it.each(PRICING_FAQS)('%s: should state the fallback price when Contentful is down', (toolId, faqs, question) => {
    const answer = pricedAnswer(faqs, question, CONTENTFUL_DOWN)

    expect(answer).toContain(formatSol(TOOL_FEE_FALLBACKS[toolId].baseFee))
    expect(answer).not.toContain('0.777 SOL')
  })

  it.each(PRICING_FAQS)('%s: should say that prices may change over time', (toolId, faqs, question) => {
    expect(pricedAnswer(faqs, question, CONTENTFUL_DOWN)).toContain(PRICING_CHANGE_NOTICE)
    expect(pricedAnswer(faqs, question, contentfulPrice(toolId, 0.3))).toContain(PRICING_CHANGE_NOTICE)
  })

  it.each(PRICING_FAQS)('%s: should not hard-code the price in the FAQ data', (_toolId, faqs, question) => {
    const raw = faqs.find((entry) => entry.question === question)!
    expect(hasPricePlaceholder(raw.answer)).toBe(true)
  })

  it.each(ALL_FAQ_SETS)('%s: should never leak a price placeholder into any rendered answer', (_name, faqs) => {
    for (const configs of [CONTENTFUL_DOWN, contentfulPrice('burn-tokens', 0.3)]) {
      applyLivePricing(faqs, configs).forEach((faq) => expect(faq.answer).not.toMatch(/\{\{|\}\}/))
    }
  })

  it.each(ALL_FAQ_SETS)('%s: should only add the pricing notice to answers that state a price', (_name, faqs) => {
    applyLivePricing(faqs, CONTENTFUL_DOWN).forEach((faq, index) => {
      expect(faq.answer.includes(PRICING_CHANGE_NOTICE)).toBe(hasPricePlaceholder(faqs[index].answer))
    })
  })

  it('should show the live network fee estimate where the answer mentions it', () => {
    const answer = pricedAnswer(burnTokensFAQs, 'How much does it cost to burn tokens?', contentfulPrice('burn-tokens', 0.02))
    expect(answer).toContain('typically around 0.0007 SOL')
  })

  it('should quote the token creator add-ons and the standalone revoke prices', () => {
    const answer = pricedAnswer(tokenCreatorFAQs, 'How much does token creation cost?', CONTENTFUL_DOWN)

    expect(answer).toContain('CloakForge charges a 0.19 SOL base fee')
    expect(answer).toContain('Revoking mint authority (0.05 SOL) or freeze authority (0.05 SOL)')
    expect(answer).toContain('standalone tools (0.1 SOL and 0.1 SOL)')
  })

  it('should quote per-address prices for the batch tools', () => {
    expect(pricedAnswer(multisenderFAQs, 'How are fees calculated?', CONTENTFUL_DOWN)).toContain('0.001 SOL per recipient address')
    expect(pricedAnswer(freezeWalletsFAQs, 'How are freezing fees calculated?', CONTENTFUL_DOWN)).toContain('0.01 SOL per wallet address')
    expect(pricedAnswer(unfreezeWalletsFAQs, 'How much does unfreezing cost?', CONTENTFUL_DOWN)).toContain('0.01 SOL per wallet address')
  })

  it('should keep the Token Auditor described as free (no price stated)', () => {
    const answer = pricedAnswer(tokenAuditorFAQs, 'How much does a token audit cost?', CONTENTFUL_DOWN)
    expect(answer).toContain('completely free')
    expect(answer).not.toContain(PRICING_CHANGE_NOTICE)
  })
})

describe('FAQ sections on the tool pages', () => {
  const openQuestion = async (question: string) => {
    await userEvent.click(screen.getByRole('button', { name: question }))
  }

  it('should show the live Contentful price provided by the server', async () => {
    render(
      <ToolConfigProvider initialConfigs={contentfulPrice('burn-tokens', 0.02)}>
        <BurnTokensFAQSection />
      </ToolConfigProvider>
    )

    await openQuestion('How much does it cost to burn tokens?')

    expect(screen.getByText(/CloakForge charges a platform fee of 0\.02 SOL per burn operation/)).toBeInTheDocument()
    expect(screen.getByText(/Prices may change over time/)).toBeInTheDocument()
  })

  it('should show the fallback price when the server had no Contentful prices', async () => {
    render(
      <ToolConfigProvider initialConfigs={CONTENTFUL_DOWN}>
        <MultisenderFAQSection />
      </ToolConfigProvider>
    )

    await openQuestion('How are fees calculated?')

    expect(screen.getByText(/CloakForge charges 0\.001 SOL per recipient address/)).toBeInTheDocument()
  })

  it('should show the fallback prices outside the provider', async () => {
    render(<TokenCreatorFAQSection />)

    await openQuestion('How much does token creation cost?')

    expect(screen.getByText(/CloakForge charges a 0\.19 SOL base fee/)).toBeInTheDocument()
  })

  it('should not show price placeholders anywhere in the section', async () => {
    render(
      <ToolConfigProvider initialConfigs={CONTENTFUL_DOWN}>
        <TokenCreatorFAQSection />
      </ToolConfigProvider>
    )

    await openQuestion('How much does token creation cost?')

    expect(document.body.textContent).not.toMatch(/\{\{/)
  })
})

describe('every tool FAQ section', () => {
  const SECTIONS: [toolId: CoreToolType, Section: () => React.ReactNode, question: string][] = [
    ['burn-tokens', BurnTokensFAQSection, 'How much does it cost to burn tokens?'],
    ['liquidity-provider', LiquidityProviderFAQSection, 'What are the costs for creating a liquidity pool?'],
    ['revoke-freeze-authority', RevokeFreezeAuthorityFAQSection, 'How much does it cost to revoke freeze authority?'],
    ['revoke-metadata-authority', RevokeMetadataAuthorityFAQSection, 'How much does it cost to revoke metadata authority?'],
    ['revoke-mint-authority', RevokeMintAuthorityFAQSection, 'How much does it cost to revoke mint authority?'],
    ['token-creator', TokenCreatorFAQSection, 'How much does token creation cost?'],
    ['update-metadata', UpdateMetadataFAQSection, 'How much does updating metadata cost?'],
    ['freeze-wallets', FreezeWalletsFAQSection, 'How are freezing fees calculated?'],
    ['unfreeze-wallets', UnfreezeWalletsFAQSection, 'How much does unfreezing cost?'],
    ['transaction-multisender', MultisenderFAQSection, 'How are fees calculated?'],
  ]

  it.each(SECTIONS)('%s: should display the live Contentful price with the pricing notice', async (toolId, Section, question) => {
    render(
      <ToolConfigProvider initialConfigs={contentfulPrice(toolId, 0.777)}>
        <Section />
      </ToolConfigProvider>
    )

    await userEvent.click(screen.getByRole('button', { name: question }))

    const answer = screen.getByText(/Prices may change over time/)
    expect(answer.textContent).toContain('0.777 SOL')
  })

  it.each(SECTIONS)('%s: should display the fallback price when Contentful is down', async (toolId, Section, question) => {
    render(
      <ToolConfigProvider initialConfigs={CONTENTFUL_DOWN}>
        <Section />
      </ToolConfigProvider>
    )

    await userEvent.click(screen.getByRole('button', { name: question }))

    expect(screen.getByText(/Prices may change over time/).textContent).toContain(formatSol(TOOL_FEE_FALLBACKS[toolId].baseFee))
  })

  it('token-auditor: should keep describing the audit as free', async () => {
    render(
      <ToolConfigProvider initialConfigs={CONTENTFUL_DOWN}>
        <TokenAuditorFAQSection />
      </ToolConfigProvider>
    )

    await userEvent.click(screen.getByRole('button', { name: 'How much does a token audit cost?' }))

    expect(screen.getByText(/completely free to use/)).toBeInTheDocument()
  })
})
