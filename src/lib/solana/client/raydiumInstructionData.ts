/**
 * Decoders for the instruction data of the Raydium instructions the liquidity provider builds. Every
 * layout is `8-byte Anchor discriminator + little-endian Borsh fields`, copied from
 * @raydium-io/raydium-sdk-v2 0.2.39-alpha:
 *
 * - CPMM `initialize` — `src/raydium/cpmm/instruction.ts` makeCreateCpmmPoolInInstruction:
 *   u64 init_amount_0, u64 init_amount_1, u64 open_time.
 * - CLMM `create_pool` — `src/raydium/clmm/instrument.ts` createPoolInstruction:
 *   u128 sqrt_price_x64, u64 open_time.
 * - CLMM `open_position_with_token22_nft` — instrument.ts openPositionFromLiquidityInstruction22:
 *   i32 tick_lower_index, i32 tick_upper_index, i32 tick_array_lower_start_index,
 *   i32 tick_array_upper_start_index, u128 liquidity, u64 amount_0_max, u64 amount_1_max,
 *   bool with_metadata, Option<bool> base_flag as (u8 is_some, bool value).
 *
 * Each decoder requires the exact length, so trailing bytes can never hide behind a valid prefix.
 */

const DISCRIMINATOR_SIZE = 8
const CPMM_INITIALIZE_DATA_SIZE = DISCRIMINATOR_SIZE + 3 * 8
const CLMM_CREATE_POOL_DATA_SIZE = DISCRIMINATOR_SIZE + 16 + 8
const CLMM_OPEN_POSITION_DATA_SIZE = DISCRIMINATOR_SIZE + 4 * 4 + 16 + 2 * 8 + 3

const BITS_PER_U64 = BigInt(64)

const viewOf = (data: Uint8Array): DataView => new DataView(data.buffer, data.byteOffset, data.byteLength)

const readU128 = (view: DataView, offset: number): bigint =>
  (view.getBigUint64(offset + 8, true) << BITS_PER_U64) + view.getBigUint64(offset, true)

export interface CpmmInitializeData {
  amount0: bigint
  amount1: bigint
  openTime: bigint
}

/** Decodes CPMM `initialize` data (after the discriminator was matched), or null when its length is wrong. */
export function decodeCpmmInitialize(data: Uint8Array): CpmmInitializeData | null {
  if (data.length !== CPMM_INITIALIZE_DATA_SIZE) return null
  const view = viewOf(data)
  return {
    amount0: view.getBigUint64(DISCRIMINATOR_SIZE, true),
    amount1: view.getBigUint64(DISCRIMINATOR_SIZE + 8, true),
    openTime: view.getBigUint64(DISCRIMINATOR_SIZE + 16, true),
  }
}

export interface ClmmCreatePoolData {
  sqrtPriceX64: bigint
  openTime: bigint
}

/** Decodes CLMM `create_pool` data (after the discriminator was matched), or null when its length is wrong. */
export function decodeClmmCreatePool(data: Uint8Array): ClmmCreatePoolData | null {
  if (data.length !== CLMM_CREATE_POOL_DATA_SIZE) return null
  const view = viewOf(data)
  return { sqrtPriceX64: readU128(view, DISCRIMINATOR_SIZE), openTime: view.getBigUint64(DISCRIMINATOR_SIZE + 16, true) }
}

export interface ClmmOpenPositionData {
  tickLower: number
  tickUpper: number
  tickArrayLowerStart: number
  tickArrayUpperStart: number
  liquidity: bigint
  amount0Max: bigint
  amount1Max: bigint
  /** The `Option<bool>` base_flag tag: 0 = None (liquidity is the sizing input), 1 = Some (an amount is) */
  baseFlagIsSome: number
}

/** Decodes CLMM `open_position_with_token22_nft` data (after the discriminator was matched), or null when its length is wrong. */
export function decodeClmmOpenPosition(data: Uint8Array): ClmmOpenPositionData | null {
  if (data.length !== CLMM_OPEN_POSITION_DATA_SIZE) return null
  const view = viewOf(data)
  const body = DISCRIMINATOR_SIZE
  return {
    tickLower: view.getInt32(body, true),
    tickUpper: view.getInt32(body + 4, true),
    tickArrayLowerStart: view.getInt32(body + 8, true),
    tickArrayUpperStart: view.getInt32(body + 12, true),
    liquidity: readU128(view, body + 16),
    amount0Max: view.getBigUint64(body + 32, true),
    amount1Max: view.getBigUint64(body + 40, true),
    // body + 48: with_metadata (bool, only affects the NFT's metadata); then Option<bool> base_flag
    baseFlagIsSome: view.getUint8(body + 49),
  }
}
