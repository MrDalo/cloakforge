import { describe, it, expect } from 'vitest'
import type { ToolConfiguration } from '@/lib/contentful/client'
import {
  PRICING_CHANGE_NOTICE,
  applyLivePricing,
  formatSol,
  hasPricePlaceholder,
  networkFee,
  renderPrices,
  serviceFee,
  tokenCreatorOptionFee,
} from '../livePricing'

const contentful = (toolId: string, baseFee: number, networkFeeSol = 0.0005): ToolConfiguration => ({
  toolId,
  isEnabled: true,
  baseFee,
  networkFee: networkFeeSol,
})

describe('formatSol', () => {
  it.each([
    [0.001, '0.001 SOL'],
    [0.19, '0.19 SOL'],
    [0.5, '0.5 SOL'],
    [2, '2 SOL'],
    [0, '0 SOL'],
    [0.1 + 0.2, '0.3 SOL'],
    [0.000000001, '0.000000001 SOL'],
    [1234.5, '1234.5 SOL'],
  ])('should format %s as %s', (amount, expected) => {
    expect(formatSol(amount)).toBe(expected)
  })

  it('should round to at most 9 decimals (lamport precision)', () => {
    expect(formatSol(0.1234567891234)).toBe('0.123456789 SOL')
  })
})

describe('price placeholders', () => {
  it('should produce recognisable placeholders for tool, network and token creator add-on fees', () => {
    expect(serviceFee('burn-tokens')).toBe('{{serviceFee:burn-tokens}}')
    expect(networkFee('burn-tokens')).toBe('{{networkFee:burn-tokens}}')
    expect(tokenCreatorOptionFee('revokeMintAuthority')).toBe('{{tokenCreatorOption:revokeMintAuthority}}')
  })

  it('should detect texts that state a price', () => {
    expect(hasPricePlaceholder(`Costs ${serviceFee('token-creator')}`)).toBe(true)
    expect(hasPricePlaceholder('Completely free to use')).toBe(false)
  })

  it('should detect placeholders consistently on repeated calls', () => {
    const text = `Costs ${serviceFee('token-creator')}`
    expect([hasPricePlaceholder(text), hasPricePlaceholder(text), hasPricePlaceholder(text)]).toEqual([true, true, true])
  })
})

describe('renderPrices', () => {
  it('should use the live Contentful service and network fees', () => {
    const text = `Fee ${serviceFee('burn-tokens')} plus ~${networkFee('burn-tokens')}`
    expect(renderPrices(text, [contentful('burn-tokens', 0.02, 0.0007)])).toBe('Fee 0.02 SOL plus ~0.0007 SOL')
  })

  it('should use the fallback fees when Contentful provides nothing', () => {
    const text = `${serviceFee('liquidity-provider')} / ${serviceFee('transaction-multisender')} / ${networkFee('update-metadata')}`
    expect(renderPrices(text, [])).toBe('0.5 SOL / 0.001 SOL / 0.0005 SOL')
  })

  it('should mix Contentful values and fallbacks for tools missing from Contentful', () => {
    const text = `${serviceFee('revoke-mint-authority')} and ${serviceFee('revoke-freeze-authority')}`
    expect(renderPrices(text, [contentful('revoke-mint-authority', 0.15)])).toBe('0.15 SOL and 0.1 SOL')
  })

  it('should use the fallback fee when the Contentful fee is unusable', () => {
    expect(renderPrices(serviceFee('freeze-wallets'), [contentful('freeze-wallets', Number.NaN)])).toBe('0.01 SOL')
  })

  it('should render the token creator add-on fees', () => {
    const text = `${tokenCreatorOptionFee('revokeMintAuthority')} + ${tokenCreatorOptionFee('revokeFreezeAuthority')}`
    expect(renderPrices(text, [])).toBe('0.05 SOL + 0.05 SOL')
  })

  it('should replace every occurrence of a placeholder', () => {
    const text = `${serviceFee('burn-tokens')}, again ${serviceFee('burn-tokens')}`
    expect(renderPrices(text, [])).toBe('0.001 SOL, again 0.001 SOL')
  })

  it('should leave text without placeholders untouched', () => {
    expect(renderPrices('No prices here.', [])).toBe('No prices here.')
  })
})

describe('applyLivePricing', () => {
  const faqs = [
    { question: 'How much does it cost?', answer: `It costs ${serviceFee('burn-tokens')}.`, category: 'technical' as const },
    { question: 'Is it safe?', answer: 'Yes.', category: 'security' as const },
  ]

  it('should fill in the prices and append the pricing-change notice to priced answers', () => {
    const [priced] = applyLivePricing(faqs, [contentful('burn-tokens', 0.02)])
    expect(priced.answer).toBe(`It costs 0.02 SOL. ${PRICING_CHANGE_NOTICE}`)
  })

  it('should say that prices may change over time', () => {
    expect(PRICING_CHANGE_NOTICE).toMatch(/prices may change over time/i)
  })

  it('should leave answers without prices unchanged (no notice)', () => {
    const [, unpriced] = applyLivePricing(faqs, [])
    expect(unpriced).toBe(faqs[1])
  })

  it('should keep the other FAQ fields (question, category)', () => {
    const [priced] = applyLivePricing(faqs, [])
    expect(priced).toMatchObject({ question: 'How much does it cost?', category: 'technical' })
  })

  it('should not mutate the static FAQ data', () => {
    applyLivePricing(faqs, [contentful('burn-tokens', 0.02)])
    expect(faqs[0].answer).toBe(`It costs ${serviceFee('burn-tokens')}.`)
  })

  it('should use the fallback prices when Contentful is down', () => {
    const [priced] = applyLivePricing(faqs, [])
    expect(priced.answer).toBe(`It costs 0.001 SOL. ${PRICING_CHANGE_NOTICE}`)
  })
})
