import { ConfigType } from '../../types/config'

const getConfig = (): ConfigType => ({
  rpcEndpoint:
    process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
  ipfsApiKey: process.env.IPFS_API_KEY || '',
  ipfsApiSecret: process.env.IPFS_API_SECRET || '',
  ipfsJWT: process.env.IPFS_JWT || '',
  ipfsGateway: process.env.IPFS_GATEWAY || '',
})

export default getConfig
