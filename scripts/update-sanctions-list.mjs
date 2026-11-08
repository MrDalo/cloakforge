#!/usr/bin/env node
/**
 * Refreshes the bundled OFAC SDN Solana address list.
 *
 * Source: community mirror of the OFAC SDN "Digital Currency Address" entries (one base58 address per line).
 * Output: src/lib/compliance/data/ofac-sol-addresses.json  ({ source, fetchedAt, addresses }).
 *
 * Usage: npm run sanctions:update
 * Fails (non-zero exit, file untouched) on network errors, an empty list, or any entry that is not a
 * 32-byte base58 key.
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { PublicKey } from '@solana/web3.js'

const SOURCE_URL = 'https://raw.githubusercontent.com/0xB10C/ofac-sanctioned-digital-currency-addresses/lists/sanctioned_addresses_SOL.txt'
const OUTPUT_PATH = fileURLToPath(new URL('../src/lib/compliance/data/ofac-sol-addresses.json', import.meta.url))

/** True when the value decodes (base58) to exactly 32 bytes, i.e. a valid Solana public key. */
const isValidSolanaKey = (value) => {
  try {
    return new PublicKey(value).toBytes().length === 32
  } catch {
    return false
  }
}

const response = await fetch(SOURCE_URL)
if (!response.ok) {
  throw new Error(`Failed to fetch sanctions list: HTTP ${response.status}`)
}

const lines = (await response.text())
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)

if (lines.length === 0) {
  throw new Error('Sanctions list is empty; refusing to overwrite the bundled file')
}

const invalid = lines.filter((line) => !isValidSolanaKey(line))
if (invalid.length > 0) {
  throw new Error(`Sanctions list contains ${invalid.length} entr${invalid.length === 1 ? 'y' : 'ies'} that are not 32-byte base58 keys`)
}

const addresses = [...new Set(lines)].sort()
const payload = { source: SOURCE_URL, fetchedAt: new Date().toISOString(), addresses }

await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`Wrote ${addresses.length} sanctioned Solana addresses to ${OUTPUT_PATH}`)
