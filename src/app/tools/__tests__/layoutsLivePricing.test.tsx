/**
 * Tool layouts publish their FAQs as schema.org FAQPage JSON-LD (SEO). The priced answers must
 * carry the same live prices as the visible FAQ: Contentful -> cached values -> fallback fees.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isValidElement, type ReactElement, type ReactNode } from 'react'
import type { ToolConfiguration } from '@/lib/contentful/client'
import type { CoreToolType } from '@/types/toolTypes'

const mockGetToolConfigurations = vi.hoisted(() => vi.fn())
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getToolConfigurationsWithFallback: () => mockGetToolConfigurations(),
}))

import { ToolStructuredData } from '@/components/common'
import { withFeeFallbacks, TOOL_FEE_FALLBACKS } from '@/lib/config/toolFeeFallbacks'
import { PRICING_CHANGE_NOTICE, formatSol } from '@/lib/config/livePricing'
import BurnTokensLayout from '../burn-tokens/layout'
import FreezeWalletsLayout from '../freeze-wallets/layout'
import LiquidityProviderLayout from '../liquidity-provider/layout'
import RevokeFreezeAuthorityLayout from '../revoke-freeze-authority/layout'
import RevokeMetadataAuthorityLayout from '../revoke-metadata-authority/layout'
import RevokeMintAuthorityLayout from '../revoke-mint-authority/layout'
import TokenAuditorLayout from '../token-auditor/layout'
import TokenCreatorLayout from '../token-creator/layout'
import TransactionMultisenderLayout from '../transaction-multisender/layout'
import UnfreezeWalletsLayout from '../unfreeze-wallets/layout'
import UpdateMetadataLayout from '../update-metadata/layout'

type Layout = (props: { children: ReactNode }) => Promise<ReactNode>
interface FaqEntry {
  question: string
  answer: string
}

const PAID_TOOL_LAYOUTS: [CoreToolType, Layout][] = [
  ['burn-tokens', BurnTokensLayout as Layout],
  ['freeze-wallets', FreezeWalletsLayout as Layout],
  ['liquidity-provider', LiquidityProviderLayout as Layout],
  ['revoke-freeze-authority', RevokeFreezeAuthorityLayout as Layout],
  ['revoke-metadata-authority', RevokeMetadataAuthorityLayout as Layout],
  ['revoke-mint-authority', RevokeMintAuthorityLayout as Layout],
  ['token-creator', TokenCreatorLayout as Layout],
  ['transaction-multisender', TransactionMultisenderLayout as Layout],
  ['unfreeze-wallets', UnfreezeWalletsLayout as Layout],
  ['update-metadata', UpdateMetadataLayout as Layout],
]

const structuredFaqs = async (layout: Layout): Promise<FaqEntry[]> => {
  const tree = await layout({ children: 'page' })
  const find = (node: ReactNode): ReactElement<{ faqs: FaqEntry[] }> | undefined => {
    if (Array.isArray(node)) return node.map(find).find(Boolean)
    if (!isValidElement(node)) return undefined
    if (node.type === ToolStructuredData) return node as ReactElement<{ faqs: FaqEntry[] }>
    return find((node.props as { children?: ReactNode }).children)
  }
  const element = find(tree)
  if (!element) throw new Error('ToolStructuredData not rendered')
  return element.props.faqs
}

const pricedFaqs = (faqs: FaqEntry[]) => faqs.filter((faq) => faq.answer.includes(PRICING_CHANGE_NOTICE))

describe('tool layouts — FAQ structured data pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it.each(PAID_TOOL_LAYOUTS)('%s: should publish the live Contentful price', async (toolId, layout) => {
    const live: ToolConfiguration[] = [{ toolId, isEnabled: true, baseFee: 0.777, networkFee: 0.0005 }]
    mockGetToolConfigurations.mockResolvedValue(withFeeFallbacks(live))

    const priced = pricedFaqs(await structuredFaqs(layout))

    expect(priced.length).toBeGreaterThan(0)
    expect(priced.some((faq) => faq.answer.includes('0.777 SOL'))).toBe(true)
  })

  it.each(PAID_TOOL_LAYOUTS)('%s: should publish the fallback price when Contentful is down', async (toolId, layout) => {
    mockGetToolConfigurations.mockResolvedValue(withFeeFallbacks([]))

    const priced = pricedFaqs(await structuredFaqs(layout))

    expect(priced.some((faq) => faq.answer.includes(formatSol(TOOL_FEE_FALLBACKS[toolId].baseFee)))).toBe(true)
  })

  it.each([...PAID_TOOL_LAYOUTS, ['token-auditor', TokenAuditorLayout as Layout] as const])(
    '%s: should never publish a price placeholder',
    async (_toolId, layout) => {
      mockGetToolConfigurations.mockResolvedValue(withFeeFallbacks([]))

      const faqs = await structuredFaqs(layout as Layout)

      faqs.forEach((faq) => expect(faq.answer).not.toMatch(/\{\{|\}\}/))
    }
  )

  it('should resolve the prices once per layout render', async () => {
    mockGetToolConfigurations.mockResolvedValue(withFeeFallbacks([]))

    await structuredFaqs(BurnTokensLayout as Layout)

    expect(mockGetToolConfigurations).toHaveBeenCalledTimes(1)
  })
})
