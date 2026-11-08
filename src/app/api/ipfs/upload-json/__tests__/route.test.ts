import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

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
  image: 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
  external_url: 'https://example.com',
  attributes: [{ trait_type: 'Telegram', value: '@mytoken' }],
  created_with: 'CloakForge',
  properties: {
    files: [{ uri: 'ipfs://QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', type: 'image' }],
    category: 'token',
    creators: [{ address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', share: 100, verified: false }],
  },
}

function makeRawRequest(body: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/ipfs/upload-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body,
  })
}

const makeRequest = (body: unknown): NextRequest => makeRawRequest(JSON.stringify(body))

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

  it('should return 200 with cid and gateway uri for valid token metadata', async () => {
    const response = await POST(makeRequest(VALID_METADATA))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toEqual({
      cid: 'QmJsonMetadataCid987654',
      uri: 'https://mock-gateway.pinata.cloud/ipfs/QmJsonMetadataCid987654',
    })
  })

  it('should upload the validated metadata to the JSON group', async () => {
    await POST(makeRequest({ ...VALID_METADATA, name: '  My Token  ' }))

    expect(mockPinataJsonUpload).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'My Token', symbol: 'MTK' }),
      expect.objectContaining({ groupId: 'mock-json-group-id' })
    )
  })

  it('should accept minimal metadata (name and symbol)', async () => {
    const response = await POST(makeRequest({ name: 'Token', symbol: 'TKN' }))
    expect(response.status).toBe(200)
  })

  it('should verify the wallet signature for the json action', async () => {
    const { verifyWalletUploadAuth } = await import('@/lib/security/walletMessageAuth')
    await POST(makeRequest(VALID_METADATA))

    expect(verifyWalletUploadAuth).toHaveBeenCalledWith(expect.any(NextRequest), 'json')
  })

  // ---------------------------------------------------------------------------
  // Schema validation
  // ---------------------------------------------------------------------------

  it('should reject arbitrary extra keys and nested junk', async () => {
    const extraTop = await POST(makeRequest({ ...VALID_METADATA, payload: 'anything' }))
    const deep = await POST(makeRequest({ name: 'Token', symbol: 'T', metadata: { extra: { level1: 'deep' } } }))

    expect(extraTop.status).toBe(400)
    expect(deep.status).toBe(400)
    expect((await extraTop.json()).error_code).toBe('INVALID_METADATA_FORMAT')
    expect(mockPinataJsonUpload).not.toHaveBeenCalled()
  })

  it('should reject javascript: and http: URLs', async () => {
    for (const body of [
      { ...VALID_METADATA, image: 'javascript:alert(1)' },
      { ...VALID_METADATA, image: 'http://10.0.0.1/logo.png' },
      { ...VALID_METADATA, external_url: 'javascript:alert(1)' },
      { ...VALID_METADATA, attributes: [{ trait_type: 'Twitter', value: 'javascript:alert(1)' }] },
    ]) {
      const response = await POST(makeRequest(body))
      expect(response.status).toBe(400)
    }
    expect(mockPinataJsonUpload).not.toHaveBeenCalled()
  })

  it('should return 400 for non-object bodies (array, string, number)', async () => {
    for (const body of [[1, 2, 3], 'just a string', 42]) {
      const response = await POST(makeRequest(body))
      const json = await response.json()
      expect(response.status).toBe(400)
      expect(json.status).toBe('error')
    }
  })

  it('should return 400 without echoing the parser error for malformed JSON', async () => {
    for (const body of ['{"name": "Token"', '']) {
      const response = await POST(makeRawRequest(body))
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error_message).toBe('Request body must be valid JSON.')
      expect(json.error_message).not.toContain('Unexpected')
    }
  })

  // ---------------------------------------------------------------------------
  // Size limit
  // ---------------------------------------------------------------------------

  it('should return 413 when the body exceeds 16KB', async () => {
    const response = await POST(makeRequest({ ...VALID_METADATA, description: 'x'.repeat(17 * 1024) }))
    const json = await response.json()

    expect(response.status).toBe(413)
    expect(json.error_message).toContain('16KB')
    expect(mockPinataJsonUpload).not.toHaveBeenCalled()
  })

  it('should reject early from an oversized Content-Length header', async () => {
    const response = await POST(makeRawRequest(JSON.stringify(VALID_METADATA), { 'content-length': String(1024 * 1024) }))

    expect(response.status).toBe(413)
  })

  // ---------------------------------------------------------------------------
  // Pinata errors
  // ---------------------------------------------------------------------------

  it('should return a generic 500 without echoing the Pinata error', async () => {
    mockPinataJsonUpload.mockRejectedValueOnce(new Error('Pinata service unavailable: upstream 10.1.2.3 timed out'))

    const response = await POST(makeRequest(VALID_METADATA))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error_code).toBe('METADATA_UPLOAD_FAILED')
    expect(json.error_message).toBe('Failed to upload metadata to IPFS. Please try again.')
    expect(JSON.stringify(json)).not.toContain('10.1.2.3')
  })

  // ---------------------------------------------------------------------------
  // Wallet authentication errors
  // ---------------------------------------------------------------------------

  it('should return 401 when wallet upload auth fails', async () => {
    const { verifyWalletUploadAuth } = await import('@/lib/security/walletMessageAuth')
    const { AppError } = await import('@/lib/errors')
    vi.mocked(verifyWalletUploadAuth).mockImplementationOnce(() => {
      throw new AppError('UNAUTHORIZED', 'Invalid wallet signature', 401)
    })

    const response = await POST(makeRequest(VALID_METADATA))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.status).toBe('error')
    expect(mockPinataJsonUpload).not.toHaveBeenCalled()
  })
})
