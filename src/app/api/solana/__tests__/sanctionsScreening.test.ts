import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { AppError } from '@/lib/errors'

vi.mock('server-only', () => ({}))

vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: vi.fn().mockResolvedValue(null),
}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

// Every builder rejects with a marker error: reaching it proves screening passed; never reaching it proves the refusal.
const REACHED = 'builder reached'
const builders = vi.hoisted(() => ({
  burn: vi.fn(),
  multisender: vi.fn(),
  freeze: vi.fn(),
  unfreeze: vi.fn(),
  tokenCreation: vi.fn(),
  raydiumPool: vi.fn(),
}))
vi.mock('@/lib/solana/server-side/createBurnTokenTransaction', () => ({ createBurnTokenTransaction: builders.burn }))
vi.mock('@/lib/solana/server-side/createMultisenderTransaction', () => ({ createMultisenderTransaction: builders.multisender }))
vi.mock('@/lib/solana/server-side/createFreezeWalletTransaction', () => ({ createBatchFreezeTransaction: builders.freeze }))
vi.mock('@/lib/solana/server-side/createUnfreezeWalletTransaction', () => ({ createBatchUnfreezeTransaction: builders.unfreeze }))
vi.mock('@/lib/solana/server-side/createTokenCreationTransaction', () => ({ createTokenCreationTransaction: builders.tokenCreation }))
vi.mock('@/lib/solana/server-side/createRaydiumPool', () => ({ createRaydiumPoolTransaction: builders.raydiumPool }))

const SANCTIONED = '42RLPACwZPx3vYYmxSueqsogfynBDqXK298EDsNoyoHi'
const CLEAN_WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const CLEAN_OTHER = 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
const MINT = 'So11111111111111111111111111111111111111112'

interface RouteCase {
  name: string
  load: () => Promise<{ POST: (req: NextRequest) => Promise<Response> }>
  builder: keyof typeof builders
  /** Valid request body; `address` is substituted into the field under test. */
  body: (address: string, field: 'wallet' | 'counterparty') => Record<string, unknown>
  counterpartyLabel: string
}

const freezeBody = (address: string, field: 'wallet' | 'counterparty'): Record<string, unknown> => ({
  walletAddress: field === 'wallet' ? address : CLEAN_WALLET,
  targetWallets: [CLEAN_OTHER, field === 'counterparty' ? address : MINT],
  mintAddress: MINT,
})

const cases: RouteCase[] = [
  {
    name: 'burn-tokens',
    load: () => import('../burn-tokens/route'),
    builder: 'burn',
    body: (address, field) => ({
      walletAddress: field === 'wallet' ? address : CLEAN_WALLET,
      tokenAccountAddress: field === 'counterparty' ? address : CLEAN_OTHER,
      mintAddress: MINT,
      amount: 1,
    }),
    counterpartyLabel: 'token account',
  },
  {
    name: 'transaction-multisender',
    load: () => import('../transaction-multisender/route'),
    builder: 'multisender',
    body: (address, field) => ({
      walletAddress: field === 'wallet' ? address : CLEAN_WALLET,
      recipients: [
        { address: CLEAN_OTHER, amount: 1 },
        { address: field === 'counterparty' ? address : MINT, amount: 1 },
      ],
    }),
    counterpartyLabel: 'recipient',
  },
  {
    name: 'freeze-wallets',
    load: () => import('../freeze-wallets/route'),
    builder: 'freeze',
    body: freezeBody,
    counterpartyLabel: 'freeze target',
  },
  {
    name: 'unfreeze-wallets',
    load: () => import('../unfreeze-wallets/route'),
    builder: 'unfreeze',
    body: freezeBody,
    counterpartyLabel: 'unfreeze target',
  },
  {
    name: 'token-creator',
    load: () => import('../token-creator/route'),
    builder: 'tokenCreation',
    body: (address, field) => ({
      walletAddress: field === 'wallet' ? address : CLEAN_WALLET,
      mintPublicKey: field === 'counterparty' ? address : MINT,
      tokenData: { name: 'Token', symbol: 'TKN', decimals: 9, totalSupply: 1000 },
    }),
    counterpartyLabel: 'mint',
  },
  {
    name: 'liquidity-provider',
    load: () => import('../liquidity-provider/route'),
    builder: 'raydiumPool',
    body: (address, field) => ({
      walletAddress: field === 'wallet' ? address : CLEAN_WALLET,
      poolConfig: {
        poolType: 'CPMM',
        tokenA: field === 'counterparty' ? address : MINT,
        tokenB: CLEAN_WALLET,
        feeTier: '0.25',
        initialLiquidity: { amountA: '1', amountB: '1' },
      },
    }),
    counterpartyLabel: 'token pair',
  },
]

const makeRequest = (name: string, body: unknown): NextRequest =>
  new NextRequest(`http://localhost:3000/api/solana/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('sanctions screening on paid Solana routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const builder of Object.values(builders)) {
      builder.mockRejectedValue(new AppError('INVALID_INPUT', REACHED, 400))
    }
  })

  describe.each(cases)('POST /api/solana/$name', ({ name, load, builder, body, counterpartyLabel }) => {
    it('should reject a sanctioned connected wallet with a generic 403', async () => {
      const { POST } = await load()
      const response = await POST(makeRequest(name, body(SANCTIONED, 'wallet')))
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error_message).toBe('This address cannot be served.')
      expect(JSON.stringify(json)).not.toContain(SANCTIONED)
      expect(builders[builder]).not.toHaveBeenCalled()
    })

    it(`should reject a sanctioned ${counterpartyLabel}`, async () => {
      const { POST } = await load()
      const response = await POST(makeRequest(name, body(SANCTIONED, 'counterparty')))

      expect(response.status).toBe(403)
      expect(builders[builder]).not.toHaveBeenCalled()
    })

    it('should let clean addresses through to the transaction builder', async () => {
      const { POST } = await load()
      const response = await POST(makeRequest(name, body(CLEAN_OTHER, 'counterparty')))
      const json = await response.json()

      expect(json.error_message).toBe(REACHED)
      expect(builders[builder]).toHaveBeenCalledTimes(1)
    })
  })
})
