import { ConfigType } from '../../types/config'

const getConfig = (): ConfigType => ({
  rpcEndpoint:
    process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
})

export default getConfig
