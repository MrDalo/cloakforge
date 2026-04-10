import { describe, it, expect } from 'vitest'
import { commonAdditionalFees, toolFeeConfigs, type ToolId } from '../feeConfigs'

// ---------------------------------------------------------------------------
// commonAdditionalFees
// ---------------------------------------------------------------------------
describe('commonAdditionalFees', () => {
  describe('revokeMintAuthority()', () => {
    it('returns correct fee of 0.05 SOL', () => {
      const fee = commonAdditionalFees.revokeMintAuthority()
      expect(fee.fee).toBe(0.05)
    })

    it('has fieldName revokeMintAuthority', () => {
      expect(commonAdditionalFees.revokeMintAuthority().fieldName).toBe('revokeMintAuthority')
    })

    it('has a non-empty label', () => {
      expect(commonAdditionalFees.revokeMintAuthority().label).toBeTruthy()
    })

    it('has a description', () => {
      const fee = commonAdditionalFees.revokeMintAuthority()
      expect(typeof fee.description).toBe('string')
      expect(fee.description!.length).toBeGreaterThan(0)
    })
  })

  describe('revokeFreezeAuthority()', () => {
    it('returns correct fee of 0.05 SOL', () => {
      expect(commonAdditionalFees.revokeFreezeAuthority().fee).toBe(0.05)
    })

    it('has fieldName revokeFreezeAuthority', () => {
      expect(commonAdditionalFees.revokeFreezeAuthority().fieldName).toBe('revokeFreezeAuthority')
    })
  })

  describe('burnAll()', () => {
    it('returns correct fee of 0.05 SOL', () => {
      expect(commonAdditionalFees.burnAll().fee).toBe(0.05)
    })

    it('has fieldName burnAll', () => {
      expect(commonAdditionalFees.burnAll().fieldName).toBe('burnAll')
    })
  })

  describe('createMetadata()', () => {
    it('returns correct fee of 0.05 SOL', () => {
      expect(commonAdditionalFees.createMetadata().fee).toBe(0.05)
    })

    it('has fieldName createMetadata', () => {
      expect(commonAdditionalFees.createMetadata().fieldName).toBe('createMetadata')
    })
  })

  describe('bulkSend(recipients)', () => {
    it('returns 0.01 SOL minimum for 1 recipient (0.001 * 1 < 0.01)', () => {
      expect(commonAdditionalFees.bulkSend(1).fee).toBe(0.01)
    })

    it('returns 0.01 SOL minimum for 5 recipients (0.001 * 5 < 0.01)', () => {
      expect(commonAdditionalFees.bulkSend(5).fee).toBe(0.01)
    })

    it('returns 0.01 SOL for exactly 10 recipients (0.001 * 10 == 0.01)', () => {
      expect(commonAdditionalFees.bulkSend(10).fee).toBe(0.01)
    })

    it('scales linearly for more than 10 recipients', () => {
      expect(commonAdditionalFees.bulkSend(100).fee).toBe(0.1)
      expect(commonAdditionalFees.bulkSend(1000).fee).toBe(1)
    })

    it('has fieldName bulkSend', () => {
      expect(commonAdditionalFees.bulkSend(10).fieldName).toBe('bulkSend')
    })

    it('includes recipient count in description', () => {
      const fee = commonAdditionalFees.bulkSend(42)
      expect(fee.description).toContain('42')
    })
  })

  describe('priorityProcessing(level)', () => {
    it('defaults to medium priority', () => {
      expect(commonAdditionalFees.priorityProcessing().fee).toBe(0.005)
    })

    it('returns 0.001 SOL for low priority', () => {
      expect(commonAdditionalFees.priorityProcessing('low').fee).toBe(0.001)
    })

    it('returns 0.005 SOL for medium priority', () => {
      expect(commonAdditionalFees.priorityProcessing('medium').fee).toBe(0.005)
    })

    it('returns 0.01 SOL for high priority', () => {
      expect(commonAdditionalFees.priorityProcessing('high').fee).toBe(0.01)
    })

    it('has fieldName priorityProcessing', () => {
      expect(commonAdditionalFees.priorityProcessing().fieldName).toBe('priorityProcessing')
    })

    it('includes priority level in label (uppercase)', () => {
      expect(commonAdditionalFees.priorityProcessing('low').label).toContain('LOW')
      expect(commonAdditionalFees.priorityProcessing('medium').label).toContain('MEDIUM')
      expect(commonAdditionalFees.priorityProcessing('high').label).toContain('HIGH')
    })
  })
})

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
    'create-liquidity',
    'freeze-accounts',
    'unfreeze-accounts',
    'token-auditor',
  ]

  it('contains all expected tool IDs as keys', () => {
    validToolIds.forEach((id) => {
      expect(toolFeeConfigs).toHaveProperty(id)
    })
  })

  describe('token-creator', () => {
    it('returns revokeMintAuthority and revokeFreezeAuthority fees', () => {
      const fees = toolFeeConfigs['token-creator']()
      expect(fees).toHaveLength(2)
      expect(fees.map((f) => f.fieldName)).toEqual(['revokeMintAuthority', 'revokeFreezeAuthority'])
    })
  })

  describe('burn-tokens', () => {
    it('returns burnAll fee', () => {
      const fees = toolFeeConfigs['burn-tokens']()
      expect(fees).toHaveLength(1)
      expect(fees[0].fieldName).toBe('burnAll')
    })
  })

  describe('revoke-mint-authority', () => {
    it('returns empty array (no additional fees)', () => {
      expect(toolFeeConfigs['revoke-mint-authority']()).toEqual([])
    })
  })

  describe('revoke-freeze-authority', () => {
    it('returns empty array (no additional fees)', () => {
      expect(toolFeeConfigs['revoke-freeze-authority']()).toEqual([])
    })
  })

  describe('freeze-accounts', () => {
    it('returns empty array (no additional fees)', () => {
      expect(toolFeeConfigs['freeze-accounts']()).toEqual([])
    })
  })

  describe('unfreeze-accounts', () => {
    it('returns empty array (no additional fees)', () => {
      expect(toolFeeConfigs['unfreeze-accounts']()).toEqual([])
    })
  })

  describe('token-auditor', () => {
    it('returns empty array (no additional fees)', () => {
      expect(toolFeeConfigs['token-auditor']()).toEqual([])
    })
  })

  describe('transaction-multisender', () => {
    it('returns empty array when no recipients in formData', () => {
      const fees = toolFeeConfigs['transaction-multisender']({})
      expect(fees).toEqual([])
    })

    it('returns empty array when recipients array is empty', () => {
      const fees = toolFeeConfigs['transaction-multisender']({ recipients: [] })
      expect(fees).toEqual([])
    })

    it('returns bulkSend fee when recipients are present', () => {
      const fees = toolFeeConfigs['transaction-multisender']({ recipients: ['a', 'b', 'c'] })
      expect(fees).toHaveLength(1)
      expect(fees[0].fieldName).toBe('bulkSend')
    })

    it('bulkSend fee scales with number of recipients', () => {
      const fees20 = toolFeeConfigs['transaction-multisender']({
        recipients: Array.from({ length: 20 }, (_, i) => `wallet${i}`),
      })
      expect(fees20[0].fee).toBe(0.02) // 0.001 * 20
    })

    it('returns empty array when no formData is provided', () => {
      const fees = toolFeeConfigs['transaction-multisender']()
      expect(fees).toEqual([])
    })
  })

  describe('create-liquidity', () => {
    it('returns createMetadata fee by default', () => {
      const fees = toolFeeConfigs['create-liquidity']()
      expect(fees).toHaveLength(1)
      expect(fees[0].fieldName).toBe('createMetadata')
    })

    it('adds priorityProcessing fee when priorityFee is specified', () => {
      const fees = toolFeeConfigs['create-liquidity']({ priorityFee: 'high' })
      expect(fees).toHaveLength(2)
      const fieldNames = fees.map((f) => f.fieldName)
      expect(fieldNames).toContain('createMetadata')
      expect(fieldNames).toContain('priorityProcessing')
    })

    it('priorityProcessing fee uses the provided level', () => {
      const fees = toolFeeConfigs['create-liquidity']({ priorityFee: 'low' })
      const priorityFee = fees.find((f) => f.fieldName === 'priorityProcessing')!
      expect(priorityFee.fee).toBe(0.001)
    })

    it('does not add priorityProcessing when priorityFee is not provided', () => {
      const fees = toolFeeConfigs['create-liquidity']({})
      expect(fees.find((f) => f.fieldName === 'priorityProcessing')).toBeUndefined()
    })
  })
})
