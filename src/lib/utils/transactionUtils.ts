import type { ServiceIdentifier } from '@/lib/solana/serviceMemo'

/**
 * Format service identifier for display by removing "-service" suffix
 * and capitalizing words
 */
export function formatServiceIdentifier(serviceId: ServiceIdentifier): string {
  return serviceId
    .replace(/-service$/, '') // Remove "-service" suffix
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format blockchain timestamp to human-readable format
 */
export function formatTimestamp(blockTime: number | null): string {
  if (!blockTime) return 'Unknown'
  return new Date(blockTime * 1000).toLocaleString()
}

/**
 * Truncate long addresses for display with ellipsis
 */
export function truncateAddress(address: string, startLength: number = 4, endLength: number = 4): string {
  if (address.length <= startLength + endLength) return address
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

export function formatTokenAmount(amount: number, decimals: number): string {
  // First remove trailing zeros from the fixed decimal string
  const formattedNumber = amount.toFixed(decimals).replace(/\.0+$|(?<=\.[0-9]*[1-9])0+$/, '')

  // Convert back to number and apply locale formatting for commas
  return parseFloat(formattedNumber).toLocaleString()
}
