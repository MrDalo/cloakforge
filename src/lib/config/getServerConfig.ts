import { type ServerConfigType } from '@/types/serverConfig'
import 'server-only'

/**
 * Server-side configuration from env vars.
 *
 * The `||` fallbacks (public devnet RPC, empty secrets) are development conveniences only: in production
 * runtimes `validateEnv()` (src/lib/config/env.ts, called from src/instrumentation.ts at boot) refuses to
 * start when a required variable is missing (unless SKIP_ENV_VALIDATION opts a non-Vercel-Production runtime out).
 */
const getServerConfig = (): ServerConfigType => ({
  rpcPrivateEndpoint: process.env.RPC_PRIVATE_ENDPOINT || 'https://api.devnet-beta.solana.com',
  ipfsApiKey: process.env.IPFS_API_KEY || '',
  ipfsApiSecret: process.env.IPFS_API_SECRET || '',
  ipfsJWT: process.env.IPFS_JWT || '',
  ipfsGateway: process.env.IPFS_GATEWAY || '',
  ipfsTokenImagesGroupId: process.env.IPFS_TOKEN_IMAGES_GROUP_ID || '',
  ipfsJsonMetadataGroupId: process.env.IPFS_JSON_METADATA_GROUP_ID || '',
  alchemyApiKey: process.env.ALCHEMY_API_KEY || '',
  feeWalletAddress: process.env.FEE_WALLET_ADDRESS || '',
  contentfulSpaceId: process.env.CONTENTFUL_SPACE_ID || '',
  contentfulAccessToken: process.env.CONTENTFUL_ACCESS_TOKEN || '',
  contentfulEnvironment: process.env.CONTENTFUL_ENVIRONMENT || '',
  contentfulManagementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN || '',
  couponMemoSecret: process.env.COUPON_MEMO_SECRET || '',
  vercelPublicUrl: process.env.VERCEL_PUBLIC_URL || '',
  appUrl: process.env.APP_URL || '',
})

export default getServerConfig
