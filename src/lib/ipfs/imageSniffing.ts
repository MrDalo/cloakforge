/**
 * Magic-byte image type detection for IPFS logo uploads.
 *
 * The client-declared MIME type and file extension are never trusted: only the leading
 * bytes decide the type. SVG (scriptable), HTML and anything else that is not a raster
 * PNG/JPEG/GIF/WEBP image is rejected.
 */

/**
 * Max logo upload size. Matches the FileUpload component's default `maxSize` (4 MB);
 * the logo forms currently enforce a stricter 2 MB. Also stays under Vercel's 4.5 MB
 * request-body limit including multipart overhead.
 */
export const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024

export type SniffedImageMimeType = 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'

export interface SniffedImageType {
  mimeType: SniffedImageMimeType
  extension: 'png' | 'jpg' | 'gif' | 'webp'
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff]
const GIF87A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] // "GIF87a"
const GIF89A_SIGNATURE = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] // "GIF89a"
const RIFF_SIGNATURE = [0x52, 0x49, 0x46, 0x46] // "RIFF"
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50] // "WEBP" at offset 8

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0): boolean =>
  bytes.length >= offset + signature.length && signature.every((byte, index) => bytes[offset + index] === byte)

/** Detects PNG/JPEG/GIF/WEBP from magic bytes. Returns null for anything else. */
export function sniffImageType(bytes: Uint8Array): SniffedImageType | null {
  if (startsWith(bytes, PNG_SIGNATURE)) return { mimeType: 'image/png', extension: 'png' }
  if (startsWith(bytes, JPEG_SIGNATURE)) return { mimeType: 'image/jpeg', extension: 'jpg' }
  if (startsWith(bytes, GIF87A_SIGNATURE) || startsWith(bytes, GIF89A_SIGNATURE)) return { mimeType: 'image/gif', extension: 'gif' }
  if (startsWith(bytes, RIFF_SIGNATURE) && startsWith(bytes, WEBP_SIGNATURE, 8)) return { mimeType: 'image/webp', extension: 'webp' }
  return null
}

/**
 * Builds a safe Pinata file name: client name stripped of path, extension and unusual
 * characters, then suffixed with the extension of the sniffed type.
 */
export function buildSafeImageFileName(originalName: string, extension: SniffedImageType['extension']): string {
  const baseName = originalName.split(/[\\/]/).pop() ?? ''
  const stem = baseName
    .replace(/\.[^.]*$/, '')
    .replace(/[^A-Za-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  return `${stem || 'token-logo'}.${extension}`
}
