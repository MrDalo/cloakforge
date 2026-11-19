import { describe, it, expect } from 'vitest'
import type { CoreToolType } from '@/types/toolTypes'
import { isValidToolType } from '@/types/toolTypes'
import {
  TOOL_FEE_FALLBACKS,
  TOKEN_CREATOR_OPTION_FEES,
  FALLBACK_NETWORK_FEE_SOL,
  isKnownToolId,
  getFallbackFees,
  resolveFee,
  getFallbackToolConfig,
  getFallbackToolConfigurations,
  withFeeFallbacks,
} from '../toolFeeFallbacks'

const ALL_TOOLS: CoreToolType[] = [
  'token-creator',
  'burn-tokens',
  'transaction-multisender',
  'freeze-wallets',
  'unfreeze-wallets',
  'revoke-mint-authority',
  'revoke-freeze-authority',
  'revoke-metadata-authority',
  'update-metadata',
  'liquidity-provider',
  'token-auditor',
]

describe('TOOL_FEE_FALLBACKS', () => {
  // The agreed fallback price list — changing a value here is a pricing decision
  it.each([
    ['liquidity-provider', 0.5, 'flat'],
    ['revoke-mint-authority', 0.1, 'flat'],
    ['token-auditor', 0.01, 'flat'],
    ['token-creator', 0.19, 'flat'],
    ['transaction-multisender', 0.001, 'per-address'],
    ['burn-tokens', 0.001, 'flat'],
    ['freeze-wallets', 0.01, 'per-address'],
    ['revoke-freeze-authority', 0.1, 'flat'],
    ['unfreeze-wallets', 0.01, 'per-address'],
    ['update-metadata', 0.19, 'flat'],
    ['revoke-metadata-authority', 0.1, 'flat'],
  ] as const)('should charge %s a fallback service fee of %s SOL (%s)', (toolId, baseFee, unit) => {
    expect(TOOL_FEE_FALLBACKS[toolId].baseFee).toBe(baseFee)
    expect(TOOL_FEE_FALLBACKS[toolId].unit).toBe(unit)
  })

  it('should define a fallback for every tool type and nothing else', () => {
    expect(Object.keys(TOOL_FEE_FALLBACKS).sort()).toEqual([...ALL_TOOLS].sort())
    Object.keys(TOOL_FEE_FALLBACKS).forEach((toolId) => expect(isValidToolType(toolId)).toBe(true))
  })

  it('should use the standard estimated network fee for every tool', () => {
    Object.values(TOOL_FEE_FALLBACKS).forEach((fallback) => expect(fallback.networkFee).toBe(FALLBACK_NETWORK_FEE_SOL))
    expect(FALLBACK_NETWORK_FEE_SOL).toBe(0.0005)
  })

  it('should never define a free (zero) fallback service fee', () => {
    Object.values(TOOL_FEE_FALLBACKS).forEach((fallback) => expect(fallback.baseFee).toBeGreaterThan(0))
  })

  it('should be immutable', () => {
    expect(Object.isFrozen(TOOL_FEE_FALLBACKS)).toBe(true)
    expect(() => {
      ;(TOOL_FEE_FALLBACKS as Record<string, unknown>)['burn-tokens'] = { baseFee: 0 }
    }).toThrow()
  })

  it('should not allow changing a single fee at runtime (deeply frozen)', () => {
    expect(() => {
      ;(TOOL_FEE_FALLBACKS['burn-tokens'] as { baseFee: number }).baseFee = 0
    }).toThrow()
    expect(TOOL_FEE_FALLBACKS['burn-tokens'].baseFee).toBe(0.001)
  })
})

describe('TOKEN_CREATOR_OPTION_FEES', () => {
  it('should charge 0.05 SOL for revoking the mint authority during token creation', () => {
    expect(TOKEN_CREATOR_OPTION_FEES.revokeMintAuthority).toBe(0.05)
  })

  it('should charge 0.05 SOL for revoking the freeze authority during token creation', () => {
    expect(TOKEN_CREATOR_OPTION_FEES.revokeFreezeAuthority).toBe(0.05)
  })

  it('should be cheaper than the standalone revoke tools', () => {
    expect(TOKEN_CREATOR_OPTION_FEES.revokeMintAuthority).toBeLessThan(TOOL_FEE_FALLBACKS['revoke-mint-authority'].baseFee)
    expect(TOKEN_CREATOR_OPTION_FEES.revokeFreezeAuthority).toBeLessThan(TOOL_FEE_FALLBACKS['revoke-freeze-authority'].baseFee)
  })

  it('should be immutable', () => {
    expect(Object.isFrozen(TOKEN_CREATOR_OPTION_FEES)).toBe(true)
  })
})

describe('isKnownToolId', () => {
  it.each(ALL_TOOLS)('should recognise %s', (toolId) => {
    expect(isKnownToolId(toolId)).toBe(true)
  })

  it.each(['', 'unknown-tool', 'all', 'default', 'toString', '__proto__', 'constructor'])('should reject %j', (toolId) => {
    expect(isKnownToolId(toolId)).toBe(false)
  })
})

describe('getFallbackFees', () => {
  it('should return the tool fallback fees for a known tool', () => {
    expect(getFallbackFees('liquidity-provider')).toEqual({ baseFee: 0.5, networkFee: 0.0005 })
    expect(getFallbackFees('transaction-multisender')).toEqual({ baseFee: 0.001, networkFee: 0.0005 })
  })

  it('should return generic defaults for an unknown tool id', () => {
    expect(getFallbackFees('some-future-tool')).toEqual({ baseFee: 0.1, networkFee: 0.01 })
  })

  it('should return a copy that cannot alter the fallback table', () => {
    const fees = getFallbackFees('burn-tokens')
    fees.baseFee = 99
    expect(TOOL_FEE_FALLBACKS['burn-tokens'].baseFee).toBe(0.001)
  })
})

describe('resolveFee', () => {
  it.each([
    ['a number', 0.25, 0.25],
    ['a numeric string', '0.3', 0.3],
    ['an integer', 2, 2],
    ['an explicit zero (tool made free in Contentful)', 0, 0],
    ['a zero string', '0', 0],
  ])('should use %s', (_label, value, expected) => {
    expect(resolveFee(value, 0.7)).toBe(expected)
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty string', ''],
    ['a non-numeric string', 'abc'],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['a negative number', -0.1],
    ['a boolean', true],
    ['an object', { fee: 1 }],
  ])('should fall back for %s', (_label, value) => {
    expect(resolveFee(value, 0.7)).toBe(0.7)
  })
})

describe('getFallbackToolConfig', () => {
  it('should build an enabled configuration with the fallback fees', () => {
    expect(getFallbackToolConfig('token-creator')).toEqual({ toolId: 'token-creator', isEnabled: true, baseFee: 0.19, networkFee: 0.0005 })
  })
})

describe('getFallbackToolConfigurations', () => {
  it('should return one enabled configuration per tool with its fallback fee', () => {
    const configs = getFallbackToolConfigurations()

    expect(configs.map((c) => c.toolId).sort()).toEqual([...ALL_TOOLS].sort())
    configs.forEach((config) => {
      expect(config.isEnabled).toBe(true)
      expect(config.baseFee).toBe(TOOL_FEE_FALLBACKS[config.toolId as CoreToolType].baseFee)
    })
  })
})

describe('withFeeFallbacks', () => {
  it('should provide the fallback configuration of every tool when Contentful returned nothing', () => {
    expect(withFeeFallbacks([])).toEqual(getFallbackToolConfigurations())
  })

  it('should keep Contentful configurations and add fallbacks only for missing tools', () => {
    const contentful = [{ toolId: 'burn-tokens', isEnabled: true, baseFee: 0.02, networkFee: 0.001 }]
    const result = withFeeFallbacks(contentful)

    expect(result).toHaveLength(ALL_TOOLS.length)
    expect(result.find((c) => c.toolId === 'burn-tokens')).toEqual(contentful[0])
    expect(result.find((c) => c.toolId === 'liquidity-provider')?.baseFee).toBe(0.5)
  })

  it('should never duplicate a tool', () => {
    const result = withFeeFallbacks([{ toolId: 'token-creator', isEnabled: true, baseFee: 0.2, networkFee: 0.001 }])
    expect(result.filter((c) => c.toolId === 'token-creator')).toHaveLength(1)
  })

  it('should keep Contentful flags such as isEnabled=false and the disabled message', () => {
    const result = withFeeFallbacks([
      { toolId: 'update-metadata', isEnabled: false, disabledMessage: 'Maintenance', baseFee: 0.3, networkFee: 0.001 },
    ])

    expect(result.find((c) => c.toolId === 'update-metadata')).toMatchObject({
      isEnabled: false,
      disabledMessage: 'Maintenance',
      baseFee: 0.3,
    })
  })

  it('should replace unusable Contentful fee values with the tool fallback', () => {
    const result = withFeeFallbacks([{ toolId: 'freeze-wallets', isEnabled: true, baseFee: Number.NaN, networkFee: -1 }])

    expect(result.find((c) => c.toolId === 'freeze-wallets')).toMatchObject({ baseFee: 0.01, networkFee: 0.0005 })
  })

  it('should keep an explicit zero fee from Contentful', () => {
    const result = withFeeFallbacks([{ toolId: 'token-auditor', isEnabled: true, baseFee: 0, networkFee: 0 }])

    expect(result.find((c) => c.toolId === 'token-auditor')).toMatchObject({ baseFee: 0, networkFee: 0 })
  })

  it('should keep configurations of tools it does not know about', () => {
    const unknown = { toolId: 'some-future-tool', isEnabled: true, baseFee: 0.3, networkFee: 0.001 }
    expect(withFeeFallbacks([unknown])).toContainEqual(unknown)
  })

  it('should not mutate the input', () => {
    const input = [{ toolId: 'burn-tokens', isEnabled: true, baseFee: Number.NaN, networkFee: 0.001 }]
    withFeeFallbacks(input)
    expect(input[0].baseFee).toBeNaN()
  })
})
