import 'server-only'

import { createHmac } from 'crypto'
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { getDiscountCoupon, type DiscountCoupon } from '@/lib/contentful/client'
import { AppError } from '@/lib/errors'
import { getLogger } from '@/lib/logger/logger'
import getServerConfig from '@/lib/config/getServerConfig'
import { createConnectionPair } from '@/lib/solana'
import { COUPON_SERVICE_UNAVAILABLE_MESSAGE, COUPON_UNAVAILABLE_MESSAGE } from '@/lib/utils/discountCouponMessages'

// Public coupon messages live in a client-safe module so the UI can recognise them
export { COUPON_SERVICE_UNAVAILABLE_MESSAGE, COUPON_UNAVAILABLE_MESSAGE }

// Solana Memo Program - official program for adding memos to transactions
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

const logger = getLogger({ context: 'discounted-service-fee' })

/** `getSignaturesForAddress` page size (the RPC maximum). */
export const COUPON_USAGE_PAGE_SIZE = 1000

/**
 * Pages of a coupon's MARKER history scanned before giving up (fail closed): at most 10 000
 * transactions per counting window. The marker history holds only that coupon's transactions
 * (plus anything sent to the marker on purpose), and the scan stops as soon as the cap is reached,
 * so this limit is only hit by spam aimed at one coupon or a cap above 10 000 uses.
 */
export const COUPON_USAGE_MAX_PAGES = 10

/** How long a coupon's usage count — or a scan-limit failure — is reused before it is recounted. */
export const COUPON_USAGE_CACHE_TTL_MS = 30_000

/**
 * Slack subtracted from the entry's publish time before the scan stops, so block-time vs. Contentful
 * clock skew can never hide a use made right after publishing (it can only count a few extra uses).
 */
const PUBLISHED_AT_SKEW_SECONDS = 60

/** Domain separation for the marker HMAC: it never equals (or reveals) the memo HMAC of the same code. */
const COUPON_MARKER_DOMAIN = 'cloakforge:coupon-marker:v1:'

export interface DiscountedServiceFee {
  /** Service fee in SOL after the coupon discount (equals the base fee when no coupon) */
  feeSOL: number
  /**
   * Instructions that tag the transaction with the coupon (empty when no coupon), for every discount
   * including 100%:
   * - the `coupon:<hmac>` memo, which the usage counter requires, and
   * - a 0-lamport transfer from the payer to the coupon's marker address
   *   ({@link deriveCouponMarkerAddress}), which puts the transaction in the marker's signature
   *   history — the only history the usage counter scans.
   *
   * Add them to exactly one transaction per user action (the first one for multi-transaction tools).
   */
  couponInstructions: TransactionInstruction[]
}

/** A published coupon that still has uses left. */
export interface AvailableDiscountCoupon {
  code: string
  /** Published discount, clamped to 0..100 */
  discountPercentage: number
  /** Opaque memo tag (`coupon:<hmac>`) that marks transactions using this coupon */
  memoText: string
  /** Per-coupon marker address every transaction using the coupon references (index key only) */
  markerAddress: PublicKey
}

/** Coupon HMAC secret (`COUPON_MEMO_SECRET`); throws when it is not configured. */
const getCouponSecret = (): string => {
  const { couponMemoSecret } = getServerConfig()

  if (!couponMemoSecret) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Coupon memo secret is not configured', 500)
  }

  return couponMemoSecret
}

/**
 * Builds the on-chain memo text that tags a transaction with the coupon used.
 * The memo carries an HMAC of the coupon code instead of the code itself,
 * so on-chain observers cannot read or brute-force the code.
 *
 * @param code - Coupon code.
 * @returns Memo text in the `coupon:<hmac>` format (opaque tag, no plaintext code).
 */
export const buildCouponMemoText = (code: string): string => {
  const digest = createHmac('sha256', getCouponSecret()).update(code).digest('hex').slice(0, 16)
  return `coupon:${digest}`
}

/**
 * Derives the coupon's MARKER address: a deterministic public key that serves only as an index key.
 *
 * Every transaction using the coupon carries a 0-lamport System transfer to this address, so the
 * coupon's uses are found by scanning the marker's own `getSignaturesForAddress` history instead of
 * the shared fee wallet's — traffic (or spam) elsewhere cannot push a coupon's uses out of reach,
 * and spam aimed at one marker only affects that coupon.
 *
 * The address is `HMAC-SHA256(COUPON_MEMO_SECRET, 'cloakforge:coupon-marker:v1:' + code)`, so it
 * cannot be computed from the code alone and is unrelated to the memo tag. Rotating the secret
 * changes every marker (and memo tag) and therefore restarts every coupon's count.
 *
 * Nobody holds a private key for it, and whether the 32 bytes happen to be a valid ed25519 point
 * (on-curve, about half of all values) or not (off-curve, like a PDA) does not matter:
 * - the destination of a System transfer never signs, and any 32 bytes are a valid destination;
 * - 0 lamports leave the account unfunded, so it is never created and never charged rent
 *   (rent state stays `Uninitialized`, an allowed transition);
 * - for an on-curve value, recovering a private key means solving a discrete log for a
 *   pseudo-random point (infeasible), and a key holder could only add transactions to the marker's
 *   history — which anyone can already do by referencing the address.
 *
 * @param code - Coupon code (the published `name` of the coupon entry).
 * @returns The coupon's marker public key.
 * @throws AppError when the coupon secret is not configured.
 */
export const deriveCouponMarkerAddress = (code: string): PublicKey =>
  new PublicKey(createHmac('sha256', getCouponSecret()).update(`${COUPON_MARKER_DOMAIN}${code}`).digest())

/** Clamps a Contentful discount percentage to 0..100 (non-numeric → 0). */
const clampDiscountPercentage = (value: number): number => (Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0)

/** Non-negative integer, or 0 for anything that is not a finite number. */
const toCount = (value: number): number => (Number.isFinite(value) ? Math.max(Math.floor(value), 0) : 0)

const serviceUnavailable = (): AppError => new AppError('SERVICE_UNAVAILABLE', COUPON_SERVICE_UNAVAILABLE_MESSAGE, 503)

// ---------------------------------------------------------------------------
// On-chain usage counter
// ---------------------------------------------------------------------------

/** Outcome of one marker scan: a count, or the page cap was reached before the window ended. */
type CouponUsageScan = { status: 'counted'; count: number } | { status: 'scan-limit' }

interface CouponUsageCacheEntry {
  expiresAt: number
  /** Shared by concurrent lookups, so a cold cache triggers one scan, not one per request */
  scan: Promise<CouponUsageScan>
}

/**
 * Per-instance cache of marker scans, keyed by marker + memo tag + window + cap.
 *
 * Counts AND scan-limit failures are kept for {@link COUPON_USAGE_CACHE_TTL_MS}, so a coupon that
 * cannot be verified costs at most one 10-page scan per TTL instead of one per request; only
 * transient RPC errors are dropped immediately (the next request retries).
 *
 * Accepted over-use window: within the TTL (and while a transaction is still unconfirmed)
 * concurrent builds all see the same count, so a coupon with N uses left can be applied to a few
 * more than N transactions that confirm close together. Serverless instances do not share this
 * cache, which can only make a count fresher, never staler. This is the price of not writing to
 * Contentful; it never lets a free build request consume a use.
 */
const couponUsageCache = new Map<string, CouponUsageCacheEntry>()

/** Clears the usage cache (tests only). */
export const clearCouponUsageCache = (): void => {
  couponUsageCache.clear()
}

const pruneExpiredUsage = (now: number): void => {
  for (const [key, entry] of couponUsageCache) {
    if (entry.expiresAt <= now) {
      couponUsageCache.delete(key)
    }
  }
}

/**
 * Scans the coupon marker's signature history (newest first) and counts confirmed, successful
 * transactions whose memo contains `memoTag`.
 *
 * - Pages of {@link COUPON_USAGE_PAGE_SIZE} with the `before` cursor; stops at an empty page,
 *   at the first signature older than `sinceUnixSeconds`, or as soon as `stopAt` uses are counted.
 * - `memo` in the RPC response is every memo of the transaction formatted as `[<len>] <text>`
 *   and joined with `; ` (Agave `extract_and_fmt_memos`), so a substring match is used.
 * - Failed transactions (`err !== null`) and transfers to the marker without the memo never count.
 *
 * @returns The count, or `scan-limit` when {@link COUPON_USAGE_MAX_PAGES} pages did not reach the window start.
 * @throws When the RPC fails (transient).
 */
const scanConfirmedCouponUses = async (
  marker: PublicKey,
  memoTag: string,
  sinceUnixSeconds: number,
  stopAt: number
): Promise<CouponUsageScan> => {
  const { rpcPrivateEndpoint } = getServerConfig()
  const { legacyConnection } = createConnectionPair(rpcPrivateEndpoint)

  let count = 0
  let before: string | undefined

  for (let page = 0; page < COUPON_USAGE_MAX_PAGES; page++) {
    const signatures = await legacyConnection.getSignaturesForAddress(marker, { limit: COUPON_USAGE_PAGE_SIZE, before }, 'confirmed')

    if (signatures.length === 0) {
      return { status: 'counted', count }
    }

    for (const signature of signatures) {
      if (signature.blockTime != null && signature.blockTime < sinceUnixSeconds) {
        return { status: 'counted', count }
      }

      if (signature.err === null && signature.memo?.includes(memoTag)) {
        count++
        if (count >= stopAt) {
          return { status: 'counted', count }
        }
      }
    }

    // A short page is the end of the marker's history — no need for another round trip
    if (signatures.length < COUPON_USAGE_PAGE_SIZE) {
      return { status: 'counted', count }
    }

    before = signatures[signatures.length - 1].signature
  }

  logger.error('Coupon usage scan hit the page cap before reaching the counting window start', undefined, {
    marker: marker.toBase58(),
    pages: COUPON_USAGE_MAX_PAGES,
    sinceUnixSeconds,
  })
  return { status: 'scan-limit' }
}

export interface CouponUsageQuery {
  /** The coupon's marker address (see {@link deriveCouponMarkerAddress}) */
  marker: PublicKey
  /** The coupon's memo tag (see {@link buildCouponMemoText}) */
  memoTag: string
  /**
   * Start of the counting window (ISO 8601): the coupon entry's publish time (`sys.updatedAt`).
   * Uses before it are not counted; an unparsable value counts the marker's whole history.
   */
  countFrom: string
  /** Stop counting once this many uses are found (the coupon's cap) */
  stopAt: number
}

/**
 * Counts CONFIRMED uses of a coupon: successful transactions in the coupon marker's history that
 * carry the coupon's memo tag, since `countFrom`. Cached (single-flight) for
 * {@link COUPON_USAGE_CACHE_TTL_MS} per marker, window and cap.
 *
 * @param query - Marker, memo tag, window start and cap.
 * @returns Number of confirmed uses, capped at `stopAt`.
 * @throws AppError 503 when usage cannot be verified (RPC failure, or the scan limit was reached).
 */
export async function countConfirmedCouponUses({ marker, memoTag, countFrom, stopAt }: CouponUsageQuery): Promise<number> {
  // An unparsable window start counts the marker's whole history (bounded by the cap and page limit)
  const countFromMs = Date.parse(countFrom)
  const sinceUnixSeconds = Number.isFinite(countFromMs) ? Math.floor(countFromMs / 1000) - PUBLISHED_AT_SKEW_SECONDS : 0

  const cacheKey = `${marker.toBase58()}|${memoTag}|${sinceUnixSeconds}|${stopAt}`
  const now = Date.now()
  let entry = couponUsageCache.get(cacheKey)

  if (!entry || entry.expiresAt <= now) {
    pruneExpiredUsage(now)

    const scan: Promise<CouponUsageScan> = scanConfirmedCouponUses(marker, memoTag, sinceUnixSeconds, stopAt).then(
      (result) => {
        // Keep the result (a count or a scan-limit failure) for a full TTL from when it is known
        const current = couponUsageCache.get(cacheKey)
        if (current?.scan === scan) {
          current.expiresAt = Date.now() + COUPON_USAGE_CACHE_TTL_MS
        }
        return result
      },
      (error: unknown) => {
        // Transient RPC failure: never cached (but leave a newer entry for the same key alone)
        if (couponUsageCache.get(cacheKey)?.scan === scan) {
          couponUsageCache.delete(cacheKey)
        }
        logger.error('Coupon usage scan failed — rejecting the discounted request', error, { marker: marker.toBase58() })
        throw serviceUnavailable()
      }
    )

    entry = { expiresAt: now + COUPON_USAGE_CACHE_TTL_MS, scan }
    couponUsageCache.set(cacheKey, entry)
  }

  const result = await entry.scan
  if (result.status === 'scan-limit') {
    throw serviceUnavailable()
  }
  return result.count
}

// ---------------------------------------------------------------------------
// Coupon availability + fee discount
// ---------------------------------------------------------------------------

/**
 * Looks up a coupon and checks that it still has uses left.
 *
 * - Published data only (Delivery API): drafts never change the discount or the limit.
 * - Limit: `remainingUsage` is the number of uses still available WHEN THE ENTRY WAS LAST PUBLISHED.
 *   Uses = confirmed on-chain transactions referencing the coupon's marker and carrying its memo
 *   ({@link countConfirmedCouponUses}) since that publish (`sys.updatedAt`, the Delivery API's
 *   latest publish time). The coupon is available while uses < `remainingUsage`.
 * - Editors: re-publishing the entry (for ANY change) restarts the count from the new publish time,
 *   so set `remainingUsage` to the uses that should remain from then on — leaving it unchanged
 *   grants those uses again.
 * - `noUsageLimit` coupons skip counting.
 *
 * Builds are free and unsigned, so nothing is counted when a transaction is built: a failed,
 * rejected or abandoned run does not consume a use, and nobody can exhaust a coupon without
 * landing real transactions. A client that strips the coupon instructions also strips our only
 * claim to the fee itself (the transaction is client-signed), so the counter is as strong as the fee.
 *
 * @param couponCode - Coupon code from the request.
 * @returns The available coupon, or null when it is unknown, unpublished or exhausted.
 * @throws AppError 503 when availability cannot be verified (Contentful, secret or RPC failure).
 */
export async function getAvailableDiscountCoupon(couponCode: string): Promise<AvailableDiscountCoupon | null> {
  let coupon: DiscountCoupon | null
  try {
    coupon = await getDiscountCoupon(couponCode)
  } catch (error) {
    logger.error('Coupon lookup failed — rejecting the discounted request', error)
    throw serviceUnavailable()
  }

  if (!coupon) {
    return null
  }

  let memoText: string
  let markerAddress: PublicKey
  try {
    memoText = buildCouponMemoText(coupon.code)
    markerAddress = deriveCouponMarkerAddress(coupon.code)
  } catch (error) {
    logger.error('Coupon memo secret is not configured — coupon usage cannot be counted', error)
    throw serviceUnavailable()
  }

  const available: AvailableDiscountCoupon = {
    code: coupon.code,
    discountPercentage: clampDiscountPercentage(coupon.discountPercentage),
    memoText,
    markerAddress,
  }

  if (coupon.noUsageLimit) {
    return available
  }

  const usesLeftAtPublish = toCount(coupon.remainingUsage)
  if (usesLeftAtPublish <= 0) {
    return null
  }

  const usedSincePublish = await countConfirmedCouponUses({
    marker: markerAddress,
    memoTag: memoText,
    countFrom: coupon.updatedAt,
    stopAt: usesLeftAtPublish,
  })
  return usedSincePublish >= usesLeftAtPublish ? null : available
}

/**
 * Applies a discount coupon to a tool's service (base) fee.
 *
 * Nothing is written anywhere: usage is counted from confirmed on-chain transactions that carry
 * the returned instructions (see {@link getAvailableDiscountCoupon}). Unknown or exhausted coupons
 * fail with a generic 400; if availability cannot be verified the request fails closed with 503 —
 * a discount is never applied unverified.
 *
 * @param baseFeeSOL - Service fee in SOL before discount.
 * @param couponCode - Optional coupon code from the request.
 * @param payer - Fee payer (signer); source of the 0-lamport marker transfer.
 * @returns Discounted fee and the coupon instructions to embed in ONE transaction.
 * @throws AppError 400 (generic message) for unusable coupons, 503 when usage cannot be verified.
 */
export async function applyCouponToServiceFee(
  baseFeeSOL: number,
  couponCode: string | undefined,
  payer: PublicKey
): Promise<DiscountedServiceFee> {
  if (!couponCode) {
    return { feeSOL: baseFeeSOL, couponInstructions: [] }
  }

  const coupon = await getAvailableDiscountCoupon(couponCode)

  if (!coupon) {
    throw new AppError('INVALID_INPUT', COUPON_UNAVAILABLE_MESSAGE, 400)
  }

  const feeSOL = coupon.discountPercentage >= 100 ? 0 : baseFeeSOL * (1 - coupon.discountPercentage / 100)

  const couponInstructions: TransactionInstruction[] = [
    new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(coupon.memoText, 'utf8'),
    }),
    // Makes the transaction discoverable in the marker's history. The System Program has no minimum
    // transfer amount (it checks the signer, a data-less source and its balance), and 0 lamports
    // leave the never-funded marker uncreated, so this costs the payer nothing beyond the tx fee.
    SystemProgram.transfer({ fromPubkey: payer, toPubkey: coupon.markerAddress, lamports: 0 }),
  ]

  logger.info('Coupon discount applied to service fee', {
    discountPercentage: coupon.discountPercentage,
    baseFeeSOL,
    feeSOL,
  })

  return { feeSOL, couponInstructions }
}
