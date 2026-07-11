// Type declarations for bn.js module
declare module 'bn.js' {
  export default class BN {
    constructor(number: string | number | number[] | Uint8Array | Buffer | BN, base?: number | 'hex', endian?: 'le' | 'be')

    toString(base?: number | 'hex', length?: number): string
    toNumber(): number
    toArray(endian?: 'le' | 'be', length?: number): number[]
    toBuffer(endian?: 'le' | 'be', length?: number): Buffer

    add(b: BN): BN
    sub(b: BN): BN
    mul(b: BN): BN
    div(b: BN): BN
    mod(b: BN): BN

    eq(b: BN): boolean
    lt(b: BN): boolean
    lte(b: BN): boolean
    gt(b: BN): boolean
    gte(b: BN): boolean

    isZero(): boolean
    isNeg(): boolean

    clone(): BN

    static isBN(b: unknown): b is BN
  }
}
