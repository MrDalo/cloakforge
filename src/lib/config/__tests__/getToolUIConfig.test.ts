import { describe, it, expect } from 'vitest'
import { getToolUIConfig, toolUIConfigs } from '../getToolUIConfig'

// getToolUIConfig imports from lucide-react and @/components/common/UnifiedForm/types.ts
// which are both safe to use in the node environment (no browser APIs needed).

describe('toolUIConfigs', () => {
  it('contains all expected tool keys', () => {
    const expectedKeys = [
      'token-creator',
      'transaction-multisender',
      'burn-tokens',
      'revoke-mint-authority',
      'revoke-freeze-authority',
      'create-liquidity',
      'freeze-accounts',
      'unfreeze-accounts',
      'token-auditor',
      'liquidity-provider',
    ]
    expectedKeys.forEach((key) => {
      expect(toolUIConfigs).toHaveProperty(key)
    })
  })

  it('each config has required string fields: title, submitText, loadingText', () => {
    Object.entries(toolUIConfigs).forEach(([toolName, config]) => {
      expect(typeof config.title, `${toolName}.title`).toBe('string')
      expect(config.title.length, `${toolName}.title non-empty`).toBeGreaterThan(0)
      expect(typeof config.submitText, `${toolName}.submitText`).toBe('string')
      expect(typeof config.loadingText, `${toolName}.loadingText`).toBe('string')
    })
  })

  it('each config has a valid GradientVariant', () => {
    const validVariants = ['primary', 'info', 'warning', 'danger', 'success', 'emerald']
    Object.entries(toolUIConfigs).forEach(([toolName, config]) => {
      expect(validVariants, `${toolName}.variant`).toContain(config.variant)
    })
  })

  it('each config has a non-null icon', () => {
    Object.entries(toolUIConfigs).forEach(([toolName, config]) => {
      expect(config.icon, `${toolName}.icon`).toBeTruthy()
    })
  })
})

describe('getToolUIConfig', () => {
  it('returns config for token-creator', () => {
    const config = getToolUIConfig('token-creator')
    expect(config.title).toBe('Create Your Token')
    expect(config.submitText).toBe('Create Token')
    expect(config.loadingText).toBe('Creating Token...')
    expect(config.variant).toBe('primary')
  })

  it('returns config for transaction-multisender', () => {
    const config = getToolUIConfig('transaction-multisender')
    expect(config.title).toBe('Send to Multiple Recipients')
    expect(config.variant).toBe('info')
  })

  it('returns config for burn-tokens', () => {
    const config = getToolUIConfig('burn-tokens')
    expect(config.title).toBe('Burn Your Tokens')
    expect(config.variant).toBe('danger')
  })

  it('returns config for revoke-mint-authority', () => {
    const config = getToolUIConfig('revoke-mint-authority')
    expect(config.title).toBe('Revoke Mint Authority')
    expect(config.variant).toBe('success')
  })

  it('returns config for revoke-freeze-authority', () => {
    const config = getToolUIConfig('revoke-freeze-authority')
    expect(config.title).toBe('Revoke Freeze Authority')
    expect(config.variant).toBe('success')
  })

  it('returns config for create-liquidity', () => {
    const config = getToolUIConfig('create-liquidity')
    expect(config.title).toBe('Create Liquidity Pool')
    expect(config.variant).toBe('success')
  })

  it('returns config for freeze-accounts', () => {
    const config = getToolUIConfig('freeze-accounts')
    expect(config.title).toBe('Freeze Token Accounts')
    expect(config.variant).toBe('info')
  })

  it('returns config for unfreeze-accounts', () => {
    const config = getToolUIConfig('unfreeze-accounts')
    expect(config.title).toBe('Unfreeze Accounts')
    expect(config.variant).toBe('info')
  })

  it('returns config for token-auditor', () => {
    const config = getToolUIConfig('token-auditor')
    expect(config.title).toBe('Token Auditor')
    expect(config.variant).toBe('primary')
  })

  it('returns config for liquidity-provider with baseFee and networkFee', () => {
    const config = getToolUIConfig('liquidity-provider')
    expect(config.title).toBe('Liquidity Provider')
    expect(config.variant).toBe('emerald')
    expect(config.baseFee).toBe(0.19)
    expect(config.networkFee).toBe(0.0005)
  })

  it('throws for an unknown tool name', () => {
    expect(() => getToolUIConfig('unknown-tool')).toThrow('Tool UI configuration not found for: unknown-tool')
  })

  it('throws for empty string tool name', () => {
    expect(() => getToolUIConfig('')).toThrow('Tool UI configuration not found for: ')
  })

  it('throws for a partially matching name', () => {
    expect(() => getToolUIConfig('burn')).toThrow('Tool UI configuration not found for: burn')
  })
})
