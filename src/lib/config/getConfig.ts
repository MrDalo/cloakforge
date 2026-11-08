import { type ConfigType } from '../../types/config'

/**
 * Client-safe configuration. `NEXT_PUBLIC_*` values are inlined into the browser bundle, so they are public:
 * - `NEXT_PUBLIC_RPC_ENDPOINT`'s API key is public (SRV-12): use a separate, domain-restricted Alchemy app
 *   with a spend cap for it.
 * - `NEXT_PUBLIC_FEE_WALLET_ADDRESS` is the service-fee wallet (same value as the server's
 *   `FEE_WALLET_ADDRESS`). Hooks pin it when verifying prepared transactions; production builds refuse to
 *   sign without it (see resolveFeeWalletForVerification).
 *
 * The devnet fallback is a development convenience only; production runtimes are validated at boot by
 * `validateEnv()` (src/lib/config/env.ts via src/instrumentation.ts).
 */
const getConfig = (): ConfigType => ({
  rpcPublicEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet-beta.solana.com',
  feeWalletAddress: process.env.NEXT_PUBLIC_FEE_WALLET_ADDRESS || '',
})

export default getConfig
