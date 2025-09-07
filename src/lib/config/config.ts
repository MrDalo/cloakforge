import { ConfigType } from '../../types/config'

const getConfig = (): ConfigType => ({
  rpcEndpoint: process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
  ipfsApiKey: process.env.IPFS_API_KEY || '',
  ipfsApiSecret: process.env.IPFS_API_SECRET || '',
  ipfsJWT: process.env.IPFS_JWT || '',
  ipfsGateway: process.env.IPFS_GATEWAY || '',
  ipfsTokenImagesGroupId: process.env.IPFS_TOKEN_IMAGES_GROUP_ID || '',
  ipfsJsonMetadataGroupId: process.env.IPFS_JSON_METADATA_GROUP_ID || '',
  coinmarketcapApiKey: process.env.COINMARKETCAP_API_KEY || '',
  alchemyApiKey: process.env.ALCHEMY_API_KEY || '',
  feeWalletAddress: process.env.FEE_WALLET_ADDRESS || '',
})

export default getConfig
