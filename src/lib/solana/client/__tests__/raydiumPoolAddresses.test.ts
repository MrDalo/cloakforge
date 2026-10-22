/**
 * Raydium pool address derivation and CLMM price math, checked against the Raydium SDK's own helpers
 * (the server builds the transactions with them) and Raydium's published mainnet configs.
 */

import { describe, it, expect } from 'vitest'
import { Keypair, PublicKey } from '@solana/web3.js'
import { NATIVE_MINT } from '@solana/spl-token'
import Decimal from 'decimal.js'
import { getCpmmPdaPoolId, getPdaPoolId, SqrtPriceMath, TickMath } from '@raydium-io/raydium-sdk-v2'
import { RAYDIUM_CLMM_PROGRAM_ADDRESS, RAYDIUM_CPMM_PROGRAM_ADDRESS } from '../programAddresses'
import { deriveClmmPoolAddresses, deriveCpmmPoolAddresses, deriveRaydiumPoolAddress, sortMintPair } from '../raydiumPoolAddresses'
import { expectedSqrtPriceX64, expectedTicks, isExpectedSqrtPrice } from '../raydiumPriceMath'

const CPMM_PROGRAM = new PublicKey(RAYDIUM_CPMM_PROGRAM_ADDRESS)
const CLMM_PROGRAM = new PublicKey(RAYDIUM_CLMM_PROGRAM_ADDRESS)
const USDC = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')

describe('deriveRaydiumPoolAddress', () => {
  it('should pin the config of each fee tier to Raydium’s mainnet configs', () => {
    const tokenA = USDC.toBase58()
    const tokenB = NATIVE_MINT.toBase58()

    expect(deriveCpmmPoolAddresses('0.25', tokenA, tokenB)?.config).toBe('D4FPEruKEHrG5TenZ2mpDGEfu1iUvTiqBxvpU8HLBvC2')
    expect(deriveCpmmPoolAddresses('1.00', tokenA, tokenB)?.config).toBe('G95xxie3XbkCqtE39GgQ9Ggc7xBC8Uceve7HFDEFApkc')
    expect(deriveClmmPoolAddresses('0.01', tokenA, tokenB)).toMatchObject({
      config: '9iFER3bpjf1PTTCQCfTRu17EJgvsxo9pVyA9QWwEuX4x',
      tickSpacing: 1,
    })
    expect(deriveClmmPoolAddresses('0.05', tokenA, tokenB)).toMatchObject({
      config: '3XCQJQryqpDvvZBfGxR7CLAw5dpGJ9aa7kt1jRLdyxuZ',
      tickSpacing: 1,
    })
    expect(deriveClmmPoolAddresses('0.25', tokenA, tokenB)).toMatchObject({
      config: 'E64NGkDLLCdQ2yFNPcavaKptrEgmiQaNykUuLC1Qgwyp',
      tickSpacing: 60,
    })
    expect(deriveClmmPoolAddresses('1.00', tokenA, tokenB)).toMatchObject({
      config: 'A1BBtTYJd4i3xU8D6Tc2FzU6ZN4oXZWXKZnCxwbHXr8x',
      tickSpacing: 120,
    })
  })

  it.each([false, true])('should derive the SDK’s pool ids whatever the order the user passes the tokens in (swapped: %s)', (swapped) => {
    const other = Keypair.generate().publicKey
    const [tokenA, tokenB] = swapped ? [NATIVE_MINT, other] : [other, NATIVE_MINT]
    const { mint0, mint1 } = sortMintPair(tokenA.toBase58(), tokenB.toBase58())
    const [first, second] = [new PublicKey(mint0), new PublicKey(mint1)]
    const cpmm = deriveCpmmPoolAddresses('0.25', tokenA.toBase58(), tokenB.toBase58())
    const clmm = deriveClmmPoolAddresses('0.25', tokenA.toBase58(), tokenB.toBase58())

    expect(Buffer.compare(first.toBuffer(), second.toBuffer())).toBeLessThan(0)
    expect(cpmm?.pool).toBe(getCpmmPdaPoolId(CPMM_PROGRAM, new PublicKey(cpmm?.config ?? ''), first, second).publicKey.toBase58())
    expect(clmm.pool).toBe(getPdaPoolId(CLMM_PROGRAM, new PublicKey(clmm.config), first, second).publicKey.toBase58())
    expect(deriveRaydiumPoolAddress({ poolType: 'CLMM', feeTier: '0.25', tokenA: tokenA.toBase58(), tokenB: tokenB.toBase58() })).toBe(
      clmm.pool
    )
    expect(deriveRaydiumPoolAddress({ poolType: 'CPMM', feeTier: '0.25', tokenA: tokenA.toBase58(), tokenB: tokenB.toBase58() })).toBe(
      cpmm?.pool
    )
  })

  it('should give the same pool for the pair in either order, and another pool for another fee tier or pool type', () => {
    const [a, b] = [USDC.toBase58(), NATIVE_MINT.toBase58()]
    const pool = deriveRaydiumPoolAddress({ poolType: 'CLMM', feeTier: '0.25', tokenA: a, tokenB: b })

    expect(deriveRaydiumPoolAddress({ poolType: 'CLMM', feeTier: '0.25', tokenA: b, tokenB: a })).toBe(pool)
    expect(deriveRaydiumPoolAddress({ poolType: 'CLMM', feeTier: '1.00', tokenA: a, tokenB: b })).not.toBe(pool)
    expect(deriveRaydiumPoolAddress({ poolType: 'CPMM', feeTier: '0.25', tokenA: a, tokenB: b })).not.toBe(pool)
  })

  it('should refuse a fee tier Raydium does not offer for CPMM pools', () => {
    expect(() =>
      deriveRaydiumPoolAddress({ poolType: 'CPMM', feeTier: '0.05', tokenA: USDC.toBase58(), tokenB: NATIVE_MINT.toBase58() })
    ).toThrow(/does not offer a 0.05% fee tier/)
  })
})

describe('CLMM price math', () => {
  const cases = [
    { price: '0.000001', decimals0: 6, decimals1: 9 },
    { price: '1000', decimals0: 9, decimals1: 6 },
    { price: '1.00', decimals0: 6, decimals1: 6 },
    { price: '123.456789', decimals0: 9, decimals1: 6 },
    { price: '0.0000005', decimals0: 6, decimals1: 9 },
  ]

  it.each(cases)('should compute the SDK’s sqrt price for $price ($decimals0/$decimals1 decimals)', ({ price, decimals0, decimals1 }) => {
    const sdk = BigInt(SqrtPriceMath.priceToSqrtPriceX64(new Decimal(price), decimals0, decimals1).toString())
    const inverted = BigInt(SqrtPriceMath.priceToSqrtPriceX64(new Decimal(1).div(price), decimals1, decimals0).toString())

    expect(expectedSqrtPriceX64(price, false, decimals0, decimals1)).toBe(sdk)
    // The user's price is token B per token A; swapped means Raydium's mint0 is the user's token B
    expect(expectedSqrtPriceX64(price, true, decimals1, decimals0)).toBe(inverted)
  })

  it.each(cases)('should accept the SDK’s tick for $price, and only ticks near it', ({ price, decimals0, decimals1 }) => {
    for (const tickSpacing of [1, 10, 60, 120]) {
      const sdkTick = TickMath.getTickWithPriceAndTickspacing(new Decimal(price), tickSpacing, decimals0, decimals1)
      const accepted = expectedTicks(price, false, tickSpacing, decimals0, decimals1)

      expect(accepted.has(sdkTick)).toBe(true)
      expect(accepted.has(sdkTick + 2 * tickSpacing)).toBe(false)
      expect(accepted.has(sdkTick - 2 * tickSpacing)).toBe(false)
    }
  })

  it('should tell a manipulated sqrt price from the expected one', () => {
    const expected = expectedSqrtPriceX64('1.5', false, 6, 6) ?? BigInt(0)

    expect(isExpectedSqrtPrice(expected, expected)).toBe(true)
    expect(isExpectedSqrtPrice(expected + BigInt(1000), expected)).toBe(true)
    expect(isExpectedSqrtPrice(expected * BigInt(2), expected)).toBe(false)
    expect(isExpectedSqrtPrice(expected + expected / BigInt(10_000_000), expected)).toBe(false)
  })

  it('should not compute anything for a price that is not a positive number', () => {
    for (const price of ['', 'abc', '0', '-1', 'Infinity']) {
      expect(expectedSqrtPriceX64(price, false, 6, 6)).toBeNull()
      expect(expectedTicks(price, false, 60, 6, 6).size).toBe(0)
    }
  })
})
