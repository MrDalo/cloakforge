import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/lib/security/walletMessageAuth', () => ({
  verifyWalletUploadAuth: vi.fn().mockReturnValue('MockWalletAddress11111111111111111111111111'),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({
    ipfsJWT: 'mock-jwt',
    ipfsGateway: 'mock-gateway.pinata.cloud',
    ipfsJsonMetadataGroupId: 'mock-json-group-id',
  })),
}))

// Use vi.hoisted so the variable is available when vi.mock factory runs
const mockPinataJsonUpload = vi.hoisted(() => vi.fn().mockResolvedValue({ cid: 'QmJsonMetadataCid987654' }))

vi.mock('pinata', () => ({
  PinataSDK: vi.fn().mockImplementation(function MockPinata() {
    return {
      upload: {
        public: {
          json: mockPinataJsonUpload,
        },
      },
    }
  }),
}))

const VALID_METADATA = {
  name: 'My Token',
  symbol: 'MTK',
  description: 'A test token with metadata',
  image: 'ipfs://QmLogoHash',
  external_url: 'https://example.com',
  attributes: [],
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/ipfs/upload-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/ipfs/upload-json', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    // Re-set the default mock return value after clearAllMocks
    mockPinataJsonUpload.mockResolvedValue({ cid: 'QmJsonMetadataCid987654' })

    vi.resetModules()
    const mod = await import('../route')
    POST = mod.POST
  })

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('should returns 200 with cid and uri for valid JSON metadata', async () => {
    const response = await POST(makeRequest(VALID_METADATA))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toHaveProperty('cid')
    expect(json.data).toHaveProperty('uri')
    expect(json.data.cid).toBe('QmJsonMetadataCid987654')
  })

  it('should constructs URI from gateway and CID', async () => {
    const response = await POST(makeRequest(VALID_METADATA))
    const json = await response.json()
    void json

    expect(json.data.uri).toBe('https://mock-gateway.pinata.cloud/ipfs/QmJsonMetadataCid987654')
  })

  it('should accepts minimal JSON object', async () => {
    const response = await POST(makeRequest({ name: 'Token' }))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
  })

  it('should accepts deeply nested JSON', async () => {
    const deepJson = {
      name: 'Token',
      metadata: {
        attributes: [{ trait_type: 'Color', value: 'Blue' }],
        extra: { level1: { level2: { level3: 'deep value' } } },
      },
    }
    const response = await POST(makeRequest(deepJson))
    expect(response.status).toBe(200)
  })

  it('should passes the JSON data to Pinata upload', async () => {
    await POST(makeRequest(VALID_METADATA))

    expect(mockPinataJsonUpload).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Token' }),
      expect.objectContaining({ groupId: 'mock-json-group-id' })
    )
  })

  // ---------------------------------------------------------------------------
  // Validation failures — schema requires Record<string, any>
  // ---------------------------------------------------------------------------

  it('should returns 400 for a non-object body (array)', async () => {
    const response = await POST(makeRequest([1, 2, 3]))
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
  })

  it('should returns 400 for a string body', async () => {
    const request = new NextRequest('http://localhost:3000/api/ipfs/upload-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify('just a string'),
    })
    const response = await POST(request)
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  it('should returns 400 for a numeric body', async () => {
    const request = new NextRequest('http://localhost:3000/api/ipfs/upload-json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(42),
    })
    const response = await POST(request)
    const json = await response.json()
    void json
    expect(response.status).toBe(400)
  })

  // ---------------------------------------------------------------------------
  // Size limit
  // ---------------------------------------------------------------------------

  it('should returns 400 when JSON data exceeds 1MB', async () => {
    // Create a JSON object that serializes to > 1MB
    const largeValue = 'x'.repeat(1024 * 1024 + 100)
    const response = await POST(makeRequest({ data: largeValue }))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_message).toContain('1MB')
  })

  // ---------------------------------------------------------------------------
  // Pinata errors
  // ---------------------------------------------------------------------------

  it('should returns 500 when Pinata JSON upload throws', async () => {
    mockPinataJsonUpload.mockRejectedValueOnce(new Error('Pinata service unavailable'))

    const response = await POST(makeRequest(VALID_METADATA))
    const json = await response.json()
    void json

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
  })

  // ---------------------------------------------------------------------------
  // Wallet authentication errors
  // ---------------------------------------------------------------------------

  it('should returns 401 when wallet upload auth fails', async () => {
    const { verifyWalletUploadAuth } = await import('@/lib/security/walletMessageAuth')
    const { AppError } = await import('@/lib/errors')
    vi.mocked(verifyWalletUploadAuth).mockImplementationOnce(() => {
      throw new AppError('UNAUTHORIZED', 'Invalid wallet signature', 401)
    })

    const response = await POST(makeRequest(VALID_METADATA))
    const json = await response.json()
    void json

    expect(response.status).toBe(401)
    expect(json.status).toBe('error')
  })
})
