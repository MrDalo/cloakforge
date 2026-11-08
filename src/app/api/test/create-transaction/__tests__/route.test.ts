import { describe, it, expect, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@solana/web3.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/web3.js')>()
  return {
    ...actual,
    // Must never be reached by these tests (no RPC calls)
    Connection: vi.fn(() => {
      throw new Error('RPC must not be used')
    }),
  }
})

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3001/api/test/create-transaction', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/test/create-transaction', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each(['production', 'test'])('should return 404 when NODE_ENV is %s', async (nodeEnv) => {
    vi.stubEnv('NODE_ENV', nodeEnv)
    const { POST } = await import('../route')

    const response = await POST(makeRequest({ walletAddress: 'x', recipientAddress: 'y', amount: 1 }))

    expect(response.status).toBe(404)
  })

  it('should stay available in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { POST } = await import('../route')

    // Invalid body → handled by the route's own validation, proving the gate let it through
    const response = await POST(makeRequest({ amount: 'not-a-number' }))

    expect(response.status).toBe(400)
  })
})
