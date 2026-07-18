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
    ipfsTokenImagesGroupId: 'mock-group-id',
  })),
}))

// Use vi.hoisted so the variable is available when vi.mock factory runs
const mockPinataUpload = vi.hoisted(() => vi.fn().mockResolvedValue({ cid: 'QmMockCidHash123456789' }))

vi.mock('pinata', () => ({
  PinataSDK: vi.fn().mockImplementation(function MockPinata() {
    return {
      upload: {
        public: {
          file: mockPinataUpload,
        },
      },
    }
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockFile(name: string, type: string, sizeBytes: number = 1024): File {
  const content = new Uint8Array(sizeBytes).fill(0)
  return new File([content], name, { type })
}

function makeFormDataRequest(file: File | null, url = 'http://localhost:3000/api/ipfs/upload-file'): NextRequest {
  const formData = new FormData()
  if (file) {
    formData.append('file', file)
  }
  return new NextRequest(url, {
    method: 'POST',
    body: formData,
  })
}

describe('POST /api/ipfs/upload-file', () => {
  let POST: (req: NextRequest) => Promise<Response>

  beforeEach(async () => {
    vi.clearAllMocks()
    // Re-set the default mock return value after clearAllMocks
    mockPinataUpload.mockResolvedValue({ cid: 'QmMockCidHash123456789' })

    vi.resetModules()
    const mod = await import('../route')
    POST = mod.POST
  })

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  it('should returns 200 with cid and uri for a valid PNG upload', async () => {
    const file = createMockFile('token-logo.png', 'image/png', 1024)
    const response = await POST(makeFormDataRequest(file))
    const json = await response.json()
    void json

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toHaveProperty('cid')
    expect(json.data).toHaveProperty('uri')
    expect(json.data.cid).toBe('QmMockCidHash123456789')
    expect(json.data.uri).toContain('QmMockCidHash123456789')
  })

  it('should constructs uri from gateway and cid', async () => {
    const file = createMockFile('image.jpg', 'image/jpeg', 512)
    const response = await POST(makeFormDataRequest(file))
    const json = await response.json()
    void json

    expect(json.data.uri).toBe('https://mock-gateway.pinata.cloud/ipfs/QmMockCidHash123456789')
  })

  it('should accepts JPEG files', async () => {
    const file = createMockFile('image.jpeg', 'image/jpeg', 512)
    const response = await POST(makeFormDataRequest(file))
    expect(response.status).toBe(200)
  })

  it('should accepts WebP files', async () => {
    const file = createMockFile('image.webp', 'image/webp', 512)
    const response = await POST(makeFormDataRequest(file))
    expect(response.status).toBe(200)
  })

  it('should accepts SVG files', async () => {
    const file = createMockFile('image.svg', 'image/svg+xml', 512)
    const response = await POST(makeFormDataRequest(file))
    expect(response.status).toBe(200)
  })

  // ---------------------------------------------------------------------------
  // Validation — missing file
  // ---------------------------------------------------------------------------

  it('should returns 400 when no file is provided', async () => {
    const response = await POST(makeFormDataRequest(null))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_code).toBe('MISSING_REQUIRED_FIELD')
  })

  // ---------------------------------------------------------------------------
  // Validation — file size
  // ---------------------------------------------------------------------------

  it('should returns 400 when file exceeds 3MB', async () => {
    const oversizedFile = createMockFile('big-image.png', 'image/png', 3 * 1024 * 1024 + 1)
    const response = await POST(makeFormDataRequest(oversizedFile))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_code).toBe('FILE_TOO_LARGE')
    expect(json.error_message).toContain('3MB')
  })

  it('should accepts files exactly at 3MB boundary', async () => {
    const maxFile = createMockFile('exact.png', 'image/png', 3 * 1024 * 1024)
    const response = await POST(makeFormDataRequest(maxFile))
    expect(response.status).toBe(200)
  })

  // ---------------------------------------------------------------------------
  // Validation — file type
  // ---------------------------------------------------------------------------

  it('should returns 400 for unsupported file type (GIF)', async () => {
    const gifFile = createMockFile('image.gif', 'image/gif', 512)
    const response = await POST(makeFormDataRequest(gifFile))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_code).toBe('FILE_TYPE_NOT_SUPPORTED')
  })

  it('should returns 400 for PDF file type', async () => {
    const pdfFile = createMockFile('document.pdf', 'application/pdf', 512)
    const response = await POST(makeFormDataRequest(pdfFile))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.error_code).toBe('FILE_TYPE_NOT_SUPPORTED')
  })

  it('should returns 400 for text/plain file type', async () => {
    const textFile = createMockFile('file.txt', 'text/plain', 100)
    const response = await POST(makeFormDataRequest(textFile))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.error_code).toBe('FILE_TYPE_NOT_SUPPORTED')
  })

  // ---------------------------------------------------------------------------
  // Validation — suspicious filenames
  // ---------------------------------------------------------------------------

  it('should returns 400 for a filename with path traversal (../)', async () => {
    const suspiciousFile = new File([new Uint8Array(100)], '../etc/passwd', { type: 'image/png' })
    const response = await POST(makeFormDataRequest(suspiciousFile))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_code).toBe('INVALID_INPUT')
  })

  it('should returns 400 for a filename with Windows path traversal (..\\)', async () => {
    const suspiciousFile = new File([new Uint8Array(100)], '..\\windows\\system', { type: 'image/png' })
    const response = await POST(makeFormDataRequest(suspiciousFile))
    const json = await response.json()
    void json

    expect(response.status).toBe(400)
    expect(json.error_code).toBe('INVALID_INPUT')
  })

  // ---------------------------------------------------------------------------
  // Pinata / IPFS errors
  // ---------------------------------------------------------------------------

  it('should returns 500 when Pinata upload throws', async () => {
    mockPinataUpload.mockRejectedValueOnce(new Error('Pinata connection refused'))

    const file = createMockFile('valid.png', 'image/png', 512)
    const response = await POST(makeFormDataRequest(file))
    const json = await response.json()
    void json

    expect(response.status).toBe(500)
    expect(json.status).toBe('error')
    expect(json.error_code).toBe('SERVICE_UNAVAILABLE')
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

    const file = createMockFile('valid.png', 'image/png', 512)
    const response = await POST(makeFormDataRequest(file))
    const json = await response.json()
    void json

    expect(response.status).toBe(401)
    expect(json.status).toBe('error')
  })
})
