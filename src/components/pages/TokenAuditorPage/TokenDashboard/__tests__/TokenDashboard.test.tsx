// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/dom'
import { renderWithProviders } from '@/__tests__/utils/componentTestHelpers'
import type { TokenAuditReport } from '@/types/tokenAudit'
import { TokenDashboard, formatAnalyzedAt } from '../index'
import { HolderDistribution } from '../HolderDistribution'
import { auditDisclaimer, auditShortDisclaimer } from '../../tokenAuditorData'

const MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const AUTHORITY = 'So11111111111111111111111111111111111111112'
const WALLET = '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'

const report: TokenAuditReport = {
  mint: MINT,
  tokenProgram: 'token-2022',
  decimals: 6,
  supplyRaw: '1000000000000',
  supplyDisplay: '1,000,000',
  mintAuthority: AUTHORITY,
  freezeAuthority: null,
  metadata: {
    source: 'token-2022',
    name: 'Example',
    symbol: 'EXM',
    uri: 'https://example.com/m.json',
    updateAuthority: null,
    isMutable: false,
  },
  externalMetadataAddress: null,
  extensions: {
    present: ['MetadataPointer', 'TokenMetadata'],
    transferFee: null,
    permanentDelegate: null,
    transferHook: null,
    defaultAccountStateFrozen: false,
    pausable: null,
    nonTransferable: false,
    mintCloseAuthority: null,
    confidentialTransfer: false,
    metadataPointer: { authority: null, metadataAddress: MINT },
  },
  holders: {
    topHolders: [{ tokenAccount: AUTHORITY, owner: WALLET, kind: 'wallet', amountRaw: '120000000000', sharePercent: 12 }],
    top10SharePercent: 12,
    walletSharePercent: 12,
    largestWalletSharePercent: 12,
    unclassifiedSharePercent: 0,
  },
  checks: [
    { id: 'mint-authority', title: 'Mint authority', status: 'fail', explanation: 'Active: new tokens can be minted.', address: AUTHORITY },
    { id: 'freeze-authority', title: 'Freeze authority', status: 'pass', explanation: 'Revoked.' },
    { id: 'holder-concentration', title: 'Holder concentration (top 10 accounts)', status: 'warn', explanation: 'Moderate.' },
  ],
  summary: { pass: 1, warn: 1, fail: 1, unknown: 0, riskLevel: 'high' },
  analyzedAt: '2026-10-17T08:05:09.123Z',
}

describe('TokenDashboard', () => {
  it('should show the on-chain facts, the derived risk level and the read time', () => {
    renderWithProviders(<TokenDashboard report={report} />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Example')
    expect(screen.getAllByText('EXM').length).toBeGreaterThan(0)
    expect(screen.getByText('High-risk signals found')).toBeInTheDocument()
    expect(screen.getByText(MINT)).toBeInTheDocument()
    expect(screen.getByText('1,000,000')).toBeInTheDocument()
    expect(screen.getByText('Token-2022')).toBeInTheDocument()
    expect(screen.getByText('1 high risk · 1 warning')).toBeInTheDocument()
    expect(screen.getByText(/2026-10-17 08:05 UTC/)).toBeInTheDocument()
  })

  it('should list every check with its outcome and explanation', () => {
    renderWithProviders(<TokenDashboard report={report} />)

    const item = screen.getByText('Active: new tokens can be minted.').closest('li') as HTMLElement
    expect(within(item).getByText('Mint authority')).toBeInTheDocument()
    expect(within(item).getByText('High risk')).toBeInTheDocument()
    expect(screen.getByText('Moderate.')).toBeInTheDocument()
  })

  it('should show the not-financial-advice disclaimer and mark liquidity as not analyzed', () => {
    renderWithProviders(<TokenDashboard report={report} />)

    expect(screen.getByText(auditDisclaimer.title)).toBeInTheDocument()
    expect(screen.getByText(/can miss risks/)).toBeInTheDocument()
    expect(screen.getByText(auditShortDisclaimer)).toBeInTheDocument()
    expect(screen.getByText('Liquidity & Trading')).toBeInTheDocument()
    expect(screen.getAllByText('Not analyzed').length).toBeGreaterThan(0)
  })

  it('should never show a numeric score or price, pool or market figures that were not computed', () => {
    const { container } = renderWithProviders(<TokenDashboard report={report} />)

    expect(container.textContent).not.toMatch(/\/100|score:/i)
    expect(container.textContent).not.toMatch(/\$\s?\d|\d+ pools|24h/i)
  })

  it('should fall back to a neutral name when no metadata was found', () => {
    renderWithProviders(<TokenDashboard report={{ ...report, metadata: null }} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Unnamed token')
  })
})

describe('HolderDistribution', () => {
  it('should list the largest holders with their kind and share', () => {
    renderWithProviders(<HolderDistribution holders={report.holders} />)

    const row = screen.getByText('Wallet').closest('tr') as HTMLElement
    expect(within(row).getByText('12%')).toBeInTheDocument()
    expect(within(row).getByRole('link')).toHaveAttribute('href', `https://solscan.io/account/${WALLET}`)
  })

  it('should say holders were not analyzed instead of showing numbers', () => {
    renderWithProviders(<HolderDistribution holders={null} />)

    expect(screen.getByText('Not analyzed')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('formatAnalyzedAt', () => {
  it('should format an ISO timestamp the same way everywhere (UTC, minutes)', () => {
    expect(formatAnalyzedAt('2026-01-02T03:04:05.678Z')).toBe('2026-01-02 03:04 UTC')
  })
})
