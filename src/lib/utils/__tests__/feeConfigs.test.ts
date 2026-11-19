import { describe, it, expect } from 'vitest'
import { TOKEN_CREATOR_OPTION_FEES } from '@/lib/config/toolFeeFallbacks'
import { toolFeeConfigs, type ToolId } from '../feeConfigs'

// ---------------------------------------------------------------------------
// toolFeeConfigs
// ---------------------------------------------------------------------------
describe('toolFeeConfigs', () => {
  const validToolIds: ToolId[] = [
    'token-creator',
    'transaction-multisender',
    'burn-tokens',
    'revoke-mint-authority',
    'revoke-freeze-authority',
    'liquidity-provider',
    'freeze-wallets',
    'unfreeze-wallets',
    'token-auditor',
  ]

  it('should contains all expected tool IDs as keys', () => {
    validToolIds.forEach((id) => {
      expect(toolFeeConfigs).toHaveProperty(id)
    })
  })

  describe('token-creator', () => {
    it('should returns revokeMintAuthority and revokeFreezeAuthority fees', () => {
      const fees = toolFeeConfigs['token-creator']()
      expect(fees).toHaveLength(2)
      expect(fees.map((f) => f.fieldName)).toEqual(['revokeMintAuthority', 'revokeFreezeAuthority'])
    })
  })

  describe('burn-tokens', () => {
    it('should returns empty array (no additional fees)', () => {
      const fees = toolFeeConfigs['burn-tokens']()
      expect(fees).toEqual([])
    })
  })

  describe('revoke-mint-authority', () => {
    it('should returns empty array (no additional fees)', () => {
      expect(toolFeeConfigs['revoke-mint-authority']()).toEqual([])
    })
  })

  describe('revoke-freeze-authority', () => {
    it('should returns empty array (no additional fees)', () => {
      expect(toolFeeConfigs['revoke-freeze-authority']()).toEqual([])
    })
  })

  describe('freeze-wallets', () => {
    it('should returns empty array (no additional fees)', () => {
      expect(toolFeeConfigs['freeze-wallets']()).toEqual([])
    })
  })

  describe('unfreeze-wallets', () => {
    it('should returns empty array (no additional fees)', () => {
      expect(toolFeeConfigs['unfreeze-wallets']()).toEqual([])
    })
  })

  describe('token-auditor', () => {
    it('should returns empty array (no additional fees)', () => {
      expect(toolFeeConfigs['token-auditor']()).toEqual([])
    })
  })

  describe('transaction-multisender', () => {
    it('should returns empty array (no additional fees)', () => {
      const fees = toolFeeConfigs['transaction-multisender']()
      expect(fees).toEqual([])
    })
  })

  describe('liquidity-provider', () => {
    it('should returns empty array (no additional fees)', () => {
      const fees = toolFeeConfigs['liquidity-provider']()
      expect(fees).toEqual([])
    })
  })
})

describe('toolFeeConfigs — token creator add-on fees', () => {
  it('should charge the shared token creator option fees (0.05 SOL each)', () => {
    const fees = toolFeeConfigs['token-creator']()

    expect(fees.find((fee) => fee.fieldName === 'revokeMintAuthority')?.fee).toBe(TOKEN_CREATOR_OPTION_FEES.revokeMintAuthority)
    expect(fees.find((fee) => fee.fieldName === 'revokeFreezeAuthority')?.fee).toBe(TOKEN_CREATOR_OPTION_FEES.revokeFreezeAuthority)
    expect(fees.map((fee) => fee.fee)).toEqual([0.05, 0.05])
  })
})
