// @vitest-environment jsdom
/**
 * Unit tests for src/lib/utils/apiClient.ts
 *
 * Tests:
 * - apiClient: happy path, error response with error_message, error without message, JSON parse failure
 * - apiClientFile: happy path, error response, JSON parse fallback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/utils/handleApiResponse', () => ({
  handleApiResponse: vi.fn((resp) => {
    if (resp.status !== 'success') throw new Error(resp.error_message || 'API error')
    return resp.data
  }),
}))

import { apiClient, apiClientFile } from '../apiClient'

const SUCCESS_RESPONSE = {
  status: 'success',
  data: { signature: 'abc123' },
  status_code: 200,
  error_message: null,
  error_code: null,
}

function mockFetch(ok: boolean, body: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as Response)
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches with POST method and JSON content-type', async () => {
    mockFetch(true, SUCCESS_RESPONSE)
    await apiClient('/api/test', { foo: 'bar' })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foo: 'bar' }),
      })
    )
  })

  it('returns data from successful response', async () => {
    mockFetch(true, SUCCESS_RESPONSE)
    const result = await apiClient('/api/test', {})
    expect(result).toEqual({ signature: 'abc123' })
  })

  it('throws with error_message when response is not ok', async () => {
    mockFetch(false, { error_message: 'Unauthorized access' }, 401)
    await expect(apiClient('/api/test', {})).rejects.toThrow('Unauthorized access')
  })

  it('throws with status fallback when error_message is missing', async () => {
    mockFetch(false, {}, 500)
    await expect(apiClient('/api/test', {})).rejects.toThrow('API request failed with status 500')
  })

  it('throws with status fallback when JSON parse fails on error response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => { throw new Error('invalid json') },
    } as unknown as Response)

    await expect(apiClient('/api/test', {})).rejects.toThrow('API request failed with status 503')
  })

  it('passes response through handleApiResponse', async () => {
    const { handleApiResponse } = await import('@/lib/utils/handleApiResponse')
    mockFetch(true, SUCCESS_RESPONSE)
    await apiClient('/api/test', {})
    expect(handleApiResponse).toHaveBeenCalledWith(SUCCESS_RESPONSE)
  })
})

describe('apiClientFile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches with POST method and FormData body (no Content-Type header)', async () => {
    mockFetch(true, SUCCESS_RESPONSE)
    const formData = new FormData()
    formData.append('file', new Blob(['data']), 'test.png')

    await apiClientFile('/api/ipfs/upload-file', formData)

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/ipfs/upload-file',
      expect.objectContaining({
        method: 'POST',
        body: formData,
      })
    )
    // Should NOT set Content-Type (browser sets it with boundary for multipart)
    const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(callArgs.headers).toBeUndefined()
  })

  it('returns data from successful file upload', async () => {
    mockFetch(true, { status: 'success', data: { uri: 'https://ipfs.example.com/file' }, status_code: 200 })
    const formData = new FormData()
    const result = await apiClientFile('/api/ipfs/upload-file', formData)
    expect(result).toEqual({ uri: 'https://ipfs.example.com/file' })
  })

  it('throws with error_message when file upload fails', async () => {
    mockFetch(false, { error_message: 'File too large' }, 413)
    const formData = new FormData()
    await expect(apiClientFile('/api/ipfs/upload-file', formData)).rejects.toThrow('File too large')
  })

  it('throws with status fallback when error body has no message', async () => {
    mockFetch(false, {}, 400)
    const formData = new FormData()
    await expect(apiClientFile('/api/ipfs/upload-file', formData)).rejects.toThrow('API request failed with status 400')
  })

  it('throws with status fallback when JSON parse fails on error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => { throw new Error('bad json') },
    } as unknown as Response)

    const formData = new FormData()
    await expect(apiClientFile('/api/ipfs/upload-file', formData)).rejects.toThrow('API request failed with status 422')
  })
})
