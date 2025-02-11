// File: path/to/your/ipfsHelpers.ts
import { PinataSDK } from 'pinata-web3'
import getConfig from '../config/config'

const config = getConfig()

const pinata = new PinataSDK({
  pinataJwt: config.ipfsJWT,
  pinataGateway: config.ipfsGateway,
})

/**
 * Helper function to upload a File to Pinata IPFS using the Pinata SDK.
 * WARNING: Exposing your Pinata JWT on the client is not secure.
 * For production, move this logic to a secure backend.
 *
 * @param file - the file to upload
 * @returns a string with the ipfs:// URI for the uploaded file
 */
export async function uploadFileToIPFS(file: File): Promise<string> {
  const response = await pinata.upload.file(file)
  // Assuming the response contains an "IpfsHash" property.
  return `https://ipfs.io/ipfs/${response.IpfsHash}`
}

/**
 * Helper function to upload JSON metadata to Pinata IPFS using the Pinata SDK.
 * WARNING: Exposing your Pinata JWT on the client is not secure.
 * For production, move this logic to a secure backend.
 *
 * @param json - the JSON object to upload
 * @returns a string with the ipfs:// URI for the uploaded JSON metadata
 */
export async function uploadJSONToIPFS(json: object): Promise<string> {
  const response = await pinata.upload.json(json)
  return `https://ipfs.io/ipfs/${response.IpfsHash}`
}
