import { describe, it, expect, vi } from 'vitest'
import { handleApiResponse } from '../handleApiResponse'
import type { ApiResponseBase } from '@/types'

// Mock the logger so tests stay silent
vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}))

// Mock handleError from errors module
vi.mock('@/lib/errors', () => ({
  handleError: vi.fn(() => 'Handled error message'),
}))

describe('handleApiResponse', () => {
  // ---------------------------------------------------------------------------
  // Success responses
  // ---------------------------------------------------------------------------

  it('should returns data for a successful response', () => {
    const response: ApiResponseBase<{ value: number }> = {
      status: 'success',
      status_code: 200,
      error_message: '',
      data: { value: 42 },
    }
    const result = handleApiResponse(response)
    expect(result).toEqual({ value: 42 })
  })

  it('should returns string data for a successful response', () => {
    const response: ApiResponseBase<string> = {
      status: 'success',
      status_code: 200,
      error_message: '',
      data: 'hello',
    }
    expect(handleApiResponse(response)).toBe('hello')
  })

  it('should returns array data for a successful response', () => {
    const response: ApiResponseBase<number[]> = {
      status: 'success',
      status_code: 200,
      error_message: '',
      data: [1, 2, 3],
    }
    expect(handleApiResponse(response)).toEqual([1, 2, 3])
  })

  // ---------------------------------------------------------------------------
  // Success with null data — should throw
  // ---------------------------------------------------------------------------

  it('should throws when status is success but data is null', () => {
    const response: ApiResponseBase<{ value: number }> = {
      status: 'success',
      status_code: 200,
      error_message: '',
      data: null,
    }
    expect(() => handleApiResponse(response)).toThrow('API returned success status but no data')
  })

  // ---------------------------------------------------------------------------
  // Error responses — should throw
  // ---------------------------------------------------------------------------

  it('should throws with error_message for an error response', () => {
    const response: ApiResponseBase<null> = {
      status: 'error',
      status_code: 400,
      error_message: 'Validation failed',
      data: null,
    }
    expect(() => handleApiResponse(response)).toThrow('Validation failed')
  })

  it('should throws for a 500 error response', () => {
    const response: ApiResponseBase<null> = {
      status: 'error',
      status_code: 500,
      error_message: 'Internal server error',
      data: null,
    }
    expect(() => handleApiResponse(response)).toThrow('Internal server error')
  })

  it('should throws for a 403 error response', () => {
    const response: ApiResponseBase<null> = {
      status: 'error',
      status_code: 403,
      error_message: 'Forbidden',
      data: null,
    }
    expect(() => handleApiResponse(response)).toThrow('Forbidden')
  })

  it('should falls back to handleError when error_message is empty string', () => {
    const response: ApiResponseBase<null> = {
      status: 'error',
      status_code: 500,
      error_message: '',
      data: null,
    }
    // handleError mock returns 'Handled error message'
    expect(() => handleApiResponse(response)).toThrow('Handled error message')
  })
})
