/**
 * Solana Address Utilities
 *
 * Functions for validating, formatting, and manipulating Solana addresses.
 */

import { isAddress, address, type Address } from '@solana/kit'
import { PublicKey } from '@solana/web3.js'

/**
 * Validate Solana address format using Kit's isAddress
 *
 * @param addressString - Address string to validate
 * @returns True if valid Solana address format
 */
export const isValidSolanaAddress = (addressString: string): boolean => {
  try {
    return isAddress(addressString)
  } catch {
    return false
  }
}

/**
 * Shorten Solana address for display
 *
 * @param addr - Address to shorten (string or Kit Address type)
 * @param chars - Number of characters to show at start and end (default: 4)
 * @returns Shortened address string (e.g., "7xKX...mK9p")
 */
export const shortenAddress = (addr: string | Address, chars = 4): string => {
  const addressString = typeof addr === 'string' ? addr : addr
  if (!addressString) return ''
  if (addressString.length <= chars * 2) return addressString
  return `${addressString.slice(0, chars)}...${addressString.slice(-chars)}`
}

/**
 * Convert between Kit Address and legacy PublicKey types
 *
 * @param addr - Kit Address to convert
 * @returns Legacy PublicKey instance
 */
export const convertAddressToPublicKey = (addr: Address): PublicKey => new PublicKey(addr)

/**
 * Convert legacy PublicKey to Kit Address
 *
 * @param publicKey - Legacy PublicKey to convert
 * @returns Kit Address string
 */
export const convertPublicKeyToAddress = (publicKey: PublicKey): Address => address(publicKey.toString())
