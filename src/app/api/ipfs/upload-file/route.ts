import { NextRequest, NextResponse } from 'next/server'
import { PinataSDK } from 'pinata'
import getConfig from '@/lib/config/config'
import { getLogger } from '@/lib/logger/logger'

const config = getConfig()
const logger = getLogger({ context: 'ipfs-upload-file' })

const pinata = new PinataSDK({
  pinataJwt: config.ipfsJWT,
  pinataGateway: config.ipfsGateway,
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (3MB limit)
    if (file.size > 3 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const response = await pinata.upload.public.file(file, {
      groupId: config.ipfsTokenImagesGroupId,
    })

    const uri = `https://${config.ipfsGateway}/ipfs/${response.cid}`

    logger.info('File uploaded to IPFS successfully', {
      cid: response.cid,
      fileName: file.name,
      fileSize: file.size,
      groupId: config.ipfsTokenImagesGroupId,
      groupName: 'token-images',
      uri,
    })

    return NextResponse.json({
      cid: response.cid,
      uri,
    })
  } catch (error) {
    logger.error('IPFS file upload error', error)
    return NextResponse.json({ error: 'Failed to upload file to IPFS' }, { status: 500 })
  }
}
