/**
 * Live pricing for marketing content (FAQ answers, pricing table).
 *
 * Static content refers to prices through typed placeholders instead of hard-coded numbers:
 *
 *   answer: `CloakForge charges ${serviceFee('burn-tokens')} per burn operation.`
 *
 * applyLivePricing() replaces the placeholders with the current prices from the tool
 * configurations — live Contentful values, cached values during an outage, or the fallback
 * fees — and appends PRICING_CHANGE_NOTICE to every answer that states a price.
 * Safe to import from client and server code.
 */

import type { ToolConfiguration } from '@/lib/contentful/client'
import type { CoreToolType } from '@/types/toolTypes'
import { TOKEN_CREATOR_OPTION_FEES, getFallbackFees, withFeeFallbacks } from './toolFeeFallbacks'

/** Appended to every FAQ answer that states a price */
export const PRICING_CHANGE_NOTICE =
  'Prices may change over time — the current price is always shown in the Fee Breakdown before you confirm a transaction.'

type TokenCreatorOption = keyof typeof TOKEN_CREATOR_OPTION_FEES

const PLACEHOLDER_PATTERN = /\{\{(serviceFee|networkFee|tokenCreatorOption):([A-Za-z-]+)\}\}/g

/** Placeholder for a tool's current service (platform) fee, e.g. "0.19 SOL". */
export const serviceFee = (toolId: CoreToolType): string => `{{serviceFee:${toolId}}}`

/** Placeholder for a tool's current estimated network fee, e.g. "0.0005 SOL". */
export const networkFee = (toolId: CoreToolType): string => `{{networkFee:${toolId}}}`

/** Placeholder for a Token Creator add-on fee, e.g. "0.05 SOL". */
export const tokenCreatorOptionFee = (option: TokenCreatorOption): string => `{{tokenCreatorOption:${option}}}`

/**
 * Formats an amount of SOL for display: up to 9 decimals, no floating point artefacts and no
 * scientific notation (0.001 -> "0.001 SOL", 0.1 + 0.2 -> "0.3 SOL", 1e-9 -> "0.000000001 SOL").
 *
 * @param amount - Amount in SOL.
 * @returns Formatted amount with unit.
 */
export const formatSol = (amount: number): string =>
  `${amount.toLocaleString('en-US', { maximumFractionDigits: 9, useGrouping: false })} SOL`

/** True when the text contains at least one price placeholder. */
export const hasPricePlaceholder = (text: string): boolean => new RegExp(PLACEHOLDER_PATTERN.source).test(text)

/**
 * Replaces the price placeholders of a text with the current prices.
 *
 * @param text - Text containing placeholders.
 * @param configs - Tool configurations (completed with fallbacks for missing tools).
 * @returns Text with prices.
 */
export const renderPrices = (text: string, configs: ToolConfiguration[]): string => {
  const byTool = new Map(withFeeFallbacks(configs).map((config) => [config.toolId, config]))

  return text.replace(PLACEHOLDER_PATTERN, (_match, kind: string, key: string) => {
    if (kind === 'tokenCreatorOption') {
      return formatSol(TOKEN_CREATOR_OPTION_FEES[key as TokenCreatorOption] ?? 0)
    }
    const config = byTool.get(key) ?? { ...getFallbackFees(key) }
    return formatSol(kind === 'serviceFee' ? config.baseFee : config.networkFee)
  })
}

/**
 * Fills in the current prices in FAQ answers and adds the pricing-change notice to every answer
 * that states a price. Entries without prices are returned unchanged.
 *
 * @param faqs - FAQ entries with price placeholders.
 * @param configs - Tool configurations (live, cached or fallback).
 * @returns FAQ entries with prices.
 */
export const applyLivePricing = <T extends { answer: string }>(faqs: T[], configs: ToolConfiguration[]): T[] =>
  faqs.map((faq) =>
    hasPricePlaceholder(faq.answer) ? { ...faq, answer: `${renderPrices(faq.answer, configs)} ${PRICING_CHANGE_NOTICE}` } : faq
  )
