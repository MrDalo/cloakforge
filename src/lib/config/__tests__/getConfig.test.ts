import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// ---------------------------------------------------------------------------
// We need to re-import getConfig after mutating process.env for each test,
// because the function reads env vars at call-time (not module load-time).
// ---------------------------------------------------------------------------

describe('getConfig', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Isolate env mutations by working on a fresh copy
    process.env = { ...originalEnv }
    vi.resetModules()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('returns rpcPublicEndpoint from NEXT_PUBLIC_RPC_ENDPOINT env var', async () => {
    process.env.NEXT_PUBLIC_RPC_ENDPOINT = 'https://custom.rpc.endpoint'
    const { default: getConfig } = await import('../getConfig')
    const config = getConfig()
    expect(config.rpcPublicEndpoint).toBe('https://custom.rpc.endpoint')
  })

  it('falls back to devnet-beta when NEXT_PUBLIC_RPC_ENDPOINT is not set', async () => {
    delete process.env.NEXT_PUBLIC_RPC_ENDPOINT
    const { default: getConfig } = await import('../getConfig')
    const config = getConfig()
    expect(config.rpcPublicEndpoint).toBe('https://api.devnet-beta.solana.com')
  })

  it('returns feeWalletAddress from FEE_WALLET_ADDRESS env var', async () => {
    process.env.FEE_WALLET_ADDRESS = 'MyFeeWalletAddress'
    const { default: getConfig } = await import('../getConfig')
    const config = getConfig()
    expect(config.feeWalletAddress).toBe('MyFeeWalletAddress')
  })

  it('defaults feeWalletAddress to empty string when FEE_WALLET_ADDRESS is not set', async () => {
    delete process.env.FEE_WALLET_ADDRESS
    const { default: getConfig } = await import('../getConfig')
    const config = getConfig()
    expect(config.feeWalletAddress).toBe('')
  })

  it('returns both values together from env vars', async () => {
    process.env.NEXT_PUBLIC_RPC_ENDPOINT = 'https://mainnet.rpc.test'
    process.env.FEE_WALLET_ADDRESS = 'SolanaFeeWallet123'
    const { default: getConfig } = await import('../getConfig')
    const config = getConfig()
    expect(config).toEqual({
      rpcPublicEndpoint: 'https://mainnet.rpc.test',
      feeWalletAddress: 'SolanaFeeWallet123',
    })
  })

  it('returns ConfigType shape with required keys', async () => {
    const { default: getConfig } = await import('../getConfig')
    const config = getConfig()
    expect(Object.keys(config)).toContain('rpcPublicEndpoint')
    expect(Object.keys(config)).toContain('feeWalletAddress')
  })
})
