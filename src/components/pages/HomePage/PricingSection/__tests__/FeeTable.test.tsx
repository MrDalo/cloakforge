// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import type { ToolConfiguration } from '@/lib/contentful/client'
import { ToolConfigProvider } from '@/providers/ToolConfigProvider'
import { FeeTable } from '../FeeTable'

beforeAll(() => {
  // framer-motion whileInView
  if (!globalThis.IntersectionObserver) {
    globalThis.IntersectionObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
      takeRecords(): [] {
        return []
      }
    } as unknown as typeof IntersectionObserver
  }
})

const renderTable = (initialConfigs: ToolConfiguration[]) =>
  render(
    <ToolConfigProvider initialConfigs={initialConfigs}>
      <FeeTable />
    </ToolConfigProvider>
  )

const row = (service: string) => screen.getByText(service).closest('tr') as HTMLElement

describe('FeeTable (home page pricing)', () => {
  it('should list every tool, including Update Metadata and Revoke Metadata Authority', () => {
    renderTable([])

    // header row + one row per tool
    expect(screen.getAllByRole('row')).toHaveLength(1 + 11)
    expect(row('Update Metadata')).toBeInTheDocument()
    expect(row('Revoke Metadata Authority')).toBeInTheDocument()
  })

  it('should show the fallback prices when Contentful is down', () => {
    renderTable([])

    expect(within(row('Liquidity Provider')).getByText('0.5 SOL')).toBeInTheDocument()
    expect(within(row('Update Metadata')).getByText('0.19 SOL')).toBeInTheDocument()
    expect(within(row('Revoke Metadata Authority')).getByText('0.1 SOL')).toBeInTheDocument()
    expect(within(row('Transaction Multisender')).getByText('0.001 SOL per 1 address')).toBeInTheDocument()
  })

  it('should show the live Contentful prices and status', () => {
    renderTable([
      { toolId: 'liquidity-provider', isEnabled: true, baseFee: 0.3, networkFee: 0.001 },
      { toolId: 'burn-tokens', isEnabled: false, baseFee: 0.002, networkFee: 0.0005 },
    ])

    expect(within(row('Liquidity Provider')).getByText('0.3 SOL')).toBeInTheDocument()
    expect(within(row('Liquidity Provider')).getByText('~0.001 SOL')).toBeInTheDocument()
    expect(within(row('Burn Tokens')).getByText('Disabled')).toBeInTheDocument()
  })

  it('should show the token creator add-on prices', () => {
    renderTable([])

    expect(
      within(row('Token Creator')).getByText('+0.05 SOL to revoke mint authority, +0.05 SOL to revoke freeze authority')
    ).toBeInTheDocument()
  })
})
