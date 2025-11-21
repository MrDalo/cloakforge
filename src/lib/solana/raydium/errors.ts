export const RAYDIUM_ERROR_CODES = {
  PRICE_TOO_SMALL: 'PRICE_TOO_SMALL',
  QUANTITY_TOO_SMALL: 'QUANTITY_TOO_SMALL',
  INVALID_MARKET: 'INVALID_MARKET',
  POOL_ALREADY_EXISTS: 'POOL_ALREADY_EXISTS',
}

export function handleRaydiumError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('0x1')) {
    return 'Insufficient funds to complete the transaction.'
  }

  if (message.includes('Price too small') || message.includes('0x12')) {
    return 'Price too small. Try increasing the Tick Size or Min Order Size.'
  }

  if (message.includes('Quantity too small') || message.includes('0x13')) {
    return 'Quantity too small. Try increasing the Min Order Size.'
  }

  if (message.includes('Market is invalid') || message.includes('0x14')) {
    return 'The OpenBook Market ID provided is invalid or not initialized.'
  }

  if (message.includes('Pool already exists')) {
    return 'A liquidity pool for this market already exists.'
  }

  return message
}
