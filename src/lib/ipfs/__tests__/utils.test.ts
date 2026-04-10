// @vitest-environment jsdom
/**
 * Unit tests for src/lib/ipfs/utils.ts
 *
 * Tests:
 * - uploadFileToIPFS: calls apiClientFile, returns uri, propagates errors
 * - uploadJSONToIPFS: calls apiClient, returns uri, propagates errors
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: vi.fn(),
  apiClientFile: vi.fn(),
}))

import { uploadFileToIPFS, uploadJSONToIPFS } from '../utils'
import { apiClient, apiClientFile } from '@/lib/utils/apiClient'

describe('uploadFileToIPFS', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calls apiClientFile with the correct endpoint and FormData', async () => {
    vi.mocked(apiClientFile).mockResolvedValue({ uri: 'https://gateway.pinata.cloud/ipfs/QmTest' })

    const file = new File(['content'], 'logo.png', { type: 'image/png' })
    await uploadFileToIPFS(file)

    expect(apiClientFile).toHaveBeenCalledOnce()
    const [endpoint, formData] = vi.mocked(apiClientFile).mock.calls[0]
    expect(endpoint).toBe('/api/ipfs/upload-file')
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('file')).toBe(file)
  })

  it('should returns the uri from the API response', async () => {
    const expectedUri = 'https://gateway.pinata.cloud/ipfs/QmFileHash123'
    vi.mocked(apiClientFile).mockResolvedValue({ uri: expectedUri })

    const file = new File(['data'], 'test.png')
    const result = await uploadFileToIPFS(file)

    expect(result).toBe(expectedUri)
  })

  it('should propagates errors from apiClientFile', async () => {
    vi.mocked(apiClientFile).mockRejectedValue(new Error('Upload failed'))

    const file = new File(['data'], 'fail.png')
    await expect(uploadFileToIPFS(file)).rejects.toThrow('Upload failed')
  })
})

describe('uploadJSONToIPFS', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calls apiClient with the correct endpoint and JSON object', async () => {
    vi.mocked(apiClient).mockResolvedValue({ uri: 'https://gateway.pinata.cloud/ipfs/QmJsonHash' })

    const metadata = { name: 'My Token', symbol: 'MTK', description: 'Test token' }
    await uploadJSONToIPFS(metadata)

    expect(apiClient).toHaveBeenCalledOnce()
    expect(vi.mocked(apiClient).mock.calls[0][0]).toBe('/api/ipfs/upload-json')
    expect(vi.mocked(apiClient).mock.calls[0][1]).toEqual(metadata)
  })

  it('should returns the uri from the API response', async () => {
    const expectedUri = 'https://gateway.pinata.cloud/ipfs/QmMetadataHash456'
    vi.mocked(apiClient).mockResolvedValue({ uri: expectedUri })

    const result = await uploadJSONToIPFS({ name: 'Token' })

    expect(result).toBe(expectedUri)
  })

  it('should propagates errors from apiClient', async () => {
    vi.mocked(apiClient).mockRejectedValue(new Error('JSON upload failed'))

    await expect(uploadJSONToIPFS({ name: 'Token' })).rejects.toThrow('JSON upload failed')
  })

  it('should accepts an empty object', async () => {
    vi.mocked(apiClient).mockResolvedValue({ uri: 'https://gateway.pinata.cloud/ipfs/QmEmpty' })

    const result = await uploadJSONToIPFS({})
    expect(result).toBe('https://gateway.pinata.cloud/ipfs/QmEmpty')
  })
})
