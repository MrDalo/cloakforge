import { afterEach, describe, expect, it, vi } from 'vitest'

const loadNetwork = async (network?: string): Promise<typeof import('../network')> => {
  vi.resetModules()
  if (network === undefined) vi.unstubAllEnvs()
  else vi.stubEnv('NEXT_PUBLIC_SOLANA_NETWORK', network)
  return import('../network')
}

describe('network', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each([undefined, '', 'mainnet-beta', 'mainnet', 'garbage'])('should treat %j as mainnet (no showcase)', async (value) => {
    const network = await loadNetwork(value)

    expect(network.SOLANA_NETWORK).toBe('mainnet-beta')
    expect(network.IS_SHOWCASE_MODE).toBe(false)
    expect(network.SOLANA_NETWORK_LABEL).toBe('Mainnet')
  })

  it('should enable showcase mode on devnet', async () => {
    const network = await loadNetwork(' devnet ')

    expect(network.SOLANA_NETWORK).toBe('devnet')
    expect(network.IS_SHOWCASE_MODE).toBe(true)
    expect(network.SOLANA_NETWORK_LABEL).toBe('Devnet')
  })

  it('should enable showcase mode on testnet', async () => {
    const network = await loadNetwork('testnet')

    expect(network.IS_SHOWCASE_MODE).toBe(true)
    expect(network.SOLANA_NETWORK_LABEL).toBe('Testnet')
  })

  describe('getExplorerUrl', () => {
    it('should build plain Solscan URLs on mainnet', async () => {
      const { getExplorerUrl } = await loadNetwork('mainnet-beta')

      expect(getExplorerUrl('tx/abc')).toBe('https://solscan.io/tx/abc')
      expect(getExplorerUrl('/account/xyz')).toBe('https://solscan.io/account/xyz')
    })

    it('should add the cluster query off mainnet', async () => {
      expect((await loadNetwork('devnet')).getExplorerUrl('token/mint1')).toBe('https://solscan.io/token/mint1?cluster=devnet')
      expect((await loadNetwork('testnet')).getExplorerUrl('tx/abc')).toBe('https://solscan.io/tx/abc?cluster=testnet')
    })
  })
})
