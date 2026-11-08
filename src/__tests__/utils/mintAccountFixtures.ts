/**
 * Test fixtures: raw SPL Token / Token-2022 mint and token accounts.
 *
 * Accounts are encoded with the @solana/spl-token layouts (and @solana/spl-token-metadata for the
 * TokenMetadata extension), so production decoders read them exactly as they read on-chain data.
 */

import { type AccountInfo, PublicKey } from '@solana/web3.js'
import {
  ACCOUNT_SIZE,
  AccountLayout,
  AccountState,
  AccountType,
  DefaultAccountStateLayout,
  ExtensionType,
  MetadataPointerLayout,
  MintCloseAuthorityLayout,
  MintLayout,
  MINT_SIZE,
  PausableConfigLayout,
  PermanentDelegateLayout,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TransferFeeConfigLayout,
  TransferHookLayout,
} from '@solana/spl-token'
import { pack as packTokenMetadata } from '@solana/spl-token-metadata'

/** One TLV entry of a Token-2022 mint. */
export interface MintExtensionFixture {
  type: number
  data: Buffer
}

export interface MintFixtureOptions {
  decimals?: number
  supply?: bigint
  /** null = revoked */
  mintAuthority?: PublicKey | null
  /** null = revoked */
  freezeAuthority?: PublicKey | null
  /** Token-2022 extensions; any extension (or `program: 'token-2022'`) makes it a Token-2022 mint. */
  extensions?: MintExtensionFixture[]
  program?: 'spl-token' | 'token-2022'
}

/** The "none" value of an OptionalNonZeroPubkey (all zero bytes). */
const orNone = (key: PublicKey | null | undefined): PublicKey => key ?? PublicKey.default

const encodeLayout = <T>(layout: { span: number; encode: (value: T, buffer: Buffer) => number }, value: T): Buffer => {
  const data = Buffer.alloc(layout.span)
  layout.encode(value, data)
  return data
}

/** Encodes the 82-byte base mint state. */
function encodeBaseMint({
  decimals = 6,
  supply = BigInt(1_000_000_000),
  mintAuthority = null,
  freezeAuthority = null,
}: MintFixtureOptions): Buffer {
  return encodeLayout(MintLayout, {
    mintAuthorityOption: mintAuthority ? 1 : 0,
    mintAuthority: orNone(mintAuthority),
    supply,
    decimals,
    isInitialized: true,
    freezeAuthorityOption: freezeAuthority ? 1 : 0,
    freezeAuthority: orNone(freezeAuthority),
  })
}

/** Encodes TLV entries: u16 type, u16 length, data. */
function encodeTlv(extensions: MintExtensionFixture[]): Buffer {
  return Buffer.concat(
    extensions.map(({ type, data }) => {
      const header = Buffer.alloc(4)
      header.writeUInt16LE(type, 0)
      header.writeUInt16LE(data.length, 2)
      return Buffer.concat([header, data])
    })
  )
}

/**
 * Builds a mint account as returned by `getAccountInfo`.
 *
 * @param options - Mint state and optional Token-2022 extensions.
 * @returns Account owned by the SPL Token or Token-2022 program.
 */
export function mintAccountInfo(options: MintFixtureOptions = {}): AccountInfo<Buffer> {
  const extensions = options.extensions ?? []
  const isToken2022 = options.program === 'token-2022' || extensions.length > 0
  const base = encodeBaseMint(options)
  // Token-2022 extension data starts after the base account size (165) plus a 1-byte account type
  const data =
    extensions.length > 0
      ? Buffer.concat([base, Buffer.alloc(ACCOUNT_SIZE - MINT_SIZE), Buffer.from([AccountType.Mint]), encodeTlv(extensions)])
      : base
  return {
    data,
    owner: isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
    lamports: 1_461_600,
    executable: false,
    rentEpoch: 0,
  }
}

/**
 * Builds a token account as returned by `getAccountInfo`.
 *
 * @param mint - Mint of the token account.
 * @param owner - Owner of the token account.
 * @param amount - Raw balance.
 * @param programId - Token program (default SPL Token).
 * @returns Initialized token account.
 */
export function tokenAccountInfo(mint: PublicKey, owner: PublicKey, amount: bigint, programId = TOKEN_PROGRAM_ID): AccountInfo<Buffer> {
  return {
    data: encodeLayout(AccountLayout, {
      mint,
      owner,
      amount,
      delegateOption: 0,
      delegate: PublicKey.default,
      state: AccountState.Initialized,
      isNativeOption: 0,
      isNative: BigInt(0),
      delegatedAmount: BigInt(0),
      closeAuthorityOption: 0,
      closeAuthority: PublicKey.default,
    }),
    owner: programId,
    lamports: 2_039_280,
    executable: false,
    rentEpoch: 0,
  }
}

interface TransferFeeFixture {
  epoch?: bigint
  basisPoints: number
  maximumFee?: bigint
}

/** Token-2022 extension entries, encoded with the spl-token layouts. */
export const mintExtension = {
  metadataPointer: (authority: PublicKey | null, metadataAddress: PublicKey | null): MintExtensionFixture => ({
    type: ExtensionType.MetadataPointer,
    data: encodeLayout(MetadataPointerLayout, { authority: orNone(authority), metadataAddress: orNone(metadataAddress) }),
  }),
  tokenMetadata: (fields: {
    updateAuthority: PublicKey | null
    mint: PublicKey
    name: string
    symbol: string
    uri: string
  }): MintExtensionFixture => ({
    type: ExtensionType.TokenMetadata,
    data: Buffer.from(packTokenMetadata({ ...fields, updateAuthority: fields.updateAuthority ?? undefined, additionalMetadata: [] })),
  }),
  transferFeeConfig: ({
    authority,
    older,
    newer,
  }: {
    authority: PublicKey | null
    older: TransferFeeFixture
    newer: TransferFeeFixture
  }): MintExtensionFixture => {
    const toFee = ({ epoch = BigInt(0), basisPoints, maximumFee = BigInt(1_000_000) }: TransferFeeFixture) => ({
      epoch,
      maximumFee,
      transferFeeBasisPoints: basisPoints,
    })
    return {
      type: ExtensionType.TransferFeeConfig,
      data: encodeLayout(TransferFeeConfigLayout, {
        transferFeeConfigAuthority: orNone(authority),
        withdrawWithheldAuthority: PublicKey.default,
        withheldAmount: BigInt(0),
        olderTransferFee: toFee(older),
        newerTransferFee: toFee(newer),
      }),
    }
  },
  permanentDelegate: (delegate: PublicKey | null): MintExtensionFixture => ({
    type: ExtensionType.PermanentDelegate,
    data: encodeLayout(PermanentDelegateLayout, { delegate: orNone(delegate) }),
  }),
  transferHook: (authority: PublicKey | null, programId: PublicKey | null): MintExtensionFixture => ({
    type: ExtensionType.TransferHook,
    data: encodeLayout(TransferHookLayout, { authority: orNone(authority), programId: orNone(programId) }),
  }),
  defaultAccountState: (state: AccountState): MintExtensionFixture => ({
    type: ExtensionType.DefaultAccountState,
    data: encodeLayout(DefaultAccountStateLayout, { state }),
  }),
  nonTransferable: (): MintExtensionFixture => ({ type: ExtensionType.NonTransferable, data: Buffer.alloc(0) }),
  mintCloseAuthority: (closeAuthority: PublicKey | null): MintExtensionFixture => ({
    type: ExtensionType.MintCloseAuthority,
    data: encodeLayout(MintCloseAuthorityLayout, { closeAuthority: orNone(closeAuthority) }),
  }),
  pausable: (authority: PublicKey | null, paused: boolean): MintExtensionFixture => ({
    type: ExtensionType.PausableConfig,
    data: encodeLayout(PausableConfigLayout, { authority: orNone(authority), paused }),
  }),
  /** ConfidentialTransferMint: authority (32) + auto-approve flag (1) + auditor ElGamal key (32). */
  confidentialTransferMint: (): MintExtensionFixture => ({ type: ExtensionType.ConfidentialTransferMint, data: Buffer.alloc(65) }),
  /** Any extension type with zeroed data of the given length (e.g. one the auditor does not analyze). */
  raw: (type: number, length: number): MintExtensionFixture => ({ type, data: Buffer.alloc(length) }),
}

const borshString = (value: string, padTo = 0): Buffer => {
  const bytes = Buffer.alloc(Math.max(Buffer.byteLength(value), padTo))
  bytes.write(value, 'utf8')
  const length = Buffer.alloc(4)
  length.writeUInt32LE(bytes.length, 0)
  return Buffer.concat([length, bytes])
}

const u32 = (value: number): Buffer => {
  const data = Buffer.alloc(4)
  data.writeUInt32LE(value, 0)
  return data
}

export interface MetaplexMetadataFixture {
  updateAuthority: PublicKey
  mint: PublicKey
  /** Account discriminator; 4 = MetadataV1 */
  key?: number
  name?: string
  symbol?: string
  uri?: string
  creators?: PublicKey[] | null
  /** Encoded creator count, when it should differ from `creators.length` */
  creatorCount?: number
  isMutable?: boolean
}

/**
 * Encodes a Metaplex MetadataV1 account (up to `is_mutable`, plus trailing bytes) the way Metaplex
 * stores it: strings padded with NUL bytes to 32 / 10 / 200 bytes.
 *
 * @returns Raw account data.
 */
export function metaplexMetadataData({
  updateAuthority,
  mint,
  key = 4,
  name = 'Test Token',
  symbol = 'TST',
  uri = 'https://example.com/m.json',
  creators = null,
  creatorCount,
  isMutable = true,
}: MetaplexMetadataFixture): Buffer {
  const creatorsData =
    creators === null
      ? Buffer.from([0])
      : Buffer.concat([
          Buffer.from([1]),
          u32(creatorCount ?? creators.length),
          ...creators.map((creator) => Buffer.concat([creator.toBuffer(), Buffer.from([1, 100])])),
        ])
  return Buffer.concat([
    Buffer.from([key]),
    updateAuthority.toBuffer(),
    mint.toBuffer(),
    borshString(name, 32),
    borshString(symbol, 10),
    borshString(uri, 200),
    Buffer.from([0xf4, 0x01]), // seller fee basis points
    creatorsData,
    Buffer.from([0]), // primary sale happened
    Buffer.from([isMutable ? 1 : 0]),
    Buffer.alloc(16), // trailing optional fields (not read)
  ])
}
