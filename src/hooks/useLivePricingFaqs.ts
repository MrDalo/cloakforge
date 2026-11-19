import { useToolConfigurations } from '@/providers/ToolConfigProvider'
import { applyLivePricing } from '@/lib/config/livePricing'

/**
 * FAQ entries with the current prices filled in (live Contentful values, cached values during an
 * outage, or the fallback fees) and the pricing-change notice on every priced answer.
 *
 * @param faqs - FAQ entries with price placeholders (see livePricing.ts).
 * @returns FAQ entries with prices.
 */
export const useLivePricingFaqs = <T extends { answer: string }>(faqs: T[]): T[] => applyLivePricing(faqs, useToolConfigurations())
