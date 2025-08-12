/**
 * Wallet-related utility functions for formatting and interaction
 */

/**
 * Format a number with appropriate units (K, M, B)
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with units
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`
  return num.toFixed(decimals)
}

/**
 * Format a number as USD currency
 * @param num - The number to format as currency
 * @returns Formatted currency string
 */
export const formatCurrency = (num: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num)

/**
 * Copy a wallet address to the clipboard
 * @param address - The wallet address to copy
 */
export const copyAddress = (address: string): void => {
  navigator.clipboard.writeText(address)
}
