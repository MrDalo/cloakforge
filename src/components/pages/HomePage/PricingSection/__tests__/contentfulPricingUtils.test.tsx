// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { type ReactNode } from 'react'
import { renderHook } from '@testing-library/react'
import type { ToolConfiguration } from '@/lib/contentful/client'
import { ToolConfigProvider } from '@/providers/ToolConfigProvider'
import { TOOL_FEE_FALLBACKS, getFallbackToolConfigurations } from '@/lib/config/toolFeeFallbacks'
import { fallbackServiceFees, mapToolConfigurationsToServiceFees } from '../contentfulPricingUtils'
import { useServiceFees } from '../useServiceFees'

const rowOf = (service: string, fees = fallbackServiceFees) => fees.find((fee) => fee.service === service)
const feeOf = (service: string, fees = fallbackServiceFees) => rowOf(service, fees)?.fee

const withServerConfigs = (initialConfigs: ToolConfiguration[]) => {
  const ServerConfigsWrapper = ({ children }: { children: ReactNode }): ReactNode => (
    <ToolConfigProvider initialConfigs={initialConfigs}>{children}</ToolConfigProvider>
  )
  return ServerConfigsWrapper
}

const ALL_SERVICES = [
  'Token Creator',
  'Liquidity Provider',
  'Burn Tokens',
  'Revoke Mint Authority',
  'Revoke Freeze Authority',
  'Revoke Metadata Authority',
  'Update Metadata',
  'Freeze Wallets',
  'Unfreeze Wallets',
  'Transaction Multisender',
  'Token Auditor',
]

describe('fallbackServiceFees', () => {
  it.each([
    ['Liquidity Provider', '0.5 SOL'],
    ['Revoke Mint Authority', '0.1 SOL'],
    ['Token Auditor', '0.01 SOL'],
    ['Token Creator', '0.19 SOL'],
    ['Transaction Multisender', '0.001 SOL per 1 address'],
    ['Burn Tokens', '0.001 SOL'],
    ['Freeze Wallets', '0.01 SOL per 1 address'],
    ['Revoke Freeze Authority', '0.1 SOL'],
    ['Unfreeze Wallets', '0.01 SOL per 1 address'],
    ['Update Metadata', '0.19 SOL'],
    ['Revoke Metadata Authority', '0.1 SOL'],
  ])('should display %s at %s when Contentful is unavailable', (service, fee) => {
    expect(feeOf(service)).toBe(fee)
  })

  it('should list every tool exactly once', () => {
    expect(fallbackServiceFees.map((fee) => fee.service).sort()).toEqual([...ALL_SERVICES].sort())
    expect(fallbackServiceFees).toHaveLength(Object.keys(TOOL_FEE_FALLBACKS).length)
  })

  it('should be derived from the global fallback fees', () => {
    expect(fallbackServiceFees).toEqual(mapToolConfigurationsToServiceFees(getFallbackToolConfigurations()))
  })

  it('should show every fallback service as enabled with the estimated network fee', () => {
    fallbackServiceFees.forEach((fee) => {
      expect(fee.isEnabled).toBe(true)
      expect(fee.estimatedNetwork).toBe('~0.0005 SOL')
    })
  })

  it('should show the token creator add-on prices under its fee', () => {
    expect(rowOf('Token Creator')?.feeNote).toBe('+0.05 SOL to revoke mint authority, +0.05 SOL to revoke freeze authority')
  })

  it('should not add a fee note to other tools', () => {
    fallbackServiceFees.filter((fee) => fee.service !== 'Token Creator').forEach((fee) => expect(fee.feeNote).toBeUndefined())
  })

  it('should list the popular tools first', () => {
    const firstNonPopular = fallbackServiceFees.findIndex((fee) => !fee.popular)
    expect(fallbackServiceFees.slice(firstNonPopular).every((fee) => !fee.popular)).toBe(true)
  })
})

describe('mapToolConfigurationsToServiceFees', () => {
  it('should format fees without floating point artefacts', () => {
    const [row] = mapToolConfigurationsToServiceFees([{ toolId: 'burn-tokens', isEnabled: true, baseFee: 0.1 + 0.2, networkFee: 0.0001 }])
    expect(row.fee).toBe('0.3 SOL')
    expect(row.estimatedNetwork).toBe('~0.0001 SOL')
  })

  it('should ignore tools the pricing table does not know', () => {
    expect(mapToolConfigurationsToServiceFees([{ toolId: 'some-future-tool', isEnabled: true, baseFee: 1, networkFee: 0 }])).toEqual([])
  })

  it('should mark tools disabled in Contentful as disabled', () => {
    const [row] = mapToolConfigurationsToServiceFees([{ toolId: 'update-metadata', isEnabled: false, baseFee: 0.2, networkFee: 0.0005 }])
    expect(row).toMatchObject({ service: 'Update Metadata', isEnabled: false })
  })
})

describe('useServiceFees', () => {
  it('should show the live Contentful prices resolved on the server', () => {
    const { result } = renderHook(() => useServiceFees(), {
      wrapper: withServerConfigs([{ toolId: 'burn-tokens', isEnabled: true, baseFee: 0.02, networkFee: 0.001 }]),
    })

    expect(feeOf('Burn Tokens', result.current)).toBe('0.02 SOL')
    expect(rowOf('Burn Tokens', result.current)?.estimatedNetwork).toBe('~0.001 SOL')
  })

  it('should complete the live prices with fallback prices for tools missing from Contentful', () => {
    const { result } = renderHook(() => useServiceFees(), {
      wrapper: withServerConfigs([{ toolId: 'burn-tokens', isEnabled: true, baseFee: 0.02, networkFee: 0.001 }]),
    })

    expect(result.current).toHaveLength(ALL_SERVICES.length)
    expect(feeOf('Liquidity Provider', result.current)).toBe('0.5 SOL')
    expect(feeOf('Update Metadata', result.current)).toBe('0.19 SOL')
  })

  it('should show the fallback prices when Contentful is down (no server prices)', () => {
    const { result } = renderHook(() => useServiceFees(), { wrapper: withServerConfigs([]) })
    expect(result.current).toEqual(fallbackServiceFees)
  })

  it('should show the fallback prices outside the provider', () => {
    const { result } = renderHook(() => useServiceFees())
    expect(result.current).toEqual(fallbackServiceFees)
  })

  it('should have the prices on the very first render (no flash of fallback prices)', () => {
    const renders: (string | undefined)[] = []
    renderHook(
      () => {
        const fees = useServiceFees()
        renders.push(feeOf('Token Creator', fees))
        return fees
      },
      { wrapper: withServerConfigs([{ toolId: 'token-creator', isEnabled: true, baseFee: 0.25, networkFee: 0.0005 }]) }
    )

    expect(renders[0]).toBe('0.25 SOL')
    expect(new Set(renders)).toEqual(new Set(['0.25 SOL']))
  })

  it('should show tools disabled in Contentful as disabled', () => {
    const { result } = renderHook(() => useServiceFees(), {
      wrapper: withServerConfigs([{ toolId: 'freeze-wallets', isEnabled: false, baseFee: 0.01, networkFee: 0.0005 }]),
    })

    expect(rowOf('Freeze Wallets', result.current)?.isEnabled).toBe(false)
  })
})
