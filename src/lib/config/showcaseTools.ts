import { IS_SHOWCASE_MODE } from './network'

/**
 * Tool pages that cannot work on the devnet/testnet showcase. The Liquidity Provider relies on Raydium
 * program ids that exist on mainnet only.
 */
const SHOWCASE_DISABLED_TOOL_PATHS: readonly string[] = ['/tools/liquidity-provider']

/**
 * Whether a tool page is offered on this deployment. Always true on mainnet; hides mainnet-only tools in
 * showcase mode (navigation, footer, home tool list, sitemap, llms.txt).
 *
 * @param path - Tool route, e.g. `/tools/liquidity-provider`.
 * @returns False only for mainnet-only tools while running the showcase.
 */
export const isToolPathAvailable = (path: string): boolean => !IS_SHOWCASE_MODE || !SHOWCASE_DISABLED_TOOL_PATHS.includes(path)
