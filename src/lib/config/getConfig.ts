import { ConfigType } from '../../types/config'

const getConfig = (): ConfigType => ({
  rpcEndpoint: process.env.RPC_ENDPOINT || 'https://api.devnet-beta.solana.com',
  feeWalletAddress: process.env.FEE_WALLET_ADDRESS || '',
})

export default getConfig
