import { describe, it, expect } from 'vitest'
import { Keypair, PublicKey } from '@solana/web3.js'
import { AccountState, type TransferFeeConfig } from '@solana/spl-token'
import { mintAccountInfo, mintExtension, type MintExtensionFixture } from '@/__tests__/utils/mintAccountFixtures'
import { decodeMintAccount } from '../getMintAccountInfo'
import { decodeToken2022Extensions, describeTransferFee, listExtensionNames, toOptionalAddress } from '../decodeTokenExtensions'

const MINT = Keypair.generate().publicKey
const AUTHORITY = Keypair.generate().publicKey
const OTHER = Keypair.generate().publicKey

const decode = (extensions: MintExtensionFixture[], epoch: bigint | null = null) =>
  decodeToken2022Extensions(decodeMintAccount(MINT, mintAccountInfo({ extensions })).mint, epoch)

describe('toOptionalAddress', () => {
  it('should treat missing and all-zero keys as unset', () => {
    expect(toOptionalAddress(null)).toBeNull()
    expect(toOptionalAddress(undefined)).toBeNull()
    expect(toOptionalAddress(PublicKey.default)).toBeNull()
    expect(toOptionalAddress(AUTHORITY)).toBe(AUTHORITY.toBase58())
  })
})

describe('listExtensionNames', () => {
  it('should name known extensions in on-chain order and label unknown types', () => {
    const { mint } = decodeMintAccount(
      MINT,
      mintAccountInfo({ extensions: [mintExtension.nonTransferable(), mintExtension.raw(16, 0), mintExtension.raw(250, 4)] })
    )
    expect(listExtensionNames(mint)).toEqual(['NonTransferable', 'ConfidentialTransferFeeConfig', 'Unknown(250)'])
  })
})

describe('describeTransferFee', () => {
  const config = {
    transferFeeConfigAuthority: AUTHORITY,
    withdrawWithheldAuthority: PublicKey.default,
    withheldAmount: BigInt(0),
    olderTransferFee: { epoch: BigInt(0), maximumFee: BigInt(500), transferFeeBasisPoints: 100 },
    newerTransferFee: { epoch: BigInt(700), maximumFee: BigInt(900), transferFeeBasisPoints: 300 },
  } as TransferFeeConfig

  it('should pick the fee in force for the current epoch', () => {
    expect(describeTransferFee(config, BigInt(699))).toMatchObject({
      epochKnown: true,
      inForce: { basisPoints: 100, maximumFeeRaw: '500' },
    })
    expect(describeTransferFee(config, BigInt(700))).toMatchObject({ inForce: { basisPoints: 300, maximumFeeRaw: '900' } })
  })

  it('should report the newer fee as scheduled only before its epoch, and the authority', () => {
    expect(describeTransferFee(config, BigInt(1))).toMatchObject({
      scheduled: { basisPoints: 300, maximumFeeRaw: '900' },
      configAuthority: AUTHORITY.toBase58(),
    })
    expect(describeTransferFee(config, BigInt(700)).scheduled).toBeNull()
    expect(describeTransferFee(config, BigInt(5_000)).scheduled).toBeNull()
  })

  it('should not report an old, higher fee once a lowered fee is in force', () => {
    const lowered = {
      ...config,
      transferFeeConfigAuthority: PublicKey.default,
      olderTransferFee: { epoch: BigInt(0), maximumFee: BigInt(5_000), transferFeeBasisPoints: 1_000 },
      newerTransferFee: { epoch: BigInt(500), maximumFee: BigInt(0), transferFeeBasisPoints: 0 },
    } as TransferFeeConfig
    expect(describeTransferFee(lowered, BigInt(800))).toEqual({
      epochKnown: true,
      inForce: { basisPoints: 0, maximumFeeRaw: '0' },
      scheduled: null,
      configAuthority: null,
    })
  })

  it('should fall back to the largest configured fee without an epoch and schedule nothing', () => {
    expect(describeTransferFee(config, null)).toMatchObject({
      epochKnown: false,
      inForce: { basisPoints: 300, maximumFeeRaw: '900' },
      scheduled: null,
    })
  })
})

describe('decodeToken2022Extensions', () => {
  it('should report no risky extensions for a plain Token-2022 mint', () => {
    expect(decode([mintExtension.metadataPointer(null, MINT)])).toEqual({
      present: ['MetadataPointer'],
      transferFee: null,
      permanentDelegate: null,
      transferHook: null,
      defaultAccountStateFrozen: false,
      pausable: null,
      nonTransferable: false,
      mintCloseAuthority: null,
      confidentialTransfer: false,
      metadataPointer: { authority: null, metadataAddress: MINT.toBase58() },
    })
  })

  it('should decode every safety-relevant extension', () => {
    const info = decode(
      [
        mintExtension.transferFeeConfig({ authority: AUTHORITY, older: { basisPoints: 50 }, newer: { basisPoints: 50 } }),
        mintExtension.permanentDelegate(OTHER),
        mintExtension.transferHook(AUTHORITY, OTHER),
        mintExtension.defaultAccountState(AccountState.Frozen),
        mintExtension.pausable(AUTHORITY, true),
        mintExtension.nonTransferable(),
        mintExtension.mintCloseAuthority(AUTHORITY),
        mintExtension.confidentialTransferMint(),
        mintExtension.metadataPointer(AUTHORITY, OTHER),
      ],
      BigInt(10)
    )

    expect(info.transferFee).toMatchObject({ inForce: { basisPoints: 50 }, configAuthority: AUTHORITY.toBase58() })
    expect(info.permanentDelegate).toBe(OTHER.toBase58())
    expect(info.transferHook).toEqual({ programId: OTHER.toBase58(), authority: AUTHORITY.toBase58() })
    expect(info.defaultAccountStateFrozen).toBe(true)
    expect(info.pausable).toEqual({ authority: AUTHORITY.toBase58(), paused: true })
    expect(info.nonTransferable).toBe(true)
    expect(info.mintCloseAuthority).toBe(AUTHORITY.toBase58())
    expect(info.confidentialTransfer).toBe(true)
    expect(info.metadataPointer).toEqual({ authority: AUTHORITY.toBase58(), metadataAddress: OTHER.toBase58() })
    expect(info.present).toHaveLength(9)
  })

  it('should report revoked authorities as null while keeping the extension listed', () => {
    const info = decode([mintExtension.permanentDelegate(null), mintExtension.defaultAccountState(AccountState.Initialized)])
    expect(info.permanentDelegate).toBeNull()
    expect(info.defaultAccountStateFrozen).toBe(false)
    expect(info.present).toEqual(['PermanentDelegate', 'DefaultAccountState'])
  })
})
