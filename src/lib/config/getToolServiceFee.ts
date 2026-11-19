import 'server-only'

import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { getLogger } from '@/lib/logger/logger'
import type { CoreToolType } from '@/types/toolTypes'
import { TOOL_FEE_FALLBACKS, resolveFee } from './toolFeeFallbacks'

const logger = getLogger({ context: 'tool-fees', function: 'getToolServiceFee' })

/**
 * Resolves the service fee a tool charges, in SOL.
 *
 * Uses the Contentful tool configuration when it provides a usable fee. Falls back to
 * TOOL_FEE_FALLBACKS when Contentful is unreachable, has no entry for the tool, or the fee field
 * is empty/invalid — a Contentful outage must never make a paid tool free.
 *
 * @param toolId - Tool identifier.
 * @returns Service fee in SOL (per transaction, or per address for per-address tools).
 */
export async function getToolServiceFee(toolId: CoreToolType): Promise<number> {
  const fallbackFee = TOOL_FEE_FALLBACKS[toolId].baseFee

  try {
    const toolConfig = await getCachedToolConfig(toolId)
    if (!toolConfig) {
      logger.warn('No Contentful configuration for tool, using fallback service fee', undefined, { toolId, fallbackFee })
      return fallbackFee
    }
    return resolveFee(toolConfig.baseFee, fallbackFee)
  } catch (error) {
    logger.error('Failed to load tool configuration, using fallback service fee', error, { toolId, fallbackFee })
    return fallbackFee
  }
}
