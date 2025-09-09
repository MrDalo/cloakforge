// File: src/lib/ipfs/utils.ts
// Updated to use server-side API routes for security and the new apiClient pattern

import { apiClient, apiClientFile } from '@/lib/utils/apiClient'

/**
 * Helper function to upload a File to IPFS via our secure API route
 * Privacy-first: No API keys required, secure server-side processing
 * @param file - the file to upload
 * @returns a string with the HTTPS URI for the uploaded file
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  // Use the new apiClientFile for proper error handling and type safety
  const response = await apiClientFile<{ uri: string }>('/api/ipfs/upload-file', formData)
  return response.uri
}

/**
 * Helper function to upload JSON metadata to IPFS via our secure API route
 * Privacy-first: No API keys required, secure server-side processing
 * @param json - the JSON object to upload
 * @returns a string with the HTTPS URI for the uploaded JSON metadata
 */
export async function uploadJSONToIPFS(json: object): Promise<string> {
  // Use the standard apiClient for JSON uploads
  const response = await apiClient<object, { uri: string }>('/api/ipfs/upload-json', json)
  return response.uri
}
