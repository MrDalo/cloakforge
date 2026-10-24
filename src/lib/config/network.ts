/**
 * Which Solana cluster this deployment runs on, and whether it is the non-commercial devnet showcase.
 *
 * `NEXT_PUBLIC_SOLANA_NETWORK` is inlined at build time, so this module is safe on the server and in the
 * browser. Showcase mode is opt-in: only an explicit `devnet` or `testnet` switches it on, and boot-time env
 * validation (src/lib/config/env.ts) rejects RPC endpoints on a different cluster.
 *
 * In showcase mode the app is a portfolio demo: test tokens only, no real payments, and the legal pages,
 * consent and receipt describe a free demo instead of a paid service.
 */

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet'

const parseNetwork = (value: string | undefined): SolanaNetwork => {
  const network = value?.trim()
  return network === 'devnet' || network === 'testnet' ? network : 'mainnet-beta'
}

/** Cluster from `NEXT_PUBLIC_SOLANA_NETWORK`; anything else (or unset) means mainnet-beta. */
export const SOLANA_NETWORK: SolanaNetwork = parseNetwork(process.env.NEXT_PUBLIC_SOLANA_NETWORK)

/** True on the devnet/testnet portfolio showcase: no real value, no real payments. */
export const IS_SHOWCASE_MODE = SOLANA_NETWORK !== 'mainnet-beta'

/** Human-readable cluster name for notices, e.g. "Devnet". */
export const SOLANA_NETWORK_LABEL = SOLANA_NETWORK === 'mainnet-beta' ? 'Mainnet' : SOLANA_NETWORK === 'devnet' ? 'Devnet' : 'Testnet'

const EXPLORER_ORIGIN = 'https://solscan.io'

/**
 * Solscan URL for a path on this deployment's cluster, e.g. `tx/<signature>`, `token/<mint>`,
 * `account/<address>`. Adds `?cluster=devnet` (or testnet) off mainnet so links never point at the wrong
 * network.
 *
 * @param path - Explorer path without a leading slash (a leading slash is tolerated).
 * @returns Absolute explorer URL.
 */
export function getExplorerUrl(path: string): string {
  const url = new URL(`${EXPLORER_ORIGIN}/${path.replace(/^\/+/, '')}`)
  if (SOLANA_NETWORK !== 'mainnet-beta') url.searchParams.set('cluster', SOLANA_NETWORK)
  return url.toString()
}
