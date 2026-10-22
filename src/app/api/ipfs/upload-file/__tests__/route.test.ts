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

const MAX_BYTES = 4 * 1024 * 1024

const SIGNATURES: Record<string, number[]> = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpeg: [0xff, 0xd8, 0xff, 0xe0],
  gif: [...new TextEncoder().encode('GIF89a')],
  webp: [...new TextEncoder().encode('RIFF'), 0x24, 0, 0, 0, ...new TextEncoder().encode('WEBPVP8 ')],
}

function imageBytes(kind: keyof typeof SIGNATURES, sizeBytes = 1024): Uint8Array<ArrayBuffer> {
  const content = new Uint8Array(sizeBytes)
  content.set(SIGNATURES[kind])
  return content
}

function createFile(content: Uint8Array<ArrayBuffer> | string, name: string, type: string): File {
  return new File([content], name, { type })
}

function makeFormDataRequest(file: File | null, extraHeaders: Record<string, string> = {}): NextRequest {
  const formData = new FormData()
  if (file) {
    formData.append('file', file)
  }
  return new NextRequest('http://localhost:3000/api/ipfs/upload-file', {
    method: 'POST',
    body: formData,
    headers: extraHeaders,
  })
}

const SVG_WITH_SCRIPT = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.domain)</script></svg>'

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

  it('should return 200 with cid and gateway uri for a valid PNG upload', async () => {
    const response = await POST(makeFormDataRequest(createFile(imageBytes('png'), 'token-logo.png', 'image/png')))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.status).toBe('success')
    expect(json.data).toEqual({
      cid: 'QmMockCidHash123456789',
      uri: 'https://mock-gateway.pinata.cloud/ipfs/QmMockCidHash123456789',
    })
    expect(mockPinataUpload).toHaveBeenCalledWith(expect.any(File), { groupId: 'mock-group-id' })
  })

  it.each([
    ['png', 'image/png', 'png'],
    ['jpeg', 'image/jpeg', 'jpg'],
    ['gif', 'image/gif', 'gif'],
    ['webp', 'image/webp', 'webp'],
  ] as const)('should accept %s detected from magic bytes and upload it as %s', async (kind, mimeType, extension) => {
    const response = await POST(makeFormDataRequest(createFile(imageBytes(kind), `logo.${kind}`, 'application/octet-stream')))

    expect(response.status).toBe(200)
    const uploaded = mockPinataUpload.mock.calls[0][0] as File
    expect(uploaded.type).toBe(mimeType)
    expect(uploaded.name).toBe(`logo.${extension}`)
  })

  it('should set the Pinata content type from the sniffed bytes, not the client MIME type or extension', async () => {
    const response = await POST(makeFormDataRequest(createFile(imageBytes('jpeg'), 'logo.svg', 'image/svg+xml')))

    expect(response.status).toBe(200)
    const uploaded = mockPinataUpload.mock.calls[0][0] as File
    expect(uploaded.type).toBe('image/jpeg')
    expect(uploaded.name).toBe('logo.jpg')
  })

  it('should verify the wallet signature for the file action', async () => {
    const { verifyWalletUploadAuth } = await import('@/lib/security/walletMessageAuth')
    await POST(makeFormDataRequest(createFile(imageBytes('png'), 'logo.png', 'image/png')))

    expect(verifyWalletUploadAuth).toHaveBeenCalledWith(expect.any(NextRequest), 'file')
  })

  // ---------------------------------------------------------------------------
  // Validation — file type (magic bytes)
  // ---------------------------------------------------------------------------

  it('should reject SVG (with script) with 415 and never call Pinata', async () => {
    const response = await POST(makeFormDataRequest(createFile(SVG_WITH_SCRIPT, 'logo.svg', 'image/svg+xml')))
    const json = await response.json()

    expect(response.status).toBe(415)
    expect(json.error_code).toBe('UNSUPPORTED_IMAGE_FORMAT')
    expect(mockPinataUpload).not.toHaveBeenCalled()
  })

  it('should reject an SVG disguised as image/png with a .png name', async () => {
    const response = await POST(makeFormDataRequest(createFile(SVG_WITH_SCRIPT, 'logo.png', 'image/png')))

    expect(response.status).toBe(415)
    expect(mockPinataUpload).not.toHaveBeenCalled()
  })

  it('should reject HTML disguised as image/jpeg', async () => {
    const response = await POST(makeFormDataRequest(createFile('<!DOCTYPE html><script>alert(1)</script>', 'logo.jpg', 'image/jpeg')))

    expect(response.status).toBe(415)
    expect(mockPinataUpload).not.toHaveBeenCalled()
  })

  it('should reject a PDF and an all-zero file', async () => {
    expect((await POST(makeFormDataRequest(createFile('%PDF-1.7 ...', 'doc.pdf', 'application/pdf')))).status).toBe(415)
    expect((await POST(makeFormDataRequest(createFile(new Uint8Array(512), 'zero.png', 'image/png')))).status).toBe(415)
    expect(mockPinataUpload).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Validation — size
  // ---------------------------------------------------------------------------

  it('should accept a file exactly at the 4MB limit', async () => {
    const response = await POST(makeFormDataRequest(createFile(imageBytes('png', MAX_BYTES), 'exact.png', 'image/png')))
    expect(response.status).toBe(200)
  })

  it('should return 413 when the file exceeds 4MB', async () => {
    const response = await POST(makeFormDataRequest(createFile(imageBytes('png', MAX_BYTES + 1), 'big.png', 'image/png')))
    const json = await response.json()

    expect(response.status).toBe(413)
    expect(json.error_code).toBe('IMAGE_TOO_LARGE')
    expect(json.error_message).toContain('4MB')
    expect(mockPinataUpload).not.toHaveBeenCalled()
  })

  it('should reject early from an oversized Content-Length header', async () => {
    const response = await POST(
      makeFormDataRequest(createFile(imageBytes('png'), 'small.png', 'image/png'), { 'content-length': String(50 * 1024 * 1024) })
    )

    expect(response.status).toBe(413)
    expect(mockPinataUpload).not.toHaveBeenCalled()
  })

  it('should reject a multipart body over the cap even without a Content-Length header', async () => {
    const formData = new FormData()
    formData.append('file', createFile(imageBytes('png', 1024), 'a.png', 'image/png'))
    formData.append('padding', 'x'.repeat(MAX_BYTES + 32 * 1024))
    const response = await POST(new NextRequest('http://localhost:3000/api/ipfs/upload-file', { method: 'POST', body: formData }))

    expect(response.status).toBe(413)
    expect(mockPinataUpload).not.toHaveBeenCalled()
  })

  // ---------------------------------------------------------------------------
  // Validation — request shape
  // ---------------------------------------------------------------------------

  it('should return 400 when no file is provided', async () => {
    const response = await POST(makeFormDataRequest(null))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.status).toBe('error')
    expect(json.error_code).toBe('MISSING_REQUIRED_FIELD')
  })

  it('should return 415 for a non-multipart body', async () => {
    const response = await POST(
      new NextRequest('http://localhost:3000/api/ipfs/upload-file', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ file: 'x' }),
      })
    )

    expect(response.status).toBe(415)
  })

  it('should return 400 for a filename with path traversal', async () => {
    for (const name of ['../etc/passwd', '..\\windows\\system']) {
      const response = await POST(makeFormDataRequest(createFile(imageBytes('png'), name, 'image/png')))
      const json = await response.json()

      expect(response.status).toBe(400)
      expect(json.error_code).toBe('INVALID_INPUT')
    }
  })

  // ---------------------------------------------------------------------------
  // Pinata / IPFS errors
  // ---------------------------------------------------------------------------

  it('should return a generic 500 without echoing the Pinata error', async () => {
    mockPinataUpload.mockRejectedValueOnce(new Error('Pinata: invalid JWT for account acct_123 (internal detail)'))

    const response = await POST(makeFormDataRequest(createFile(imageBytes('png'), 'valid.png', 'image/png')))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error_code).toBe('IMAGE_UPLOAD_FAILED')
    expect(json.error_message).toBe('Failed to upload file to IPFS. Please try again.')
    expect(JSON.stringify(json)).not.toContain('JWT')
  })

  // ---------------------------------------------------------------------------
  // Wallet authentication errors
  // ---------------------------------------------------------------------------

  it('should return 401 before reading the body when wallet upload auth fails', async () => {
    const { verifyWalletUploadAuth } = await import('@/lib/security/walletMessageAuth')
    const { AppError } = await import('@/lib/errors')
    vi.mocked(verifyWalletUploadAuth).mockImplementationOnce(() => {
      throw new AppError('UNAUTHORIZED', 'Invalid wallet signature', 401)
    })

    const response = await POST(makeFormDataRequest(createFile(imageBytes('png'), 'valid.png', 'image/png')))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.status).toBe('error')
    expect(mockPinataUpload).not.toHaveBeenCalled()
  })
})
