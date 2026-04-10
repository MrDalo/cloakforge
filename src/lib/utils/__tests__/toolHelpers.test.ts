import { describe, it, expect } from 'vitest'
import {
  shouldIncludeAuthorities,
  getStaleTimeForTool,
  getToolConfig,
  isValidToolType,
  getToolDisplayName,
  TOOL_CONFIGS,
  type ToolType,
} from '../toolHelpers'

// ---------------------------------------------------------------------------
// shouldIncludeAuthorities
// ---------------------------------------------------------------------------

describe('shouldIncludeAuthorities', () => {
  const authorityTools: ToolType[] = ['revoke-mint-authority', 'revoke-freeze-authority', 'freeze-accounts', 'unfreeze-accounts']

  const nonAuthorityTools: ToolType[] = [
    'burn-tokens',
    'create-liquidity',
    'token-creator',
    'token-auditor',
    'transaction-multisender',
    'all',
    'default',
  ]

  it.each(authorityTools)('returns true for %s', (toolType) => {
    expect(shouldIncludeAuthorities(toolType)).toBe(true)
  })

  it.each(nonAuthorityTools)('returns false for %s', (toolType) => {
    expect(shouldIncludeAuthorities(toolType)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getStaleTimeForTool
// ---------------------------------------------------------------------------

describe('getStaleTimeForTool', () => {
  it('returns 60000 (1 min) for authority-based tools', () => {
    expect(getStaleTimeForTool('revoke-mint-authority')).toBe(60000)
    expect(getStaleTimeForTool('revoke-freeze-authority')).toBe(60000)
    expect(getStaleTimeForTool('freeze-accounts')).toBe(60000)
    expect(getStaleTimeForTool('unfreeze-accounts')).toBe(60000)
  })

  it('returns Infinity for burn-tokens', () => {
    expect(getStaleTimeForTool('burn-tokens')).toBe(Infinity)
  })

  it('returns 30000 (30 s) for create-liquidity', () => {
    expect(getStaleTimeForTool('create-liquidity')).toBe(30000)
  })

  it('returns 120000 (2 min) for general tools', () => {
    expect(getStaleTimeForTool('all')).toBe(120000)
    expect(getStaleTimeForTool('default')).toBe(120000)
    expect(getStaleTimeForTool('token-creator')).toBe(120000)
    expect(getStaleTimeForTool('transaction-multisender')).toBe(120000)
  })
})

// ---------------------------------------------------------------------------
// getToolConfig
// ---------------------------------------------------------------------------

describe('getToolConfig', () => {
  it('returns the config object for burn-tokens', () => {
    const config = getToolConfig('burn-tokens')
    expect(config.requiresAuthorities).toBe(false)
    expect(config.requiresNonZeroBalance).toBe(true)
    expect(config.cacheTime).toBe(Infinity)
    expect(typeof config.description).toBe('string')
  })

  it('returns the config object for revoke-mint-authority', () => {
    const config = getToolConfig('revoke-mint-authority')
    expect(config.requiresAuthorities).toBe(true)
    expect(config.requiresNonZeroBalance).toBe(false)
    expect(config.cacheTime).toBe(60000)
  })

  it('returns the config object for create-liquidity', () => {
    const config = getToolConfig('create-liquidity')
    expect(config.requiresAuthorities).toBe(false)
    expect(config.requiresNonZeroBalance).toBe(true)
    expect(config.cacheTime).toBe(30000)
  })

  it('returns configs for all defined tool types', () => {
    const toolTypes = Object.keys(TOOL_CONFIGS) as ToolType[]
    toolTypes.forEach((toolType) => {
      const config = getToolConfig(toolType)
      expect(config).toBeDefined()
      expect(typeof config.description).toBe('string')
    })
  })
})

// ---------------------------------------------------------------------------
// isValidToolType
// ---------------------------------------------------------------------------

describe('isValidToolType', () => {
  const validTypes = [
    'burn-tokens',
    'revoke-mint-authority',
    'revoke-freeze-authority',
    'freeze-accounts',
    'unfreeze-accounts',
    'create-liquidity',
    'token-creator',
    'token-auditor',
    'transaction-multisender',
    'all',
    'default',
  ]

  it.each(validTypes)('returns true for valid type "%s"', (toolType) => {
    expect(isValidToolType(toolType)).toBe(true)
  })

  it('returns false for an invalid tool type string', () => {
    expect(isValidToolType('invalid-tool')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isValidToolType('')).toBe(false)
  })

  it('returns false for a partially matching string', () => {
    expect(isValidToolType('burn')).toBe(false)
  })

  it('returns false for numeric strings', () => {
    expect(isValidToolType('123')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getToolDisplayName
// ---------------------------------------------------------------------------

describe('getToolDisplayName', () => {
  const expectedNames: Array<[ToolType, string]> = [
    ['burn-tokens', 'Burn Tokens'],
    ['revoke-mint-authority', 'Revoke Mint Authority'],
    ['revoke-freeze-authority', 'Revoke Freeze Authority'],
    ['freeze-accounts', 'Freeze Accounts'],
    ['unfreeze-accounts', 'Unfreeze Accounts'],
    ['create-liquidity', 'Create Liquidity'],
    ['token-creator', 'Token Creator'],
    ['token-auditor', 'Token Auditor'],
    ['transaction-multisender', 'Transaction Multisender'],
    ['all', 'All Tokens'],
    ['default', 'Default'],
  ]

  it.each(expectedNames)('returns "%s" for tool type "%s"', (toolType, expected) => {
    expect(getToolDisplayName(toolType)).toBe(expected)
  })
})
