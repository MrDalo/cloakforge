import { type ConfigType } from '../../types/config'

/**
 * Client-safe configuration. `NEXT_PUBLIC_RPC_ENDPOINT` is inlined into the browser bundle, so its API key
 * is public (SRV-12): use a separate, domain-restricted Alchemy app with a spend cap for it.
 *
 * The devnet fallback is a development convenience only; production runtimes are validated at boot by
 * `validateEnv()` (src/lib/config/env.ts via src/instrumentation.ts).
 */
const getConfig = (): ConfigType => ({
  rpcPublicEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet-beta.solana.com',
  feeWalletAddress: process.env.FEE_WALLET_ADDRESS || '',
})

export default getConfig
