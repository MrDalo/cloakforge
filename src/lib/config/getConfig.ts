import { type ConfigType } from '../../types/config'

const getConfig = (): ConfigType => ({
  rpcPublicEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://api.devnet-beta.solana.com',
  feeWalletAddress: process.env.FEE_WALLET_ADDRESS || '',
})

export default getConfig
