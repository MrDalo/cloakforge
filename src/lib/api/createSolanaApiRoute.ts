import { type NextRequest } from 'next/server'
import { type z } from 'zod'
import { PublicKey } from '@solana/web3.js'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import { assertNotSanctioned } from '@/lib/compliance/screenAddresses'
import { type ToolConfiguration } from '@/lib/contentful/client'
import { IS_SHOWCASE_MODE } from '@/lib/config/network'
import { createApiRoute } from './createApiRoute'

const logger = getLogger({ context: 'api', component: 'createSolanaApiRoute' })

/** Message returned by `mainnetOnly` routes on the devnet/testnet showcase. */
const MAINNET_ONLY_MESSAGE = 'This tool is available on mainnet only and is not part of this devnet showcase.'

/** Message returned when a disabled tool has no `disabledMessage` in Contentful. */
const DEFAULT_TOOL_DISABLED_MESSAGE = 'This tool is temporarily disabled. Please try again later.'

/**
 * Configuration for Solana-specific API routes
 */
interface SolanaApiRouteConfig<TInput, TOutput> {
  /** Route name for logging (e.g., 'solana/burn-tokens') */
  name: string

  /**
   * Contentful tool ID whose `isEnabled` kill switch gates this route server-side.
   * Defaults to `name` without the `solana/` prefix ('solana/burn-tokens' → 'burn-tokens').
   * Set it when the route name differs from the tool ID, or pass `null` for read-only
   * routes that are not tools (e.g. wallet-tokens).
   */
  toolId?: string | null

  /**
   * Mainnet-only route (e.g. Raydium program ids exist on mainnet only): refuses every request with
   * TOOL_DISABLED (503) while `IS_SHOWCASE_MODE` is on. No effect on mainnet.
   */
  mainnetOnly?: boolean

  /** Zod schema for input validation */
  schema: z.ZodSchema<TInput>

  /** Handler function with validated Solana addresses */
  handler: (data: TInput & { walletPublicKey: PublicKey }, request: NextRequest) => Promise<TOutput>

  /** Additional address fields to validate (besides walletAddress) */
  additionalAddressFields?: (keyof TInput)[]
}

/**
 * Resolves the Contentful tool ID for a route (explicit `toolId` wins; `null` opts out).
 *
 * @param name - Route name.
 * @param toolId - Explicit tool ID from the route config.
 * @returns Tool ID to check, or null when the route is not gated.
 */
const resolveRouteToolId = (name: string, toolId: string | null | undefined): string | null =>
  toolId === undefined ? name.replace(/^solana\//, '') : toolId

/**
 * Enforces the Contentful kill switch on the server (the UI button alone can be bypassed).
 *
 * When Contentful is unavailable the tool stays enabled (availability); fees then use the
 * server's hard-coded minimums, so an outage never makes a tool free.
 *
 * The tool-config cache is imported lazily so that importing the `@/lib/api` barrel does not
 * construct the Contentful client at module load (a client that cannot be created counts as
 * "config unavailable").
 *
 * @param toolId - Contentful tool identifier.
 * @throws AppError TOOL_DISABLED (503) with the configured `disabledMessage`.
 */
async function assertToolEnabled(toolId: string): Promise<void> {
  let config: ToolConfiguration | null
  try {
    const { getCachedToolConfig } = await import('@/lib/contentful/toolConfigCache')
    config = await getCachedToolConfig(toolId)
  } catch (error) {
    logger.warn('Tool configuration unavailable; kill switch not enforced for this request', error, { toolId })
    return
  }

  if (config && !config.isEnabled) {
    throw new AppError('TOOL_DISABLED', config.disabledMessage || DEFAULT_TOOL_DISABLED_MESSAGE, 503)
  }
}

/**
 * Creates a Solana-specific API route with automatic PublicKey validation
 *
 * This wrapper extends createApiRoute with Solana-specific validation:
 * - Rejects requests referencing OFAC-sanctioned addresses (403)
 * - Rejects requests for tools disabled in Contentful, or mainnet-only tools on the showcase (503)
 * - Validates wallet address format
 * - Converts string addresses to PublicKey instances
 * - Validates additional Solana addresses if specified
 *
 * @example
 * ```typescript
 * export const POST = createSolanaApiRoute({
 *   name: 'solana/burn-tokens',
 *   schema: burnTokensRequestSchema,
 *   additionalAddressFields: ['tokenAccountAddress', 'mintAddress'],
 *   handler: async (data) => {
 *     // data.walletPublicKey is already a PublicKey instance
 *     return await burnToken(data)
 *   }
 * })
 * ```
 */
export function createSolanaApiRoute<TInput extends { walletAddress: string }, TOutput>(
  config: SolanaApiRouteConfig<TInput, TOutput>
): ReturnType<typeof createApiRoute<TInput, TOutput>> {
  const { name, schema, handler, additionalAddressFields = [] } = config
  const toolId = resolveRouteToolId(name, config.toolId)

  return createApiRoute<TInput, TOutput>({
    name,
    schema,
    handler: async (data, request) => {
      // Mainnet-only tools cannot work on the showcase cluster — refuse before any RPC or transaction work
      if (config.mainnetOnly && IS_SHOWCASE_MODE) {
        throw new AppError('TOOL_DISABLED', MAINNET_ONLY_MESSAGE, 503)
      }

      // Sanctions screening — before any RPC or transaction work (wallet, recipients, targets, mints)
      assertNotSanctioned(data)

      // Server-side kill switch — checked before any RPC or transaction work
      if (toolId) {
        await assertToolEnabled(toolId)
      }

      // Validate wallet address
      let walletPublicKey: PublicKey
      try {
        walletPublicKey = new PublicKey(data.walletAddress)
      } catch {
        throw new AppError('INVALID_WALLET_ADDRESS', 'Invalid wallet address format', 400)
      }

      // Validate additional address fields
      for (const field of additionalAddressFields) {
        const address = data[field]
        if (typeof address === 'string') {
          try {
            new PublicKey(address)
          } catch {
            throw new AppError('INVALID_WALLET_ADDRESS', `Invalid address format for ${String(field)}`, 400)
          }
        }
      }

      // Call handler with validated PublicKey
      return await handler({ ...data, walletPublicKey }, request)
    },
  })
}
