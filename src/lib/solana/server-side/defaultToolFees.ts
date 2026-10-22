import 'server-only'

import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { getLogger } from '@/lib/logger/logger'

const logger = getLogger({ context: 'tool-fees', function: 'resolveToolBaseFee' })

/**
 * Hard-coded minimum service fees (SOL) charged when a tool's Contentful configuration is
 * unavailable: Contentful outage, no entry for the tool, or an invalid `baseFee` value.
 * A Contentful outage must never make a tool free (fail closed).
 *
 * Values match the fallbacks the builders and UI hooks used before. Units follow each tool's
 * fee model: multisender is per recipient, freeze/unfreeze per wallet, all others per transaction.
 */
export const DEFAULT_TOOL_BASE_FEES_SOL = {
  'token-creator': 0.19,
  'burn-tokens': 0.009,
  'transaction-multisender': 0.001,
  'freeze-wallets': 0.01,
  'unfreeze-wallets': 0.01,
  'revoke-mint-authority': 0.1,
  'revoke-freeze-authority': 0.1,
  'revoke-metadata-authority': 0.05,
  'update-metadata': 0.05,
} as const satisfies Record<string, number>

/** Contentful tool IDs whose transaction builders charge a service fee. */
export type FeeChargingToolId = keyof typeof DEFAULT_TOOL_BASE_FEES_SOL

/**
 * Resolves the base service fee (SOL) for a tool on the server.
 *
 * - Config found with a valid `baseFee` → that value, including an intentional `0`.
 * - Config missing/unavailable, or `baseFee` not a finite non-negative number → the
 *   hard-coded minimum from {@link DEFAULT_TOOL_BASE_FEES_SOL} (never 0).
 *
 * @param toolId - Contentful tool identifier.
 * @returns Base fee in SOL, before coupon discounts.
 */
export async function resolveToolBaseFee(toolId: FeeChargingToolId): Promise<number> {
  const fallbackFee = DEFAULT_TOOL_BASE_FEES_SOL[toolId]

  let baseFee: unknown
  try {
    const toolConfig = await getCachedToolConfig(toolId)
    if (!toolConfig) {
      logger.warn('Tool configuration unavailable, charging the fallback minimum fee', undefined, { toolId, fallbackFee })
      return fallbackFee
    }
    baseFee = toolConfig.baseFee
  } catch (error) {
    logger.error('Tool configuration lookup failed, charging the fallback minimum fee', error, { toolId, fallbackFee })
    return fallbackFee
  }

  if (typeof baseFee !== 'number' || !Number.isFinite(baseFee) || baseFee < 0) {
    logger.error('Invalid baseFee in tool configuration, charging the fallback minimum fee', undefined, {
      toolId,
      baseFee: String(baseFee),
      fallbackFee,
    })
    return fallbackFee
  }

  return baseFee
}
