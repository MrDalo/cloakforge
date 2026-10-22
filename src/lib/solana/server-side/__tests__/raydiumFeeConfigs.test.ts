import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import {
  feeTierToTradeFeeRate,
  fetchClmmAmmConfig,
  fetchCpmmFeeConfig,
  RAYDIUM_CONFIG_TIMEOUT_MS,
  RAYDIUM_CONFIG_UNAVAILABLE_MESSAGE,
} from '../raydiumFeeConfigs'

/** Entries shaped like Raydium's live `GET /main/cpmm-config` list (several configs share a rate). */
const CPMM_CONFIGS = [
  {
    id: 'D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2',
    index: 0,
    protocolFeeRate: 120000,
    tradeFeeRate: 2500,
    fundFeeRate: 40000,
    createPoolFee: '150000000',
    creatorFeeRate: 500,
  },
  {
    id: 'G95xxie3XbkCqtE39GgQ9Ggc7xBC8Uceve7HFDEFApkc',
    index: 1,
    protocolFeeRate: 120000,
    tradeFeeRate: 10000,
    fundFeeRate: 40000,
    createPoolFee: '150000000',
  },
  {
    id: 'LNmHRmMvk9kmtepfTSr98kqGLThd61kH1DPWf2cVRaC',
    index: 9,
    protocolFeeRate: 120000,
    tradeFeeRate: 2500,
    fundFeeRate: 40000,
    createPoolFee: '150000000',
    creatorFeeRate: 7500,
  },
]

const CLMM_CONFIGS = [
  {
    id: '9iFER3bpjf1PTTCQCfTRu17EJgvsxo9pVyA9QWwEuX4x',
    index: 4,
    protocolFeeRate: 120000,
    tradeFeeRate: 100,
    tickSpacing: 1,
    fundFeeRate: 40000,
  },
  {
    id: '3XCQJQryqpDvvZBfGxR7CLAw5dpGJ9aa7kt1jRLdyxuZ',
    index: 5,
    protocolFeeRate: 120000,
    tradeFeeRate: 500,
    tickSpacing: 1,
    fundFeeRate: 40000,
    description: 'Best for most pairs',
  },
]

const respond = (body: unknown, init: { ok?: boolean; status?: number } = {}) =>
  vi.fn(async () => ({ ok: init.ok ?? true, status: init.status ?? 200, json: async () => body }))

describe('feeTierToTradeFeeRate', () => {
  it.each([
    ['0.01', 100],
    ['0.05', 500],
    ['0.25', 2_500],
    ['1.00', 10_000],
  ] as const)('should convert %s%% to %i parts per million', (feeTier, rate) => {
    expect(feeTierToTradeFeeRate(feeTier)).toBe(rate)
  })
})

describe('fetchCpmmFeeConfig', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should select the config whose trade fee rate matches the tier, preferring the standard (lowest index) one', async () => {
    vi.stubGlobal('fetch', respond({ data: CPMM_CONFIGS }))

    expect(await fetchCpmmFeeConfig('0.25')).toMatchObject({ id: CPMM_CONFIGS[0].id, tradeFeeRate: 2_500, index: 0 })
    expect(await fetchCpmmFeeConfig('1.00')).toMatchObject({ id: CPMM_CONFIGS[1].id, tradeFeeRate: 10_000, creatorFeeRate: 0 })
  })

  it('should reject a tier Raydium does not offer instead of substituting another', async () => {
    vi.stubGlobal('fetch', respond({ data: CPMM_CONFIGS }))

    await expect(fetchCpmmFeeConfig('0.05')).rejects.toMatchObject({ code: 'INVALID_INPUT', status: 400 })
  })

  it('should request the CPMM config list with a timeout', async () => {
    const fetchMock = respond({ data: CPMM_CONFIGS })
    vi.stubGlobal('fetch', fetchMock)

    await fetchCpmmFeeConfig('0.25')

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { signal?: AbortSignal }]
    expect(url).toBe('https://api-v3.raydium.io/main/cpmm-config')
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(RAYDIUM_CONFIG_TIMEOUT_MS).toBeLessThanOrEqual(10_000)
  })

  it('should skip malformed entries and use the valid ones', async () => {
    vi.stubGlobal(
      'fetch',
      respond({ data: [{ id: 'not-an-address', tradeFeeRate: 2500 }, { ...CPMM_CONFIGS[0], tradeFeeRate: -1 }, CPMM_CONFIGS[1]] })
    )

    expect((await fetchCpmmFeeConfig('1.00')).id).toBe(CPMM_CONFIGS[1].id)
  })

  it.each([
    ['an error status', respond({}, { ok: false, status: 502 })],
    ['a network error', vi.fn(async () => Promise.reject(new TypeError('fetch failed: getaddrinfo ENOTFOUND')))],
    ['an unexpected payload', respond({ success: true, result: [] })],
    ['no usable configs', respond({ data: [{ id: 'bad' }] })],
    ['an oversized list', respond({ data: Array.from({ length: 201 }, () => CPMM_CONFIGS[0]) })],
  ])('should fail closed with a generic 503 on %s', async (_label, fetchMock) => {
    vi.stubGlobal('fetch', fetchMock)

    const error = await fetchCpmmFeeConfig('0.25').catch((caught: unknown) => caught)

    expect(error).toMatchObject({ code: 'SERVICE_UNAVAILABLE', status: 503, message: RAYDIUM_CONFIG_UNAVAILABLE_MESSAGE })
    expect(String((error as Error).message)).not.toMatch(/ENOTFOUND|502/)
  })
})

describe('fetchClmmAmmConfig', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', respond({ data: CLMM_CONFIGS }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should return the matching CLMM config with its id as a PublicKey, as the SDK requires', async () => {
    const config = await fetchClmmAmmConfig('0.05')

    expect(config.id).toBeInstanceOf(PublicKey)
    expect(config.id.toBase58()).toBe(CLMM_CONFIGS[1].id)
    expect(config).toMatchObject({ tradeFeeRate: 500, tickSpacing: 1, index: 5, description: 'Best for most pairs', fundOwner: '' })
  })

  it('should reject a tier without a matching CLMM config', async () => {
    await expect(fetchClmmAmmConfig('1.00')).rejects.toMatchObject({ code: 'INVALID_INPUT' })
  })
})
