// File: src/lib/ipfs/utils.ts
// Updated to use server-side API routes for security

/**
 * Helper function to upload a File to IPFS via our secure API route
 * @param file - the file to upload
 * @returns a string with the HTTPS URI for the uploaded file
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/ipfs/upload-file', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`IPFS file upload failed: ${errorData.error || response.statusText}`)
  }

  const data = await response.json()
  return data.uri
}

/**
 * Helper function to upload JSON metadata to IPFS via our secure API route
 * @param json - the JSON object to upload
 * @returns a string with the HTTPS URI for the uploaded JSON metadata
 */
export async function uploadJSONToIPFS(json: object): Promise<string> {
  const response = await fetch('/api/ipfs/upload-json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(json),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(`IPFS JSON upload failed: ${errorData.error || response.statusText}`)
  }

  const data = await response.json()
  return data.uri
}
