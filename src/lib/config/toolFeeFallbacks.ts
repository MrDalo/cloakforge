/**
 * Fallback tool fees — used whenever Contentful cannot provide a tool's fee configuration
 * (Contentful unreachable, tool entry missing, or fee field empty/invalid).
 *
 * Single source of truth for fallback fees on both the server (transaction builders charge these)
 * and the client (fee breakdowns, balance checks and the pricing section display these).
 * Safe to import from client and server code.
 */

import type { ToolConfiguration } from '@/lib/contentful/client'
import type { CoreToolType } from '@/types/toolTypes'

export interface ToolFeeFallback {
  /** Service fee in SOL — per transaction, or per address for `per-address` tools */
  baseFee: number
  /** Estimated network fee in SOL */
  networkFee: number
  /** How the service fee is charged */
  unit: 'flat' | 'per-address'
}

/** Estimated network fee used when Contentful has none (not part of the service fee) */
export const FALLBACK_NETWORK_FEE_SOL = 0.0005

const fallback = (baseFee: number, unit: ToolFeeFallback['unit'] = 'flat'): Readonly<ToolFeeFallback> =>
  Object.freeze({ baseFee, networkFee: FALLBACK_NETWORK_FEE_SOL, unit })

/** Fallback service fees per tool (SOL). Deeply frozen so no code path can alter a price at runtime. */
export const TOOL_FEE_FALLBACKS: Readonly<Record<CoreToolType, Readonly<ToolFeeFallback>>> = Object.freeze({
  'liquidity-provider': fallback(0.5),
  'revoke-mint-authority': fallback(0.1),
  'token-auditor': fallback(0.01),
  'token-creator': fallback(0.19),
  'transaction-multisender': fallback(0.001, 'per-address'),
  'burn-tokens': fallback(0.001),
  'freeze-wallets': fallback(0.01, 'per-address'),
  'revoke-freeze-authority': fallback(0.1),
  'unfreeze-wallets': fallback(0.01, 'per-address'),
  'update-metadata': fallback(0.19),
  'revoke-metadata-authority': fallback(0.1),
})

/**
 * Reduced add-on fees for revoking authorities while creating a token with the Token Creator
 * (cheaper than the standalone revoke tools).
 */
export const TOKEN_CREATOR_OPTION_FEES = Object.freeze({
  revokeMintAuthority: 0.05,
  revokeFreezeAuthority: 0.05,
})

/**
 * Defaults for Contentful tool entries whose toolId is not a known tool.
 * Known tools always use TOOL_FEE_FALLBACKS.
 */
const UNKNOWN_TOOL_FEES = Object.freeze({ baseFee: 0.1, networkFee: 0.01 })

/** True when `toolId` is one of the platform's paid/known tools. */
export const isKnownToolId = (toolId: string): toolId is CoreToolType => Object.prototype.hasOwnProperty.call(TOOL_FEE_FALLBACKS, toolId)

/**
 * Fallback fees for a tool id (known tools use TOOL_FEE_FALLBACKS, unknown ids the generic defaults).
 *
 * @param toolId - Tool identifier.
 * @returns Fallback base (service) fee and network fee in SOL.
 */
export const getFallbackFees = (toolId: string): { baseFee: number; networkFee: number } => {
  if (isKnownToolId(toolId)) {
    const { baseFee, networkFee } = TOOL_FEE_FALLBACKS[toolId]
    return { baseFee, networkFee }
  }
  return { ...UNKNOWN_TOOL_FEES }
}

/**
 * Reads a fee value coming from Contentful. Missing, empty, non-numeric or negative values fall
 * back; an explicit 0 is respected (a tool can deliberately be made free in Contentful).
 *
 * @param value - Raw Contentful field value.
 * @param fallback - Fee to use when the value is unusable.
 * @returns Fee in SOL.
 */
export const resolveFee = (value: unknown, fallback: number): number => {
  if (value === null || value === undefined || value === '' || typeof value === 'boolean') return fallback
  const fee = Number(value)
  return Number.isFinite(fee) && fee >= 0 ? fee : fallback
}

/**
 * Complete tool configuration built from the fallback fees (tool enabled).
 *
 * @param toolId - Known tool identifier.
 * @returns Tool configuration with fallback fees.
 */
export const getFallbackToolConfig = (toolId: CoreToolType): ToolConfiguration => ({
  toolId,
  isEnabled: true,
  baseFee: TOOL_FEE_FALLBACKS[toolId].baseFee,
  networkFee: TOOL_FEE_FALLBACKS[toolId].networkFee,
})

/** Fallback configurations for every known tool (used when Contentful returns nothing). */
export const getFallbackToolConfigurations = (): ToolConfiguration[] =>
  (Object.keys(TOOL_FEE_FALLBACKS) as CoreToolType[]).map(getFallbackToolConfig)

/**
 * Completes a list of Contentful tool configurations with fallbacks:
 * - every known tool missing from Contentful gets its fallback configuration,
 * - Contentful entries with an unusable fee get the tool's fallback fee,
 * - valid Contentful values (including isEnabled and disabledMessage) always win.
 *
 * @param configs - Tool configurations from Contentful (may be empty when Contentful is down).
 * @returns Configurations covering every known tool.
 */
export const withFeeFallbacks = (configs: ToolConfiguration[]): ToolConfiguration[] => {
  const normalized = configs.map((config) => {
    const fallback = getFallbackFees(config.toolId)
    return {
      ...config,
      baseFee: resolveFee(config.baseFee, fallback.baseFee),
      networkFee: resolveFee(config.networkFee, fallback.networkFee),
    }
  })

  const present = new Set(normalized.map((config) => config.toolId))
  const missing = (Object.keys(TOOL_FEE_FALLBACKS) as CoreToolType[]).filter((toolId) => !present.has(toolId)).map(getFallbackToolConfig)

  return [...normalized, ...missing]
}
