import { PublicKey } from '@solana/web3.js'
import { MAINNET_PROGRAM_ID, DEVNET_PROGRAM_ID } from '@raydium-io/raydium-sdk'

export const RAYDIUM_MAINNET_CONFIG = {
  ammProgramId: MAINNET_PROGRAM_ID.AmmV4,
  openBookProgramId: new PublicKey('srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX'),
  feeDestinationId: new PublicKey('7YttLkHDoNj9wyDur5pM1ejNaAvT9X4uqk4t1433kYgg'),
}

export const RAYDIUM_DEVNET_CONFIG = {
  ammProgramId: DEVNET_PROGRAM_ID.AmmV4,
  openBookProgramId: new PublicKey('EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj'),
  feeDestinationId: new PublicKey('3XMrhbv989VxAMi3DErRU95HKKgjAmFBNTJ4LpwZdDtm'), // Devnet fee account
}

export function getRaydiumConfig(network: 'mainnet-beta' | 'devnet' = 'mainnet-beta') {
  return network === 'mainnet-beta' ? RAYDIUM_MAINNET_CONFIG : RAYDIUM_DEVNET_CONFIG
}
