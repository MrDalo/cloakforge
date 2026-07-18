/**
 * Differential equivalence tests for the spl-token -> kit migration.
 *
 * Unlike the per-file regression suites (which assert against hand-written expected values),
 * these tests build the SAME instruction with the OLD @solana/spl-token / @solana/spl-token-metadata
 * code and the NEW @solana-program/token(-2022) + kitInstructionToWeb3Instruction code, using
 * identical inputs, and assert the two outputs are byte-for-byte identical (programId, every
 * account's pubkey/isSigner/isWritable, and raw instruction data). This is independent of any
 * expectations authored by hand, so it can't share blind spots with the migrated implementation.
 */
import { describe, it, expect } from 'vitest'
import { Keypair, type TransactionInstruction } from '@solana/web3.js'
import {
  createBurnInstruction,
  createFreezeAccountInstruction,
  createThawAccountInstruction,
  createSetAuthorityInstruction,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
  createMintToInstruction,
  createInitializeMintInstruction,
  createInitializeMetadataPointerInstruction,
  AuthorityType as LegacyAuthorityType,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token'
import { createInitializeInstruction, createUpdateFieldInstruction, createUpdateAuthorityInstruction } from '@solana/spl-token-metadata'
import { address, createNoopSigner } from '@solana/kit'
import {
  getBurnInstruction,
  getFreezeAccountInstruction,
  getThawAccountInstruction,
  getSetAuthorityInstruction,
  getTransferInstruction,
  getCreateAssociatedTokenInstruction,
  getCreateAssociatedTokenIdempotentInstruction,
  getMintToInstruction,
  getInitializeMintInstruction,
  AuthorityType,
} from '@solana-program/token'
import {
  getInitializeMetadataPointerInstruction,
  getInitializeTokenMetadataInstruction,
  getUpdateTokenMetadataFieldInstruction,
  getUpdateTokenMetadataUpdateAuthorityInstruction,
} from '@solana-program/token-2022'
import { kitInstructionToWeb3Instruction } from '../../transactions'

const WALLET = Keypair.generate().publicKey
const TOKEN_ACCOUNT = Keypair.generate().publicKey
const MINT = Keypair.generate().publicKey
const DEST_ACCOUNT = Keypair.generate().publicKey
const OTHER_WALLET = Keypair.generate().publicKey
const PAYER_SIGNER = createNoopSigner(address(WALLET.toString()))
const AUTHORITY_SIGNER = createNoopSigner(address(WALLET.toString()))

/** Normalizes a legacy or kit-converted TransactionInstruction for deep-equality comparison. */
const snapshot = (ix: TransactionInstruction) => ({
  programId: ix.programId.toString(),
  keys: ix.keys.map((k) => ({ pubkey: k.pubkey.toString(), isSigner: k.isSigner, isWritable: k.isWritable })),
  data: Buffer.from(ix.data).toString('hex'),
})

describe('kit vs legacy spl-token instruction equivalence', () => {
  it('burn: getBurnInstruction matches createBurnInstruction', () => {
    const legacy = createBurnInstruction(TOKEN_ACCOUNT, MINT, WALLET, BigInt(500_000_000), [], TOKEN_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getBurnInstruction(
        {
          account: address(TOKEN_ACCOUNT.toString()),
          mint: address(MINT.toString()),
          authority: AUTHORITY_SIGNER,
          amount: BigInt(500_000_000),
        },
        { programAddress: address(TOKEN_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('burn (Token-2022): matches when the program address is overridden', () => {
    const legacy = createBurnInstruction(TOKEN_ACCOUNT, MINT, WALLET, BigInt(500_000_000), [], TOKEN_2022_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getBurnInstruction(
        {
          account: address(TOKEN_ACCOUNT.toString()),
          mint: address(MINT.toString()),
          authority: AUTHORITY_SIGNER,
          amount: BigInt(500_000_000),
        },
        { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('freezeAccount: getFreezeAccountInstruction matches createFreezeAccountInstruction', () => {
    const legacy = createFreezeAccountInstruction(TOKEN_ACCOUNT, MINT, WALLET, [], TOKEN_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getFreezeAccountInstruction(
        { account: address(TOKEN_ACCOUNT.toString()), mint: address(MINT.toString()), owner: AUTHORITY_SIGNER },
        { programAddress: address(TOKEN_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('thawAccount: getThawAccountInstruction matches createThawAccountInstruction', () => {
    const legacy = createThawAccountInstruction(TOKEN_ACCOUNT, MINT, WALLET, [], TOKEN_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getThawAccountInstruction(
        { account: address(TOKEN_ACCOUNT.toString()), mint: address(MINT.toString()), owner: AUTHORITY_SIGNER },
        { programAddress: address(TOKEN_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('setAuthority(MintTokens, revoke): getSetAuthorityInstruction matches createSetAuthorityInstruction', () => {
    const legacy = createSetAuthorityInstruction(MINT, WALLET, LegacyAuthorityType.MintTokens, null, [], TOKEN_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getSetAuthorityInstruction(
        { owned: address(MINT.toString()), owner: AUTHORITY_SIGNER, authorityType: AuthorityType.MintTokens, newAuthority: null },
        { programAddress: address(TOKEN_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('setAuthority(FreezeAccount, revoke): matches for the freeze-authority variant', () => {
    const legacy = createSetAuthorityInstruction(MINT, WALLET, LegacyAuthorityType.FreezeAccount, null, [], TOKEN_2022_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getSetAuthorityInstruction(
        { owned: address(MINT.toString()), owner: AUTHORITY_SIGNER, authorityType: AuthorityType.FreezeAccount, newAuthority: null },
        { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('transfer: getTransferInstruction matches createTransferInstruction', () => {
    const legacy = createTransferInstruction(TOKEN_ACCOUNT, DEST_ACCOUNT, WALLET, BigInt(1_000_000), [], TOKEN_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getTransferInstruction(
        {
          source: address(TOKEN_ACCOUNT.toString()),
          destination: address(DEST_ACCOUNT.toString()),
          authority: PAYER_SIGNER,
          amount: BigInt(1_000_000),
        },
        { programAddress: address(TOKEN_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  // KNOWN, INTENTIONAL DIFFERENCE: kit's non-idempotent getCreateAssociatedTokenInstruction encodes
  // an explicit `00` discriminator byte, while legacy @solana/spl-token's non-idempotent
  // createAssociatedTokenAccountInstruction encodes zero-length data. The ATA program accepts both
  // as "Create" (the discriminator byte was added later, for backward compatibility with pre-existing
  // zero-length-data callers), so this is not a functional bug — but rather than depend on that
  // program-level compatibility guarantee, createTokenCreationTransaction.ts uses the *idempotent*
  // kit builder instead (verified byte-identical to legacy below), which sidesteps the question
  // entirely and is safe here since the mint was just created moments earlier in the same transaction.
  it('createAssociatedTokenAccount (non-idempotent): accounts match, but data intentionally differs from legacy (see comment)', () => {
    const legacy = createAssociatedTokenAccountInstruction(WALLET, DEST_ACCOUNT, OTHER_WALLET, MINT, TOKEN_2022_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getCreateAssociatedTokenInstruction({
        payer: PAYER_SIGNER,
        ata: address(DEST_ACCOUNT.toString()),
        owner: address(OTHER_WALLET.toString()),
        mint: address(MINT.toString()),
        tokenProgram: address(TOKEN_2022_PROGRAM_ID.toString()),
      })
    )
    const { data: legacyData, ...legacyRest } = snapshot(legacy)
    const { data: kitData, ...kitRest } = snapshot(kit)
    expect(kitRest).toEqual(legacyRest) // programId + every account's pubkey/isSigner/isWritable match
    expect(legacyData).toBe('') // legacy: zero-length data
    expect(kitData).toBe('00') // kit: explicit discriminator 0 — both mean "Create" on-chain
  })

  it('createAssociatedTokenAccount: production code uses the idempotent variant instead (verified elsewhere), which matches legacy exactly', () => {
    const legacy = createAssociatedTokenAccountIdempotentInstruction(WALLET, DEST_ACCOUNT, OTHER_WALLET, MINT, TOKEN_2022_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getCreateAssociatedTokenIdempotentInstruction({
        payer: PAYER_SIGNER,
        ata: address(DEST_ACCOUNT.toString()),
        owner: address(OTHER_WALLET.toString()),
        mint: address(MINT.toString()),
        tokenProgram: address(TOKEN_2022_PROGRAM_ID.toString()),
      })
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('createAssociatedTokenAccountIdempotent: getCreateAssociatedTokenIdempotentInstruction matches', () => {
    const legacy = createAssociatedTokenAccountIdempotentInstruction(WALLET, DEST_ACCOUNT, OTHER_WALLET, MINT, TOKEN_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getCreateAssociatedTokenIdempotentInstruction({
        payer: PAYER_SIGNER,
        ata: address(DEST_ACCOUNT.toString()),
        owner: address(OTHER_WALLET.toString()),
        mint: address(MINT.toString()),
        tokenProgram: address(TOKEN_PROGRAM_ID.toString()),
      })
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('mintTo: getMintToInstruction matches createMintToInstruction', () => {
    const legacy = createMintToInstruction(MINT, DEST_ACCOUNT, WALLET, BigInt(1_000_000_000), [], TOKEN_2022_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getMintToInstruction(
        {
          mint: address(MINT.toString()),
          token: address(DEST_ACCOUNT.toString()),
          mintAuthority: AUTHORITY_SIGNER,
          amount: BigInt(1_000_000_000),
        },
        { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('initializeMint: getInitializeMintInstruction matches createInitializeMintInstruction', () => {
    const legacy = createInitializeMintInstruction(MINT, 6, WALLET, WALLET, TOKEN_2022_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getInitializeMintInstruction(
        {
          mint: address(MINT.toString()),
          decimals: 6,
          mintAuthority: address(WALLET.toString()),
          freezeAuthority: address(WALLET.toString()),
        },
        { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('initializeMetadataPointer: getInitializeMetadataPointerInstruction matches createInitializeMetadataPointerInstruction', () => {
    const legacy = createInitializeMetadataPointerInstruction(MINT, WALLET, MINT, TOKEN_2022_PROGRAM_ID)
    const kit = kitInstructionToWeb3Instruction(
      getInitializeMetadataPointerInstruction({
        mint: address(MINT.toString()),
        authority: address(WALLET.toString()),
        metadataAddress: address(MINT.toString()),
      })
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('metadata initialize: getInitializeTokenMetadataInstruction (token-2022 pkg) matches createInitializeInstruction (spl-token-metadata pkg)', () => {
    const legacy = createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      mint: MINT,
      metadata: MINT,
      name: 'Test Token',
      symbol: 'TST',
      uri: 'https://example.com/metadata.json',
      mintAuthority: WALLET,
      updateAuthority: WALLET,
    })
    const kit = kitInstructionToWeb3Instruction(
      getInitializeTokenMetadataInstruction(
        {
          metadata: address(MINT.toString()),
          updateAuthority: address(WALLET.toString()),
          mint: address(MINT.toString()),
          mintAuthority: AUTHORITY_SIGNER,
          name: 'Test Token',
          symbol: 'TST',
          uri: 'https://example.com/metadata.json',
        },
        { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('metadata updateAuthority(null): getUpdateTokenMetadataUpdateAuthorityInstruction matches createUpdateAuthorityInstruction', () => {
    const legacy = createUpdateAuthorityInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      metadata: MINT,
      oldAuthority: WALLET,
      newAuthority: null,
    })
    const kit = kitInstructionToWeb3Instruction(
      getUpdateTokenMetadataUpdateAuthorityInstruction(
        { metadata: address(MINT.toString()), updateAuthority: AUTHORITY_SIGNER, newUpdateAuthority: null },
        { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })

  it('metadata updateField (custom key): getUpdateTokenMetadataFieldInstruction matches createUpdateFieldInstruction', () => {
    const legacy = createUpdateFieldInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      metadata: MINT,
      updateAuthority: WALLET,
      field: 'custom_field',
      value: 'custom_value',
    })
    const kit = kitInstructionToWeb3Instruction(
      getUpdateTokenMetadataFieldInstruction(
        {
          metadata: address(MINT.toString()),
          updateAuthority: AUTHORITY_SIGNER,
          field: { __kind: 'Key', fields: ['custom_field'] },
          value: 'custom_value',
        },
        { programAddress: address(TOKEN_2022_PROGRAM_ID.toString()) }
      )
    )
    expect(snapshot(kit)).toEqual(snapshot(legacy))
  })
})
