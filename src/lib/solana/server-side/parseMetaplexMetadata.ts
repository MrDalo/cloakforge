/**
 * Bounds-checked parser for Metaplex Token Metadata accounts (MetadataV1).
 *
 * Reads only the fields the Token Auditor needs, up to and including `is_mutable`. Every read is
 * range-checked and string lengths are capped, so a malformed or hostile account yields `null`
 * instead of an exception or an oversized allocation.
 */

import 'server-only'

import { PublicKey } from '@solana/web3.js'

/** First byte of a Metaplex metadata account (`Key::MetadataV1`). */
const METADATA_V1_KEY = 4
const PUBLIC_KEY_LENGTH = 32
/** Upper bound for any string field; Metaplex limits are 32 (name), 10 (symbol) and 200 (URI) bytes. */
const MAX_STRING_BYTES = 256
/** Metaplex allows at most 5 creators. */
const MAX_CREATORS = 5
/** Creator entry: address (32) + verified flag (1) + share (1). */
const CREATOR_SIZE = 34
const SELLER_FEE_BASIS_POINTS_SIZE = 2

export interface MetaplexMetadata {
  updateAuthority: PublicKey
  mint: PublicKey
  /** Raw on-chain values; may contain trailing NUL padding. */
  name: string
  symbol: string
  uri: string
  isMutable: boolean
}

interface BorshReader {
  u8: () => number
  u32: () => number
  publicKey: () => PublicKey
  string: () => string
  skip: (length: number) => void
}

/**
 * Creates a sequential reader that throws a RangeError on any out-of-bounds read.
 *
 * @param data - Raw account data.
 * @returns Reader over `data`.
 */
function createBorshReader(data: Buffer): BorshReader {
  let offset = 0

  const take = (length: number): Buffer => {
    if (length < 0 || offset + length > data.length) {
      throw new RangeError('Metadata account is truncated')
    }
    const slice = data.subarray(offset, offset + length)
    offset += length
    return slice
  }

  return {
    u8: () => take(1)[0],
    u32: () => take(4).readUInt32LE(0),
    publicKey: () => new PublicKey(take(PUBLIC_KEY_LENGTH)),
    string: () => {
      const length = take(4).readUInt32LE(0)
      if (length > MAX_STRING_BYTES) {
        throw new RangeError('Metadata string is too long')
      }
      return take(length).toString('utf8')
    },
    skip: (length: number) => {
      take(length)
    },
  }
}

/**
 * Parses a Metaplex metadata account.
 *
 * @param data - Raw account data (the account must already be verified as owned by the Metaplex program).
 * @returns Parsed fields, or null when the data is not a valid MetadataV1 account.
 */
export function parseMetaplexMetadata(data: Buffer): MetaplexMetadata | null {
  try {
    const reader = createBorshReader(data)
    if (reader.u8() !== METADATA_V1_KEY) {
      return null
    }

    const updateAuthority = reader.publicKey()
    const mint = reader.publicKey()
    const name = reader.string()
    const symbol = reader.string()
    const uri = reader.string()
    reader.skip(SELLER_FEE_BASIS_POINTS_SIZE)

    // creators: Option<Vec<Creator>>
    const creatorsTag = reader.u8()
    if (creatorsTag > 1) {
      return null
    }
    if (creatorsTag === 1) {
      const creatorCount = reader.u32()
      if (creatorCount > MAX_CREATORS) {
        return null
      }
      reader.skip(creatorCount * CREATOR_SIZE)
    }

    reader.skip(1) // primary_sale_happened
    const isMutable = reader.u8() === 1

    return { updateAuthority, mint, name, symbol, uri, isMutable }
  } catch {
    return null
  }
}
