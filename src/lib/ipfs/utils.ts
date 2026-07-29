// File: src/lib/ipfs/utils.ts
// Updated to use server-side API routes for security and the new apiClient pattern

import { apiClient, apiClientFile } from '@/lib/utils/apiClient'

/**
 * Helper function to upload a File to IPFS via our secure API route
 * Requires wallet-signed auth headers (see createWalletUploadAuthHeaders) proving the
 * caller holds a real wallet's key.
 * @param file - the file to upload
 * @param authHeaders - wallet-signed auth headers from createWalletUploadAuthHeaders
 * @returns a string with the HTTPS URI for the uploaded file
 */
export async function uploadFileToIPFS(file: File, authHeaders: Record<string, string>): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  // Use the new apiClientFile for proper error handling and type safety
  const response = await apiClientFile<{ uri: string }>('/api/ipfs/upload-file', formData, authHeaders)
  return response.uri
}

/**
 * Helper function to upload JSON metadata to IPFS via our secure API route
 * Requires wallet-signed auth headers (see createWalletUploadAuthHeaders) proving the
 * caller holds a real wallet's key.
 * @param json - the JSON object to upload
 * @param authHeaders - wallet-signed auth headers from createWalletUploadAuthHeaders
 * @returns a string with the HTTPS URI for the uploaded JSON metadata
 */
export async function uploadJSONToIPFS(json: object, authHeaders: Record<string, string>): Promise<string> {
  // Use the standard apiClient for JSON uploads
  const response = await apiClient<object, { uri: string }>('/api/ipfs/upload-json', json, authHeaders)
  return response.uri
}
