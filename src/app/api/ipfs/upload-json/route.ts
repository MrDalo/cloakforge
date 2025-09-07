import { NextRequest, NextResponse } from 'next/server'
import { PinataSDK } from 'pinata'
import getConfig from '@/lib/config/config'
import { getLogger } from '@/lib/logger/logger'

const config = getConfig()
const logger = getLogger({ context: 'ipfs-upload-json' })

const pinata = new PinataSDK({
  pinataJwt: config.ipfsJWT,
  pinataGateway: config.ipfsGateway,
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const json = await request.json()

    if (!json || typeof json !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON data provided' }, { status: 400 })
    }

    // Validate JSON size (1MB limit for metadata)
    const jsonString = JSON.stringify(json)
    if (jsonString.length > 1024 * 1024) {
      return NextResponse.json({ error: 'JSON data too large' }, { status: 400 })
    }

    const response = await pinata.upload.public.json(json, {
      groupId: config.ipfsJsonMetadataGroupId,
    })

    const uri = `https://${config.ipfsGateway}/ipfs/${response.cid}`

    logger.info('JSON uploaded to IPFS successfully', {
      cid: response.cid,
      jsonSize: jsonString.length,
      groupId: config.ipfsJsonMetadataGroupId,
      groupName: 'json-metadata',
      uri,
    })

    return NextResponse.json({
      cid: response.cid,
      uri,
    })
  } catch (error) {
    logger.error('IPFS JSON upload error', error)
    return NextResponse.json({ error: 'Failed to upload JSON to IPFS' }, { status: 500 })
  }
}
