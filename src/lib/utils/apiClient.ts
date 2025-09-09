/**
 * Type-safe API client for Solana API routes
 *
 * Provides a consistent way to make API calls with proper typing
 * and error handling throughout the application.
 */

import { handleApiResponse } from './handleApiResponse'
import type { ApiResponseBase } from '@/types/api'

/**
 * Type-safe API client for making requests to Solana API routes
 *
 * @param endpoint - The API endpoint (e.g., '/api/solana/burn-tokens')
 * @param request - The request body with proper typing
 * @returns Promise resolving to the typed response data
 */
export async function apiClient<TRequest, TResponse>(endpoint: string, request: TRequest): Promise<TResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error_message || `API request failed with status ${response.status}`
    throw new Error(errorMessage)
  }

  const apiResponse: ApiResponseBase<TResponse> = await response.json()

  // Use handleApiResponse to extract data with proper error handling
  return handleApiResponse(apiResponse)
}

/**
 * API client for file upload endpoints
 *
 * @param endpoint - The API endpoint (e.g., '/api/ipfs/upload-file')
 * @param formData - FormData containing the file to upload
 * @returns Promise resolving to the typed response data
 */
export async function apiClientFile<TResponse>(endpoint: string, formData: FormData): Promise<TResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.error_message || `API request failed with status ${response.status}`
    throw new Error(errorMessage)
  }

  const apiResponse: ApiResponseBase<TResponse> = await response.json()

  // Use handleApiResponse to extract data with proper error handling
  return handleApiResponse(apiResponse)
}
