import { ServerConfigType } from '@/types/serverConfig'
import 'server-only'

const getServerConfig = (): ServerConfigType => ({
  rpcEndpoint: process.env.RPC_ENDPOINT || 'https://api.devnet-beta.solana.com',
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
  vercelUrl: process.env.VERCEL_URL || '',
  appUrl: process.env.APP_URL || '',
})

export default getServerConfig
