import { afterEach, describe, expect, it, vi } from 'vitest'

const load = async (network?: string): Promise<typeof import('../showcaseTools')> => {
  vi.resetModules()
  if (network === undefined) vi.unstubAllEnvs()
  else vi.stubEnv('NEXT_PUBLIC_SOLANA_NETWORK', network)
  return import('../showcaseTools')
}

describe('isToolPathAvailable', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should offer every tool on mainnet', async () => {
    const { isToolPathAvailable } = await load('mainnet-beta')

    expect(isToolPathAvailable('/tools/liquidity-provider')).toBe(true)
    expect(isToolPathAvailable('/tools/token-creator')).toBe(true)
  })

  it('should hide the mainnet-only Liquidity Provider on the devnet showcase', async () => {
    const { isToolPathAvailable } = await load('devnet')

    expect(isToolPathAvailable('/tools/liquidity-provider')).toBe(false)
    expect(isToolPathAvailable('/tools/token-creator')).toBe(true)
  })
})
