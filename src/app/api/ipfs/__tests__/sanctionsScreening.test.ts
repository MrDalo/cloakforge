import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('server-only', () => ({}))

const SANCTIONED = '42RLPACwZPx3vYYmxSueqsogfynBDqXK298EDsNoyoHi'
const CLEAN_WALLET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

const mockVerifyAuth = vi.hoisted(() => vi.fn())
vi.mock('@/lib/security/walletMessageAuth', () => ({ verifyWalletUploadAuth: mockVerifyAuth }))

const mockPinata = vi.hoisted(() => ({ file: vi.fn(), json: vi.fn() }))
vi.mock('pinata', () => ({
  PinataSDK: vi.fn().mockImplementation(function MockPinata() {
    return { upload: { public: mockPinata } }
  }),
}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn(() => ({
    ipfsJWT: 'mock-jwt',
    ipfsGateway: 'mock-gateway.pinata.cloud',
    ipfsTokenImagesGroupId: 'images',
    ipfsJsonMetadataGroupId: 'json',
  })),
}))

const pngFile = (): File => {
  const bytes = new Uint8Array(64)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  return new File([bytes], 'logo.png', { type: 'image/png' })
}

const fileRequest = (): NextRequest => {
  const formData = new FormData()
  formData.append('file', pngFile())
  return new NextRequest('http://localhost:3000/api/ipfs/upload-file', { method: 'POST', body: formData })
}

const jsonRequest = (): NextRequest =>
  new NextRequest('http://localhost:3000/api/ipfs/upload-json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Token', symbol: 'TKN', description: 'd', image: 'https://example.com/a.png' }),
  })

describe('sanctions screening on IPFS upload routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPinata.file.mockResolvedValue({ cid: 'QmFile' })
    mockPinata.json.mockResolvedValue({ cid: 'QmJson' })
  })

  it('should reject a sanctioned uploading wallet on upload-file', async () => {
    mockVerifyAuth.mockReturnValue(SANCTIONED)
    const { POST } = await import('../upload-file/route')
    const response = await POST(fileRequest())

    expect(response.status).toBe(403)
    expect(JSON.stringify(await response.json())).toContain('This address cannot be served.')
    expect(mockPinata.file).not.toHaveBeenCalled()
  })

  it('should reject a sanctioned uploading wallet on upload-json', async () => {
    mockVerifyAuth.mockReturnValue(SANCTIONED)
    const { POST } = await import('../upload-json/route')
    const response = await POST(jsonRequest())

    expect(response.status).toBe(403)
    expect(mockPinata.json).not.toHaveBeenCalled()
  })

  it('should allow a clean uploading wallet', async () => {
    mockVerifyAuth.mockReturnValue(CLEAN_WALLET)
    const { POST } = await import('../upload-file/route')
    const response = await POST(fileRequest())

    expect(response.status).toBe(200)
    expect(mockPinata.file).toHaveBeenCalledTimes(1)
  })
})
