/**
 * Decodes the SPL Token, Token-2022 and Associated Token Account instructions that CloakForge's
 * server builders emit into small, flat shapes the client-side verifier can check.
 *
 * Only instructions a builder actually uses are decoded; every other instruction becomes
 * `{ type: 'unsupported' }` and is rejected by the verifier (fail closed). Data and accounts are
 * parsed with the official program clients' per-instruction parsers (kit codecs for the token
 * metadata interface), which throw on malformed input.
 */

import {
  AccountRole,
  type AccountMeta,
  type Address,
  addDecoderSizePrefix,
  address,
  type Decoder,
  getAddressDecoder,
  getOptionDecoder,
  getStructDecoder,
  getU32Decoder,
  getUtf8Decoder,
  type ReadonlyUint8Array,
  unwrapOption,
} from '@solana/kit'
import type { TransactionInstruction } from '@solana/web3.js'
import {
  BURN_CHECKED_DISCRIMINATOR,
  CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR,
  CREATE_ASSOCIATED_TOKEN_IDEMPOTENT_DISCRIMINATOR,
  FREEZE_ACCOUNT_DISCRIMINATOR,
  INITIALIZE_MINT_DISCRIMINATOR,
  INITIALIZE_MINT2_DISCRIMINATOR,
  MINT_TO_DISCRIMINATOR,
  SET_AUTHORITY_DISCRIMINATOR,
  THAW_ACCOUNT_DISCRIMINATOR,
  TRANSFER_CHECKED_DISCRIMINATOR,
  TRANSFER_DISCRIMINATOR,
  parseBurnCheckedInstruction,
  parseCreateAssociatedTokenIdempotentInstruction,
  parseCreateAssociatedTokenInstruction,
  parseFreezeAccountInstruction,
  parseInitializeMint2Instruction,
  parseInitializeMintInstruction,
  parseMintToInstruction,
  parseSetAuthorityInstruction,
  parseThawAccountInstruction,
  parseTransferCheckedInstruction,
  parseTransferInstruction,
} from '@solana-program/token'
import {
  INITIALIZE_METADATA_POINTER_DISCRIMINATOR,
  INITIALIZE_METADATA_POINTER_METADATA_POINTER_DISCRIMINATOR,
  INITIALIZE_TOKEN_METADATA_DISCRIMINATOR,
  UPDATE_TOKEN_METADATA_FIELD_DISCRIMINATOR,
  UPDATE_TOKEN_METADATA_UPDATE_AUTHORITY_DISCRIMINATOR,
  getTokenMetadataFieldDecoder,
  parseInitializeMetadataPointerInstruction,
  parseSetAuthorityInstruction as parseToken2022SetAuthorityInstruction,
} from '@solana-program/token-2022'
import { TOKEN_2022_PROGRAM_ADDRESS } from './programAddresses'

/** Instruction shape the program-client parsers accept. */
interface ParsableInstruction {
  programAddress: Address
  accounts: AccountMeta[]
  data: ReadonlyUint8Array
}

/** Metadata field written by an UpdateTokenMetadataField instruction (`key` = custom additional field). */
export type TokenMetadataFieldName = 'name' | 'symbol' | 'uri' | 'key'

export type DecodedTokenInstruction = { programAddress: string } & (
  | { type: 'transfer'; source: string; destination: string; authority: string; amount: bigint }
  | { type: 'transferChecked'; source: string; mint: string; destination: string; authority: string; amount: bigint; decimals: number }
  | { type: 'burnChecked'; account: string; mint: string; authority: string; amount: bigint; decimals: number }
  | { type: 'mintTo'; mint: string; token: string; authority: string; amount: bigint }
  | { type: 'freezeAccount' | 'thawAccount'; account: string; mint: string; authority: string }
  | { type: 'setAuthority'; owned: string; authority: string; authorityType: number; newAuthority: string | null }
  | { type: 'initializeMint'; mint: string; decimals: number; mintAuthority: string; freezeAuthority: string | null }
  | { type: 'initializeMetadataPointer'; mint: string; authority: string | null; metadataAddress: string | null }
  | {
      type: 'initializeTokenMetadata'
      metadata: string
      updateAuthority: string
      mint: string
      mintAuthority: string
      name: string
      symbol: string
      uri: string
    }
  | { type: 'updateTokenMetadataField'; metadata: string; updateAuthority: string; field: TokenMetadataFieldName; value: string }
  | { type: 'updateTokenMetadataUpdateAuthority'; metadata: string; updateAuthority: string; newUpdateAuthority: string | null }
  | { type: 'unsupported'; label: string }
)

export type DecodedAssociatedTokenInstruction =
  | {
      type: 'createAssociatedTokenAccount'
      payer: string
      ata: string
      owner: string
      mint: string
      systemProgram: string
      tokenProgram: string
    }
  | { type: 'unsupported'; label: string }

const toAccountRole = (isSigner: boolean, isWritable: boolean): AccountRole => {
  if (isSigner) return isWritable ? AccountRole.WRITABLE_SIGNER : AccountRole.READONLY_SIGNER
  return isWritable ? AccountRole.WRITABLE : AccountRole.READONLY
}

const toParsableInstruction = (instruction: TransactionInstruction): ParsableInstruction => ({
  programAddress: address(instruction.programId.toBase58()),
  accounts: instruction.keys.map((key) => ({ address: address(key.pubkey.toBase58()), role: toAccountRole(key.isSigner, key.isWritable) })),
  data: new Uint8Array(instruction.data),
})

const startsWithBytes = (data: ReadonlyUint8Array, prefix: ReadonlyUint8Array): boolean =>
  data.length >= prefix.length && prefix.every((byte, index) => data[index] === byte)

const METADATA_FIELD_NAMES = { Name: 'name', Symbol: 'symbol', Uri: 'uri', Key: 'key' } as const satisfies Record<
  string,
  TokenMetadataFieldName
>

/**
 * Token metadata interface payloads, decoded after the 8-byte discriminator. The program client's own
 * data decoders cannot be used: they decode the discriminator with an unbounded bytes decoder, which
 * swallows the whole payload (@solana-program/token-2022 0.13).
 */
const TOKEN_METADATA_DISCRIMINATOR_LENGTH = 8
const getSizePrefixedStringDecoder = (): Decoder<string> => addDecoderSizePrefix(getUtf8Decoder(), getU32Decoder())
const initializeTokenMetadataArgsDecoder = getStructDecoder([
  ['name', getSizePrefixedStringDecoder()],
  ['symbol', getSizePrefixedStringDecoder()],
  ['uri', getSizePrefixedStringDecoder()],
])
const updateTokenMetadataFieldArgsDecoder = getStructDecoder([
  ['field', getTokenMetadataFieldDecoder()],
  ['value', getSizePrefixedStringDecoder()],
])
/** OptionalNonZeroPubkey: 32 zero bytes mean "none". */
const optionalNonZeroAddressDecoder = getOptionDecoder(getAddressDecoder(), { prefix: null, noneValue: 'zeroes' })

const getTokenMetadataArgs = (data: ReadonlyUint8Array): ReadonlyUint8Array => data.slice(TOKEN_METADATA_DISCRIMINATOR_LENGTH)

/** Returns the instruction's account addresses, requiring at least `count` of them. */
const requireAccounts = (instruction: ParsableInstruction, count: number): string[] => {
  if (instruction.accounts.length < count) {
    throw new Error(`Expected at least ${String(count)} accounts, got ${String(instruction.accounts.length)}`)
  }
  return instruction.accounts.map((account) => account.address)
}

/** Token-2022-only instructions (metadata pointer + token metadata interface), or null when not one of them. */
const decodeToken2022ExtensionInstruction = (instruction: ParsableInstruction): DecodedTokenInstruction | null => {
  const { data } = instruction
  const programAddress = instruction.programAddress

  if (startsWithBytes(data, INITIALIZE_TOKEN_METADATA_DISCRIMINATOR)) {
    const [metadata, updateAuthority, mint, mintAuthority] = requireAccounts(instruction, 4)
    const args = initializeTokenMetadataArgsDecoder.decode(getTokenMetadataArgs(data))
    return { programAddress, type: 'initializeTokenMetadata', metadata, updateAuthority, mint, mintAuthority, ...args }
  }

  if (startsWithBytes(data, UPDATE_TOKEN_METADATA_FIELD_DISCRIMINATOR)) {
    const [metadata, updateAuthority] = requireAccounts(instruction, 2)
    const args = updateTokenMetadataFieldArgsDecoder.decode(getTokenMetadataArgs(data))
    return {
      programAddress,
      type: 'updateTokenMetadataField',
      metadata,
      updateAuthority,
      field: METADATA_FIELD_NAMES[args.field.__kind],
      value: args.value,
    }
  }

  if (startsWithBytes(data, UPDATE_TOKEN_METADATA_UPDATE_AUTHORITY_DISCRIMINATOR)) {
    const [metadata, updateAuthority] = requireAccounts(instruction, 2)
    const newUpdateAuthority = unwrapOption(optionalNonZeroAddressDecoder.decode(getTokenMetadataArgs(data)))
    return { programAddress, type: 'updateTokenMetadataUpdateAuthority', metadata, updateAuthority, newUpdateAuthority }
  }

  if (data[0] === INITIALIZE_METADATA_POINTER_DISCRIMINATOR && data[1] === INITIALIZE_METADATA_POINTER_METADATA_POINTER_DISCRIMINATOR) {
    const { accounts, data: args } = parseInitializeMetadataPointerInstruction(instruction)
    return {
      programAddress,
      type: 'initializeMetadataPointer',
      mint: accounts.mint.address,
      authority: unwrapOption(args.authority),
      metadataAddress: unwrapOption(args.metadataAddress),
    }
  }

  return null
}

/** Instructions shared by SPL Token and Token-2022 (identical layouts). */
const decodeBaseTokenInstruction = (instruction: ParsableInstruction): DecodedTokenInstruction => {
  const programAddress = instruction.programAddress
  const discriminator = instruction.data[0]

  switch (discriminator) {
    case TRANSFER_DISCRIMINATOR: {
      const { accounts, data } = parseTransferInstruction(instruction)
      return {
        programAddress,
        type: 'transfer',
        source: accounts.source.address,
        destination: accounts.destination.address,
        authority: accounts.authority.address,
        amount: data.amount,
      }
    }
    case TRANSFER_CHECKED_DISCRIMINATOR: {
      const { accounts, data } = parseTransferCheckedInstruction(instruction)
      return {
        programAddress,
        type: 'transferChecked',
        source: accounts.source.address,
        mint: accounts.mint.address,
        destination: accounts.destination.address,
        authority: accounts.authority.address,
        amount: data.amount,
        decimals: data.decimals,
      }
    }
    case BURN_CHECKED_DISCRIMINATOR: {
      const { accounts, data } = parseBurnCheckedInstruction(instruction)
      return {
        programAddress,
        type: 'burnChecked',
        account: accounts.account.address,
        mint: accounts.mint.address,
        authority: accounts.authority.address,
        amount: data.amount,
        decimals: data.decimals,
      }
    }
    case MINT_TO_DISCRIMINATOR: {
      const { accounts, data } = parseMintToInstruction(instruction)
      return {
        programAddress,
        type: 'mintTo',
        mint: accounts.mint.address,
        token: accounts.token.address,
        authority: accounts.mintAuthority.address,
        amount: data.amount,
      }
    }
    case FREEZE_ACCOUNT_DISCRIMINATOR:
    case THAW_ACCOUNT_DISCRIMINATOR: {
      const { accounts } =
        discriminator === FREEZE_ACCOUNT_DISCRIMINATOR
          ? parseFreezeAccountInstruction(instruction)
          : parseThawAccountInstruction(instruction)
      return {
        programAddress,
        type: discriminator === FREEZE_ACCOUNT_DISCRIMINATOR ? 'freezeAccount' : 'thawAccount',
        account: accounts.account.address,
        mint: accounts.mint.address,
        authority: accounts.owner.address,
      }
    }
    case SET_AUTHORITY_DISCRIMINATOR: {
      // Token-2022 adds authority types (e.g. MetadataPointer) the classic Token codec rejects
      const { accounts, data } =
        programAddress === TOKEN_2022_PROGRAM_ADDRESS
          ? parseToken2022SetAuthorityInstruction(instruction)
          : parseSetAuthorityInstruction(instruction)
      return {
        programAddress,
        type: 'setAuthority',
        owned: accounts.owned.address,
        authority: accounts.owner.address,
        authorityType: data.authorityType,
        newAuthority: unwrapOption(data.newAuthority),
      }
    }
    case INITIALIZE_MINT_DISCRIMINATOR:
    case INITIALIZE_MINT2_DISCRIMINATOR: {
      const { accounts, data } =
        discriminator === INITIALIZE_MINT_DISCRIMINATOR
          ? parseInitializeMintInstruction(instruction)
          : parseInitializeMint2Instruction(instruction)
      return {
        programAddress,
        type: 'initializeMint',
        mint: accounts.mint.address,
        decimals: data.decimals,
        mintAuthority: data.mintAuthority,
        freezeAuthority: unwrapOption(data.freezeAuthority),
      }
    }
    default:
      return { programAddress, type: 'unsupported', label: `token instruction #${String(discriminator)}` }
  }
}

/**
 * Decodes an SPL Token or Token-2022 instruction.
 *
 * @param instruction - Instruction whose program is SPL Token or Token-2022.
 * @returns The decoded instruction (`unsupported` for anything the builders never emit).
 * @throws Error when a supported instruction is malformed (too few accounts, truncated data).
 */
export function decodeTokenInstruction(instruction: TransactionInstruction): DecodedTokenInstruction {
  const parsable = toParsableInstruction(instruction)

  if (parsable.programAddress === TOKEN_2022_PROGRAM_ADDRESS) {
    const extensionInstruction = decodeToken2022ExtensionInstruction(parsable)
    if (extensionInstruction) return extensionInstruction
  }

  return decodeBaseTokenInstruction(parsable)
}

/**
 * Decodes an Associated Token Account program instruction (Create / CreateIdempotent only).
 *
 * @param instruction - Instruction whose program is the Associated Token Account program.
 * @returns The decoded instruction (`unsupported` for RecoverNested or unknown data).
 * @throws Error when a Create instruction is malformed.
 */
export function decodeAssociatedTokenInstruction(instruction: TransactionInstruction): DecodedAssociatedTokenInstruction {
  const parsable = toParsableInstruction(instruction)
  // A Create instruction may carry empty data (older builders): same accounts as discriminator 0
  const discriminator = parsable.data.length === 0 ? CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR : parsable.data[0]

  if (discriminator !== CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR && discriminator !== CREATE_ASSOCIATED_TOKEN_IDEMPOTENT_DISCRIMINATOR) {
    return { type: 'unsupported', label: `associated token instruction #${String(discriminator)}` }
  }

  const { accounts } =
    discriminator === CREATE_ASSOCIATED_TOKEN_IDEMPOTENT_DISCRIMINATOR
      ? parseCreateAssociatedTokenIdempotentInstruction(parsable)
      : parseCreateAssociatedTokenInstruction({ ...parsable, data: new Uint8Array([CREATE_ASSOCIATED_TOKEN_DISCRIMINATOR]) })

  return {
    type: 'createAssociatedTokenAccount',
    payer: accounts.payer.address,
    ata: accounts.ata.address,
    owner: accounts.owner.address,
    mint: accounts.mint.address,
    systemProgram: accounts.systemProgram.address,
    tokenProgram: accounts.tokenProgram.address,
  }
}
