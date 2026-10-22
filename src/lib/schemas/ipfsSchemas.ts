import { z } from 'zod'

/**
 * Schemas for IPFS uploads and the metadata URIs that point at them.
 *
 * Kept free of imports from `apiSchemas.ts` so that module can depend on this one
 * without creating an import cycle.
 */

/** Max size of a metadata JSON upload (raw request body). */
export const MAX_METADATA_JSON_BYTES = 16 * 1024

/** Metaplex on-chain URI field limit. */
export const MAX_METADATA_URI_LENGTH = 200

const MAX_ASSET_URI_LENGTH = 512
const MAX_LINK_LENGTH = 200

const SOLANA_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
// eslint-disable-next-line no-control-regex -- intentionally matching control characters
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/
// eslint-disable-next-line no-control-regex -- intentionally matching control characters (tab/newline allowed)
const CONTROL_CHARS_EXCEPT_WHITESPACE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/
const URI_SCHEME = /^([a-z][a-z0-9+.-]*):/i

function parseUrl(value: string): URL | null {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const isHttpsUrl = (url: URL): boolean => url.protocol === 'https:' && url.hostname.length > 0 && !url.username && !url.password

const isWebLink = (value: string, allowHttp: boolean): boolean => {
  const url = parseUrl(value)
  if (!url) return false
  if (url.protocol === 'http:' && allowHttp) return url.hostname.length > 0 && !url.username && !url.password
  return isHttpsUrl(url)
}

const IPFS_URI = /^ipfs:\/\/(ipfs\/)?[A-Za-z0-9]{10,}(\/[A-Za-z0-9._~%/-]*)?$/
const ARWEAVE_URI = /^ar:\/\/[A-Za-z0-9_-]{20,}(\/[A-Za-z0-9._~%/-]*)?$/

/** True for `https://host/...`, `ipfs://<cid>[/path]` or `ar://<txid>[/path]`. */
export function isAllowedAssetUri(value: string): boolean {
  if (value.startsWith('ipfs:')) return IPFS_URI.test(value)
  if (value.startsWith('ar:')) return ARWEAVE_URI.test(value)
  const url = parseUrl(value)
  return url !== null && isHttpsUrl(url)
}

const text = ({ min = 0, max, multiline = false }: { min?: number; max: number; multiline?: boolean }) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((value) => !(multiline ? CONTROL_CHARS_EXCEPT_WHITESPACE : CONTROL_CHARS).test(value), {
      message: 'Control characters are not allowed',
    })

/** Hosted asset reference (logo, files): https, ipfs or ar only. */
export const assetUriSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_ASSET_URI_LENGTH)
  .refine(isAllowedAssetUri, { message: 'Must be an https://, ipfs:// or ar:// URI' })

/** On-chain metadata URI (WEB3-17): https, ipfs or ar only, within the Metaplex 200-char limit. */
export const metadataUriSchema = z
  .string()
  .trim()
  .max(MAX_METADATA_URI_LENGTH)
  .refine((value) => value === '' || isAllowedAssetUri(value), { message: 'Metadata URI must be an https://, ipfs:// or ar:// URI' })

/** Website link. http is still accepted because the token forms allow http websites. */
const webLinkSchema = z
  .string()
  .trim()
  .max(MAX_LINK_LENGTH)
  .refine((value) => isWebLink(value, true), { message: 'Must be an http(s) URL' })

const httpsLinkSchema = z
  .string()
  .trim()
  .max(MAX_LINK_LENGTH)
  .refine((value) => isWebLink(value, false), { message: 'Must be an https:// URL' })

/** Social attribute value: a handle (`@name`, `t.me/name`) or an http(s) link — never another URI scheme. */
const attributeValueSchema = text({ max: MAX_LINK_LENGTH }).refine(
  (value) => {
    const scheme = URI_SCHEME.exec(value)?.[1]?.toLowerCase()
    if (!scheme) return true
    return (scheme === 'http' || scheme === 'https') && isWebLink(value, true)
  },
  { message: 'Links must use http(s)' }
)

/**
 * Strict Metaplex-style token metadata accepted by `/api/ipfs/upload-json`.
 * Mirrors what `useTokenCreator` / `useUpdateMetadata` build; unknown keys are rejected.
 */
export const tokenMetadataUploadSchema = z.strictObject({
  name: text({ min: 1, max: 32 }),
  symbol: text({ max: 10 }),
  description: text({ max: 500, multiline: true }).optional(),
  image: assetUriSchema.optional(),
  external_url: webLinkSchema.optional(),
  attributes: z
    .array(
      z.strictObject({
        trait_type: text({ min: 1, max: 32 }),
        value: attributeValueSchema,
      })
    )
    .max(10)
    .optional(),
  created_with: text({ max: 32 }).optional(),
  properties: z
    .strictObject({
      files: z
        .array(
          z.strictObject({
            uri: assetUriSchema,
            type: text({ min: 1, max: 32 }),
          })
        )
        .max(4)
        .optional(),
      category: z.enum(['token', 'image']).optional(),
      creators: z
        .array(
          z.strictObject({
            address: z.string().regex(SOLANA_ADDRESS_PATTERN, 'Invalid creator address'),
            share: z.number().int().min(0).max(100),
            verified: z.boolean().optional(),
          })
        )
        .max(5)
        .optional(),
    })
    .optional(),
  extensions: z
    .strictObject({
      website: httpsLinkSchema.optional(),
      twitter: httpsLinkSchema.optional(),
      telegram: httpsLinkSchema.optional(),
      discord: httpsLinkSchema.optional(),
    })
    .optional(),
})

export type TokenMetadataUpload = z.infer<typeof tokenMetadataUploadSchema>
