import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { AppError } from '@/lib/errors'
import { verifyAdminRequest } from '@/lib/security/adminAuth'

vi.mock('@/lib/security/adminAuth', () => ({
  verifyAdminRequest: vi.fn(),
}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: () => ({ rpcPrivateEndpoint: 'https://rpc.invalid' }),
}))

const mockGetSignaturesForAddress = vi.fn()
vi.mock('@solana/web3.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@solana/web3.js')>()
  return {
    ...actual,
    Connection: vi.fn(function MockConnection() {
      return { getSignaturesForAddress: mockGetSignaturesForAddress, getTransaction: vi.fn() }
    }),
  }
})

const FEE_WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const makeRequest = (query = ''): NextRequest => new NextRequest(`https://cloakforge.app/api/admin/transactions${query}`)

describe('GET /api/admin/transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('FEE_WALLET_ADDRESS', FEE_WALLET)
    mockGetSignaturesForAddress.mockResolvedValue([])
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('should return 401 and never touch the RPC when admin auth fails', async () => {
    vi.mocked(verifyAdminRequest).mockImplementation(() => {
      throw new AppError('UNAUTHORIZED', 'Admin session expired — please sign again', 401)
    })
    const { GET } = await import('../route')

    const response = await GET(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error_code).toBe('UNAUTHORIZED')
    expect(body.error_message).toBe('Admin session expired — please sign again')
    expect(mockGetSignaturesForAddress).not.toHaveBeenCalled()
  })

  it('should return 403 for a verified wallet that is not an admin', async () => {
    vi.mocked(verifyAdminRequest).mockImplementation(() => {
      throw new AppError('FORBIDDEN', 'Wallet is not authorized for admin access', 403)
    })
    const { GET } = await import('../route')

    const response = await GET(makeRequest())

    expect(response.status).toBe(403)
    expect(mockGetSignaturesForAddress).not.toHaveBeenCalled()
  })

  it.each([
    ['?limit=NaN', 50],
    ['?limit=-5', 1],
    ['?limit=5000', 100],
    ['?limit=20', 20],
  ])('should clamp the page limit (%s → %i)', async (query, expectedLimit) => {
    vi.mocked(verifyAdminRequest).mockReturnValue(FEE_WALLET)
    const { GET } = await import('../route')

    const response = await GET(makeRequest(query))

    expect(response.status).toBe(200)
    expect(mockGetSignaturesForAddress).toHaveBeenCalledWith(expect.anything(), { limit: expectedLimit, commitment: 'confirmed' })
  })

  it('should ignore a malformed "before" cursor', async () => {
    vi.mocked(verifyAdminRequest).mockReturnValue(FEE_WALLET)
    const { GET } = await import('../route')

    await GET(makeRequest('?before=not-a-signature'))

    expect(mockGetSignaturesForAddress).toHaveBeenCalledWith(expect.anything(), { limit: 50, commitment: 'confirmed' })
  })
})
