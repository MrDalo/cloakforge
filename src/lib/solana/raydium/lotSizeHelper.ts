/**
 * Calculates safe lot sizes for OpenBook markets to avoid "Price too small" or "Quantity too small" errors.
 *
 * @param baseDecimals Decimals of the base token
 * @param quoteDecimals Decimals of the quote token (usually 9 for SOL, 6 for USDC)
 * @param targetTickSize Desired price increment (e.g., 0.01)
 * @param targetMinOrderSize Desired minimum order quantity (e.g., 1)
 */
export function calculateLotSizes(
  baseDecimals: number,
  quoteDecimals: number,
  targetTickSize: number = 0.01,
  targetMinOrderSize: number = 1
) {
  // 1. Calculate Base Lot Size (Minimum Order Size)
  // baseLotSize = 10^(baseDecimals) * minOrderSize
  // Example: Decimals 9, Min Order 1 -> 10^9 * 1 = 1_000_000_000
  const baseLotSize = Math.pow(10, baseDecimals) * targetMinOrderSize

  // 2. Calculate Quote Lot Size (Tick Size)
  // quoteLotSize = 10^(quoteDecimals) * tickSize * baseLotSize
  // Wait, the formula is: price = (quoteLotSize * quoteLots) / (baseLotSize * baseLots)
  // So, 1 tick (price increment) = quoteLotSize / baseLotSize
  // Therefore: quoteLotSize = tickSize * baseLotSize * 10^(quoteDecimals - baseDecimals)?

  // Let's use the standard OpenBook formula:
  // limit_price = price_lots * quote_lot_size / base_lot_size
  // price = limit_price * 10^(base_decimals - quote_decimals)

  // Simplified:
  // baseLotSize = 10^baseDecimals * min_order_size
  // quoteLotSize = 10^quoteDecimals * min_price_change * min_order_size

  const quoteLotSize = Math.pow(10, quoteDecimals) * targetTickSize * targetMinOrderSize

  // Validation: Ensure lot sizes are integers and > 0
  if (baseLotSize < 1 || quoteLotSize < 1) {
    throw new Error('Lot sizes too small. Increase min order size or tick size.')
  }

  return {
    baseLotSize: Math.floor(baseLotSize),
    quoteLotSize: Math.floor(quoteLotSize),
  }
}
