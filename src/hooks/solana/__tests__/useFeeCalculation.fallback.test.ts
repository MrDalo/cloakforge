// @vitest-environment jsdom
/**
 * useFeeCalculation — fee breakdown when Contentful is unavailable.
 *
 * Runs on the REAL tool config store and the REAL tool fee configs (token creator add-ons), so it
 * covers what the Fee Breakdown shows users when Contentful provides no tool configuration.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToolConfigStore } from '@/stores/toolConfigStore'
import { useDiscountCouponStore } from '@/stores/discountCouponStore'
import { TOOL_FEE_FALLBACKS, TOKEN_CREATOR_OPTION_FEES } from '@/lib/config/toolFeeFallbacks'
import type { CoreToolType } from '@/types/toolTypes'
import { useFeeCalculation } from '../useFeeCalculation'
import type { ToolId } from '@/lib/utils/feeConfigs'

const loadContentful = (configs: Parameters<ReturnType<typeof useToolConfigStore.getState>['setConfigs']>[0]) =>
  act(() => {
    useToolConfigStore.getState().setConfigs(configs)
  })

const calculate = (toolId: ToolId, formData: Record<string, unknown> = {}, feeMultiplier?: number) =>
  renderHook(() => useFeeCalculation({ toolId, formData, feeMultiplier })).result.current

beforeEach(() => {
  act(() => {
    useToolConfigStore.setState({ configs: {}, lastUpdated: null, isLoading: false })
    useDiscountCouponStore.setState({ appliedCoupon: null, isValidating: false, error: null })
  })
})

describe('useFeeCalculation — Contentful unavailable', () => {
  it('should stay in the loading state until the tool configuration has been loaded', () => {
    const result = calculate('burn-tokens')

    expect(result.isLoading).toBe(true)
    expect(result.totalFeeSOL).toBe(0)
  })

  it.each(Object.keys(TOOL_FEE_FALLBACKS) as CoreToolType[])(
    '%s: should show the fallback service fee instead of loading forever',
    (toolId) => {
      loadContentful([])

      const result = calculate(toolId)

      expect(result.isLoading).toBe(false)
      expect(result.baseFeeSOL).toBe(TOOL_FEE_FALLBACKS[toolId].baseFee)
      expect(result.networkFeeSOL).toBe(TOOL_FEE_FALLBACKS[toolId].networkFee)
      expect(result.breakdown[0]).toMatchObject({ name: 'Service Fee', amount: TOOL_FEE_FALLBACKS[toolId].baseFee })
    }
  )

  it('should show the token creator fallback fee plus the 0.05 SOL add-ons for both revocations', () => {
    loadContentful([])

    const result = calculate('token-creator', { revokeMintAuthority: true, revokeFreezeAuthority: true })

    expect(result.breakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Service Fee', amount: 0.19 }),
        expect.objectContaining({ name: 'Revoke Mint Authority', amount: TOKEN_CREATOR_OPTION_FEES.revokeMintAuthority }),
        expect.objectContaining({ name: 'Revoke Freeze Authority', amount: TOKEN_CREATOR_OPTION_FEES.revokeFreezeAuthority }),
      ])
    )
    // 0.19 service + 0.05 + 0.05 add-ons + 0.0005 network
    expect(result.totalFeeSOL).toBeCloseTo(0.2905, 12)
  })

  it('should only add the token creator add-ons that were selected', () => {
    loadContentful([])

    const result = calculate('token-creator', { revokeMintAuthority: true, revokeFreezeAuthority: false })

    expect(result.additionalFeesSOL).toBeCloseTo(0.05, 12)
    expect(result.totalFeeSOL).toBeCloseTo(0.2405, 12)
  })

  it.each([
    ['transaction-multisender', 25, 0.025],
    ['freeze-wallets', 4, 0.04],
    ['unfreeze-wallets', 3, 0.03],
  ] as const)('%s: should multiply the per-address fallback fee by the number of addresses', (toolId, addresses, serviceFee) => {
    loadContentful([])

    const result = calculate(toolId, {}, addresses)

    expect(result.baseFeeSOL).toBeCloseTo(serviceFee, 12)
    expect(result.breakdown[0].name).toBe(`Service Fee (×${addresses})`)
    expect(result.totalFeeSOL).toBeCloseTo(serviceFee + 0.0005, 12)
  })

  it('should apply a discount coupon to the fallback service fee', () => {
    loadContentful([])
    act(() => {
      useDiscountCouponStore.setState({ appliedCoupon: { code: 'SAVE50', discountPercentage: 50 } })
    })

    const result = calculate('liquidity-provider')

    expect(result.discountSOL).toBeCloseTo(0.25, 12)
    expect(result.totalFeeSOL).toBeCloseTo(0.25 + 0.0005, 12)
  })

  it('should prefer the Contentful fees over the fallback when they are available', () => {
    loadContentful([{ toolId: 'liquidity-provider', isEnabled: true, baseFee: 0.3, networkFee: 0.001 }])

    const result = calculate('liquidity-provider')

    expect(result.baseFeeSOL).toBe(0.3)
    expect(result.networkFeeSOL).toBe(0.001)
  })
})
