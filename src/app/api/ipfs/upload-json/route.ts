import { z } from 'zod'
import { PinataSDK } from 'pinata'
import getServerConfig from '@/lib/config/getServerConfig'
import { createApiRoute } from '@/lib/api'
import { AppError } from '@/lib/errors'
import { verifyWalletUploadAuth } from '@/lib/security/walletMessageAuth'

const config = getServerConfig()

const pinata = new PinataSDK({
  pinataJwt: config.ipfsJWT,
  pinataGateway: config.ipfsGateway,
})

const jsonUploadSchema = z.record(z.string(), z.any())

/**
 * POST /api/ipfs/upload-json
 *
 * Uploads JSON metadata to IPFS
 */
export const POST = createApiRoute({
  name: 'ipfs/upload-json',
  schema: jsonUploadSchema,
  handler: async (json, request) => {
    // Requires a fresh wallet-signed message proving the caller holds the claimed wallet's key
    verifyWalletUploadAuth(request)

    // Validate JSON size (1MB limit)
    const jsonString = JSON.stringify(json)
    if (jsonString.length > 1024 * 1024) {
      throw new AppError('INVALID_INPUT', 'JSON data too large. Maximum size is 1MB', 400)
    }

    const response = await pinata.upload.public.json(json, {
      groupId: config.ipfsJsonMetadataGroupId,
    })

    const uri = `https://${config.ipfsGateway}/ipfs/${response.cid}`

    return {
      cid: response.cid,
      uri,
    }
  },
})
