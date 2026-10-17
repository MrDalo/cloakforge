/**
 * verifyPreparedTransactions against REAL transactions built by the server builders
 * (src/lib/solana/server-side/*), with only RPC, Contentful and coupon lookups mocked, plus
 * malicious variants: extra transfer to an attacker, inflated fee, foreign SetAuthority, unknown
 * program, wrong fee payer, double payment, unexpected token account, excessive priority fee.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js'
import {
  AccountLayout,
  ACCOUNT_SIZE,
  ExtensionType,
  MINT_SIZE,
  MintLayout,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createApproveInstruction,
  getAssociatedTokenAddressSync,
  getMintLen,
} from '@solana/spl-token'
import { address, createNoopSigner } from '@solana/kit'
import { AuthorityType, getSetAuthorityInstruction, getTransferCheckedInstruction } from '@solana-program/token'
import { getUpdateTokenMetadataUpdateAuthorityInstruction } from '@solana-program/token-2022'
import { kitInstructionToWeb3Instruction } from '@/lib/solana'
import { createBurnTokenTransaction } from '@/lib/solana/server-side/createBurnTokenTransaction'
import { createRevokeMintAuthorityTransaction } from '@/lib/solana/server-side/createRevokeMintAuthorityTransaction'
import { createRevokeFreezeAuthorityTransaction } from '@/lib/solana/server-side/createRevokeFreezeAuthorityTransaction'
import { createRevokeMetadataAuthorityTransaction } from '@/lib/solana/server-side/createRevokeMetadataAuthorityTransaction'
import { createUpdateMetadataTransaction } from '@/lib/solana/server-side/createUpdateMetadataTransaction'
import { createTokenCreationTransaction } from '@/lib/solana/server-side/createTokenCreationTransaction'
import { createMultisenderTransaction } from '@/lib/solana/server-side/createMultisenderTransaction'
import { createDonationTransaction } from '@/lib/solana/server-side/createDonationTransaction'
import { createBatchFreezeTransaction } from '@/lib/solana/server-side/createFreezeWalletTransaction'
import { createBatchUnfreezeTransaction } from '@/lib/solana/server-side/createUnfreezeWalletTransaction'
import { verifyPreparedTransactions } from '../verifyPreparedTransactions'
import { solToLamportsCeil } from '../amounts'
import type { ExpectedOperation, PreparedTransactionExpectation } from '../transactionExpectation'

const mocks = vi.hoisted(() => ({
  feeWallet: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  /** Multiplier the mocked coupon applies to the base fee */
  couponFeeMultiplier: 1,
  couponInstructions: [] as unknown[],
  accounts: new Map<string, unknown>(),
  parsedAccounts: new Map<string, unknown>(),
  tokenMetadata: null as unknown,
}))

vi.mock('server-only', () => ({}))

vi.mock('@/lib/config/getServerConfig', () => ({
  default: () => ({ rpcPrivateEndpoint: 'https://rpc.test', feeWalletAddress: mocks.feeWallet }),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

// No Contentful config: every builder charges its hard-coded default fee (DEFAULT_TOOL_BASE_FEES_SOL)
vi.mock('@/lib/contentful/toolConfigCache', () => ({ getCachedToolConfig: async () => null }))

vi.mock('@/lib/solana/server-side/discountedServiceFee', () => ({
  applyCouponToServiceFee: async (baseFeeSOL: number) => ({
    feeSOL: baseFeeSOL * mocks.couponFeeMultiplier,
    couponInstructions: mocks.couponInstructions,
  }),
}))

vi.mock('@solana/spl-token', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@solana/spl-token')>()),
  getTokenMetadata: async () => mocks.tokenMetadata,
}))

const RPC_BLOCKHASH = 'GfVcyD4kkTrj4bKc7WA9sZCin9JDbdT4Zkd3EittNR1W'
const CLIENT_BLOCKHASH = 'EkSnNWid2cvwEVnVx9aBqawnmiCNiDgp3gUdkDPTKN1N'

vi.mock('@/lib/solana', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/solana')>()
  const connection = {
    getLatestBlockhash: async () => ({ blockhash: RPC_BLOCKHASH, lastValidBlockHeight: 1_000 }),
    getAccountInfo: async (key: { toBase58: () => string }) => mocks.accounts.get(key.toBase58()) ?? null,
    getParsedAccountInfo: async (key: { toBase58: () => string }) => ({ value: mocks.parsedAccounts.get(key.toBase58()) ?? null }),
    getBalance: async () => 100 * 1e9,
    getMinimumBalanceForRentExemption: async (length: number) => (length + 128) * 6960,
  }
  return {
    ...actual,
    createConnectionPair: () => ({ legacyConnection: connection, kitRpc: {} }),
    calculateDynamicPriorityFee: async () => 50_000,
  }
})

const WALLET = Keypair.generate().publicKey
const ATTACKER = Keypair.generate().publicKey
const MINT = Keypair.generate().publicKey
const FEE_WALLET = new PublicKey(mocks.feeWallet)

const rent = (length: number): number => (length + 128) * 6960

/** On-chain mint account (MintLayout) owned by `programId`. */
const mintAccount = (options: { decimals: number; programId?: PublicKey; mintAuthority?: PublicKey; freezeAuthority?: PublicKey }) => {
  const data = Buffer.alloc(MINT_SIZE)
  MintLayout.encode(
    {
      mintAuthorityOption: options.mintAuthority ? 1 : 0,
      mintAuthority: options.mintAuthority ?? PublicKey.default,
      supply: BigInt(0),
      decimals: options.decimals,
      isInitialized: true,
      freezeAuthorityOption: options.freezeAuthority ? 1 : 0,
      freezeAuthority: options.freezeAuthority ?? PublicKey.default,
    },
    data
  )
  return { data, owner: options.programId ?? TOKEN_PROGRAM_ID, lamports: rent(MINT_SIZE), executable: false, rentEpoch: 0 }
}

/** On-chain token account (AccountLayout); state 1 = initialized, 2 = frozen. */
const tokenAccount = (mint: PublicKey, owner: PublicKey, state: 1 | 2, programId = TOKEN_PROGRAM_ID) => {
  const data = Buffer.alloc(ACCOUNT_SIZE)
  AccountLayout.encode(
    {
      mint,
      owner,
      amount: BigInt(1_000),
      delegateOption: 0,
      delegate: PublicKey.default,
      state,
      isNativeOption: 0,
      isNative: BigInt(0),
      delegatedAmount: BigInt(0),
      closeAuthorityOption: 0,
      closeAuthority: PublicKey.default,
    },
    data
  )
  return { data, owner: programId, lamports: rent(ACCOUNT_SIZE), executable: false, rentEpoch: 0 }
}

/** What the hook does with a legacy response: deserialize, then set a fresh client blockhash. */
const asClientLegacy = (transaction: Transaction): Transaction => {
  const clientTransaction = Transaction.from(transaction.serialize({ requireAllSignatures: false }))
  clientTransaction.recentBlockhash = CLIENT_BLOCKHASH
  return clientTransaction
}

const asClientVersioned = (transaction: VersionedTransaction): VersionedTransaction =>
  VersionedTransaction.deserialize(transaction.serialize())

/** Rebuilds a v0 transaction with modified instructions and/or fee payer (a tampered server response). */
const tamperVersioned = (
  transaction: VersionedTransaction,
  modify: (instructions: TransactionInstruction[]) => TransactionInstruction[],
  payerKey?: PublicKey
): VersionedTransaction => {
  const decompiled = TransactionMessage.decompile(transaction.message)
  return new VersionedTransaction(
    new TransactionMessage({
      payerKey: payerKey ?? decompiled.payerKey,
      recentBlockhash: decompiled.recentBlockhash,
      instructions: modify(decompiled.instructions),
    }).compileToV0Message()
  )
}

const expectation = (operation: ExpectedOperation, maxServiceFeeSol: number): PreparedTransactionExpectation => ({
  wallet: WALLET.toBase58(),
  feeWallet: FEE_WALLET.toBase58(),
  maxServiceFeeLamports: solToLamportsCeil(maxServiceFeeSol),
  operation,
})

const transferTo = (to: PublicKey, lamports: number): TransactionInstruction =>
  SystemProgram.transfer({ fromPubkey: WALLET, toPubkey: to, lamports })

const reasonsOf = (result: ReturnType<typeof verifyPreparedTransactions>): string[] => (result.ok ? [] : result.reasons)

beforeEach(() => {
  mocks.couponFeeMultiplier = 1
  mocks.couponInstructions = []
  mocks.accounts.clear()
  mocks.parsedAccounts.clear()
  mocks.tokenMetadata = null
})

describe('verifyPreparedTransactions — burn (legacy, SPL Token)', () => {
  const TOKEN_ACCOUNT = getAssociatedTokenAddressSync(MINT, WALLET)
  const burnExpectation = (amount: number | string = 1.5) =>
    expectation({ kind: 'burn', mint: MINT.toBase58(), tokenAccount: TOKEN_ACCOUNT.toBase58(), amount }, 0.009)

  const buildBurn = async (): Promise<Transaction> => {
    mocks.parsedAccounts.set(TOKEN_ACCOUNT.toBase58(), {
      owner: TOKEN_PROGRAM_ID,
      data: {
        program: 'spl-token',
        parsed: {
          info: {
            mint: MINT.toBase58(),
            owner: WALLET.toBase58(),
            tokenAmount: { amount: '5000000000', decimals: 9, uiAmount: 5, uiAmountString: '5' },
            state: 'initialized',
          },
        },
      },
    })
    const { transaction } = await createBurnTokenTransaction({
      walletPublicKey: WALLET,
      tokenAccountAddress: TOKEN_ACCOUNT,
      amount: 1.5,
      mintAddress: MINT,
    })
    return asClientLegacy(transaction)
  }

  it('should accept the server-built burn and report the fee and network costs', async () => {
    const result = verifyPreparedTransactions([await buildBurn()], burnExpectation())

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.summary.serviceFeeLamports).toBe(BigInt(9_000_000))
    expect(result.summary.paymentLamports).toBe(BigInt(0))
    // 5000 base fee + ceil(50_000 µL * 100_000 CU / 1e6) = 5000 lamports priority
    expect(result.summary.networkFeeLamports).toBe(BigInt(10_000))
  })

  it('should accept a coupon memo and its 0-lamport marker transfer with the discounted fee', async () => {
    mocks.couponFeeMultiplier = 0.5
    mocks.couponInstructions = [
      new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'),
        data: Buffer.from('coupon:x'),
      }),
      transferTo(Keypair.generate().publicKey, 0),
    ]

    const result = verifyPreparedTransactions([await buildBurn()], burnExpectation())

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.summary.serviceFeeLamports).toBe(BigInt(4_500_000))
  })

  it('should reject an extra SOL transfer to an attacker', async () => {
    const transaction = await buildBurn()
    transaction.add(transferTo(ATTACKER, 1_000_000_000))

    expect(reasonsOf(verifyPreparedTransactions([transaction], burnExpectation()))).toEqual([
      `The transaction sends 1 SOL to ${ATTACKER.toBase58()}, which is neither the fee wallet nor a recipient you entered`,
    ])
  })

  it('should reject a service fee above the displayed fee', async () => {
    const transaction = await buildBurn()
    transaction.add(transferTo(FEE_WALLET, 50_000_000))

    expect(reasonsOf(verifyPreparedTransactions([transaction], burnExpectation()))).toEqual([
      'The service fee is 0.059 SOL, more than the 0.009 SOL you were shown',
    ])
  })

  it('should reject a burn amount that differs from the form', async () => {
    const result = verifyPreparedTransactions([await buildBurn()], burnExpectation(1))
    expect(reasonsOf(result)).toEqual(['The transaction burns 1.5 tokens instead of 1'])
  })

  it('should reject an instruction for an unknown program', async () => {
    const transaction = await buildBurn()
    const unknownProgram = Keypair.generate().publicKey
    transaction.add(new TransactionInstruction({ keys: [{ pubkey: WALLET, isSigner: true, isWritable: true }], programId: unknownProgram }))

    expect(reasonsOf(verifyPreparedTransactions([transaction], burnExpectation()))).toEqual([
      `The transaction invokes an unexpected program ${unknownProgram.toBase58()}`,
    ])
  })

  it('should reject a fee payer other than the wallet', async () => {
    const transaction = await buildBurn()
    transaction.feePayer = ATTACKER

    const reasons = reasonsOf(verifyPreparedTransactions([transaction], burnExpectation()))
    expect(reasons).toContain(`The transaction makes ${ATTACKER.toBase58()} pay the network fee instead of your wallet`)
    expect(reasons).toContain(`The transaction requires an unexpected signer ${ATTACKER.toBase58()}`)
  })

  it('should reject a token Approve delegating the wallet tokens', async () => {
    const transaction = await buildBurn()
    transaction.add(createApproveInstruction(TOKEN_ACCOUNT, ATTACKER, WALLET, BigInt(1_000)))

    expect(reasonsOf(verifyPreparedTransactions([transaction], burnExpectation()))).toEqual([
      'The transaction contains an unexpected token instruction (token instruction #4)',
    ])
  })

  it('should reject an excessive priority fee', async () => {
    const transaction = await buildBurn()
    const priceIndex = transaction.instructions.findIndex(
      (instruction) => instruction.programId.equals(ComputeBudgetProgram.programId) && instruction.data[0] === 3
    )
    transaction.instructions[priceIndex] = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10_000_000_000 })

    expect(reasonsOf(verifyPreparedTransactions([transaction], burnExpectation()))).toEqual([
      'The transaction sets a priority fee of 1 SOL (limit 0.002 SOL)',
    ])
  })
})

describe('verifyPreparedTransactions — revoke authorities (legacy)', () => {
  it('should accept a mint authority revocation and reject the wrong authority type', async () => {
    mocks.accounts.set(MINT.toBase58(), mintAccount({ decimals: 6, mintAuthority: WALLET }))
    const { transaction } = await createRevokeMintAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: MINT })
    const clientTransaction = asClientLegacy(transaction)

    expect(
      verifyPreparedTransactions(
        [clientTransaction],
        expectation({ kind: 'revoke-authority', mint: MINT.toBase58(), authority: 'mint' }, 0.1)
      ).ok
    ).toBe(true)
    expect(
      reasonsOf(
        verifyPreparedTransactions(
          [clientTransaction],
          expectation({ kind: 'revoke-authority', mint: MINT.toBase58(), authority: 'freeze' }, 0.1)
        )
      )
    ).toEqual(['The transaction changes the MintTokens authority instead of the FreezeAccount authority'])
  })

  it('should reject a SetAuthority that hands the freeze authority to a foreign key', async () => {
    mocks.accounts.set(MINT.toBase58(), mintAccount({ decimals: 6, freezeAuthority: WALLET }))
    const { transaction } = await createRevokeFreezeAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: MINT })
    const clientTransaction = asClientLegacy(transaction)
    const revokeExpectation = expectation({ kind: 'revoke-authority', mint: MINT.toBase58(), authority: 'freeze' }, 0.1)

    expect(verifyPreparedTransactions([clientTransaction], revokeExpectation).ok).toBe(true)

    clientTransaction.instructions[clientTransaction.instructions.length - 1] = kitInstructionToWeb3Instruction(
      getSetAuthorityInstruction(
        {
          owned: address(MINT.toBase58()),
          owner: createNoopSigner(address(WALLET.toBase58())),
          authorityType: AuthorityType.FreezeAccount,
          newAuthority: address(ATTACKER.toBase58()),
        },
        { programAddress: address(TOKEN_PROGRAM_ID.toBase58()) }
      )
    )
    expect(reasonsOf(verifyPreparedTransactions([clientTransaction], revokeExpectation))).toEqual([
      `The transaction assigns the FreezeAccount authority to ${ATTACKER.toBase58()} instead of revoking it`,
    ])
  })

  it('should accept a metadata authority revocation and reject a hand-over to a foreign key', async () => {
    mocks.accounts.set(MINT.toBase58(), mintAccount({ decimals: 6, programId: TOKEN_2022_PROGRAM_ID }))
    mocks.tokenMetadata = { updateAuthority: WALLET, mint: MINT, name: 'Token', symbol: 'TKN', uri: '', additionalMetadata: [] }
    const { transaction } = await createRevokeMetadataAuthorityTransaction({ walletPublicKey: WALLET, tokenPublicKey: MINT })
    const clientTransaction = asClientLegacy(transaction)
    const revokeExpectation = expectation({ kind: 'revoke-metadata-authority', mint: MINT.toBase58() }, 0.05)

    expect(verifyPreparedTransactions([clientTransaction], revokeExpectation).ok).toBe(true)

    clientTransaction.instructions[clientTransaction.instructions.length - 1] = kitInstructionToWeb3Instruction(
      getUpdateTokenMetadataUpdateAuthorityInstruction(
        {
          metadata: address(MINT.toBase58()),
          updateAuthority: createNoopSigner(address(WALLET.toBase58())),
          newUpdateAuthority: address(ATTACKER.toBase58()),
        },
        { programAddress: address(TOKEN_2022_PROGRAM_ID.toBase58()) }
      )
    )
    expect(reasonsOf(verifyPreparedTransactions([clientTransaction], revokeExpectation))).toEqual([
      `The transaction assigns the metadata update authority to ${ATTACKER.toBase58()} instead of revoking it`,
    ])
  })
})

describe('verifyPreparedTransactions — update metadata (legacy, Token-2022)', () => {
  it('should accept the changed fields and reject a value the user did not enter', async () => {
    mocks.accounts.set(MINT.toBase58(), mintAccount({ decimals: 6, programId: TOKEN_2022_PROGRAM_ID }))
    mocks.tokenMetadata = { updateAuthority: WALLET, mint: MINT, name: 'Old', symbol: 'OLD', uri: 'ipfs://old', additionalMetadata: [] }
    const { transaction } = await createUpdateMetadataTransaction({
      walletPublicKey: WALLET,
      tokenPublicKey: MINT,
      tokenData: { name: 'New Name', symbol: 'OLD' },
      metadataUri: 'ipfs://new',
    })
    const clientTransaction = asClientLegacy(transaction)
    const operation = { kind: 'update-metadata', mint: MINT.toBase58(), name: 'New Name', symbol: 'OLD', uri: 'ipfs://new' } as const

    expect(verifyPreparedTransactions([clientTransaction], expectation(operation, 0.05)).ok).toBe(true)
    expect(reasonsOf(verifyPreparedTransactions([clientTransaction], expectation({ ...operation, name: 'Other' }, 0.05)))).toEqual([
      'The transaction sets the token name to "New Name" instead of "Other"',
    ])
    expect(reasonsOf(verifyPreparedTransactions([clientTransaction], expectation({ ...operation, uri: undefined }, 0.05)))).toEqual([
      'The transaction updates the metadata field "uri", which you did not change',
    ])
  })
})

describe('verifyPreparedTransactions — token creation (legacy, Token-2022)', () => {
  const MINT_KEYPAIR = Keypair.generate()
  const NAME = 'Cloak Token'
  const SYMBOL = 'CLK'
  const URI = 'ipfs://metadata'
  const maxRentLamports = BigInt(rent(getMintLen([ExtensionType.MetadataPointer]) + 700 + NAME.length + SYMBOL.length + URI.length))

  const createExpectation = (overrides: Partial<Extract<ExpectedOperation, { kind: 'create-token' }>> = {}) =>
    expectation(
      {
        kind: 'create-token',
        mint: MINT_KEYPAIR.publicKey.toBase58(),
        decimals: 6,
        totalSupply: 1_000_000,
        name: NAME,
        symbol: SYMBOL,
        uri: URI,
        revokeMintAuthority: true,
        revokeFreezeAuthority: false,
        immutableMetadata: true,
        maxRentLamports,
        ...overrides,
      },
      0.19 + 0.05
    )

  const buildCreation = async (): Promise<Transaction> => {
    const { transaction } = await createTokenCreationTransaction({
      walletPublicKey: WALLET,
      mintPublicKey: MINT_KEYPAIR.publicKey,
      tokenData: {
        name: NAME,
        symbol: SYMBOL,
        decimals: 6,
        totalSupply: 1_000_000,
        revokeMintAuthority: true,
        revokeFreezeAuthority: false,
        immutableMetadata: true,
      },
      metadataUri: URI,
    })
    return asClientLegacy(transaction)
  }

  it('should accept the full creation flow with the option fee, rent and the mint keypair as signer', async () => {
    const result = verifyPreparedTransactions([await buildCreation()], createExpectation())

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.summary.serviceFeeLamports).toBe(BigInt(240_000_000))
    expect(result.summary.rentLamports).toBe(maxRentLamports)
    expect(result.summary.createdTokenAccounts).toEqual([
      expect.objectContaining({ owner: WALLET.toBase58(), mint: MINT_KEYPAIR.publicKey.toBase58() }),
    ])
  })

  it('should reject a paid option the transaction does not perform', async () => {
    expect(reasonsOf(verifyPreparedTransactions([await buildCreation()], createExpectation({ revokeFreezeAuthority: true })))).toEqual([
      'Expected 1 freeze authority revocation instruction(s), found 0',
    ])
  })

  it('should reject a supply or decimals different from the form', async () => {
    expect(reasonsOf(verifyPreparedTransactions([await buildCreation()], createExpectation({ totalSupply: 2_000_000 })))).toEqual([
      'The transaction mints 1000000 tokens instead of 2000000',
    ])
    // Same raw supply (1000 * 10^9 = 1000000 * 10^6): the decimals are still checked on their own
    expect(reasonsOf(verifyPreparedTransactions([await buildCreation()], createExpectation({ decimals: 9, totalSupply: 1_000 })))).toEqual([
      'The transaction initializes the token with 6 decimals instead of 9',
    ])
  })

  it('should reject a freeze authority handed to a foreign key', async () => {
    const transaction = await buildCreation()
    transaction.add(
      kitInstructionToWeb3Instruction(
        getSetAuthorityInstruction(
          {
            owned: address(MINT_KEYPAIR.publicKey.toBase58()),
            owner: createNoopSigner(address(WALLET.toBase58())),
            authorityType: AuthorityType.FreezeAccount,
            newAuthority: address(ATTACKER.toBase58()),
          },
          { programAddress: address(TOKEN_2022_PROGRAM_ID.toBase58()) }
        )
      )
    )

    expect(reasonsOf(verifyPreparedTransactions([transaction], createExpectation()))).toEqual([
      'The transaction changes the FreezeAccount authority, which you did not ask for',
    ])
  })

  it('should reject rent above the expected bound', async () => {
    const transaction = await buildCreation()
    transaction.add(transferTo(MINT_KEYPAIR.publicKey, 50_000_000))

    expect(reasonsOf(verifyPreparedTransactions([transaction], createExpectation()))[0]).toMatch(
      /^New accounts are funded with .* SOL, more than the expected .* SOL$/
    )
  })
})

describe('verifyPreparedTransactions — multisender (v0)', () => {
  const recipients = (count: number, amount: number | string) =>
    Array.from({ length: count }, () => ({ address: Keypair.generate().publicKey.toBase58(), amount }))

  const solExpectation = (payments: { address: string; amount: number | string }[]) =>
    expectation(
      { kind: 'sol-transfers', payments: payments.map((payment) => ({ recipient: payment.address, amount: payment.amount })) },
      0.001 * payments.length
    )

  const tokenExpectation = (payments: { address: string; amount: number | string }[]) =>
    expectation(
      {
        kind: 'token-transfers',
        mint: MINT.toBase58(),
        payments: payments.map((payment) => ({ recipient: payment.address, amount: payment.amount })),
      },
      0.001 * payments.length
    )

  it('should accept SOL batches, settle every recipient once and map payments to transactions', async () => {
    const payments = recipients(13, 0.5)
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: payments })
    const transactions = result.transactions.map(asClientVersioned)

    const verification = verifyPreparedTransactions(transactions, solExpectation(payments))

    expect(verification.ok).toBe(true)
    if (!verification.ok) return
    expect(verification.summary.paymentLamports).toBe(BigInt(6_500_000_000))
    expect(verification.summary.serviceFeeLamports).toBe(BigInt(13_000_000))
    expect(verification.summary.paymentIndexesByTransaction.flat().sort((a, b) => a - b)).toEqual([...Array(13).keys()])
    expect(verification.summary.paymentIndexesByTransaction.map((indexes) => indexes.length)).toEqual(result.recipientCounts)
  })

  it('should reject a duplicated payment (double pay) and an amount that differs from the form', async () => {
    const payments = recipients(2, 0.5)
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: payments })
    const doublePay = tamperVersioned(asClientVersioned(result.transactions[0]), (instructions) => [
      ...instructions,
      transferTo(new PublicKey(payments[0].address), 500_000_000),
    ])

    expect(reasonsOf(verifyPreparedTransactions([doublePay], solExpectation(payments)))).toEqual([
      `The transaction sends 0.5 SOL to ${payments[0].address}, which is neither the fee wallet nor a recipient you entered`,
    ])

    const edited = [{ ...payments[0], amount: 0.4 }, payments[1]]
    expect(reasonsOf(verifyPreparedTransactions([asClientVersioned(result.transactions[0])], solExpectation(edited)))).toEqual([
      `The transaction sends 0.5 SOL to ${payments[0].address}, which is neither the fee wallet nor a recipient you entered`,
      `Missing payment of 0.4 SOL to ${payments[0].address}`,
    ])
  })

  it('should accept SPL TransferChecked batches and report the token accounts they create', async () => {
    mocks.accounts.set(MINT.toBase58(), mintAccount({ decimals: 6 }))
    const payments = recipients(4, '2.5')
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients: payments })

    const verification = verifyPreparedTransactions(result.transactions.map(asClientVersioned), tokenExpectation(payments))

    expect(verification.ok).toBe(true)
    if (!verification.ok) return
    expect(verification.summary.paymentLamports).toBe(BigInt(0))
    expect(verification.summary.createdTokenAccounts.map((account) => account.owner).sort()).toEqual(
      payments.map((payment) => payment.address).sort()
    )
  })

  it('should reject an extra token transfer and token account for an attacker', async () => {
    mocks.accounts.set(MINT.toBase58(), mintAccount({ decimals: 6 }))
    const payments = recipients(2, '1')
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, recipients: payments })
    const attackerAta = getAssociatedTokenAddressSync(MINT, ATTACKER)
    const tampered = tamperVersioned(asClientVersioned(result.transactions[0]), (instructions) => [
      ...instructions,
      kitInstructionToWeb3Instruction(
        getTransferCheckedInstruction({
          source: address(getAssociatedTokenAddressSync(MINT, WALLET).toBase58()),
          mint: address(MINT.toBase58()),
          destination: address(attackerAta.toBase58()),
          authority: createNoopSigner(address(WALLET.toBase58())),
          amount: BigInt(1_000_000),
          decimals: 6,
        })
      ),
    ])

    expect(reasonsOf(verifyPreparedTransactions([tampered], tokenExpectation(payments)))).toEqual([
      `The transaction transfers 1 tokens to ${attackerAta.toBase58()}, which matches none of your unpaid recipients`,
    ])
  })

  it('should reject a batch whose fee payer is not the wallet', async () => {
    const payments = recipients(1, 0.1)
    const result = await createMultisenderTransaction({ walletPublicKey: WALLET, recipients: payments })
    const tampered = tamperVersioned(asClientVersioned(result.transactions[0]), (instructions) => instructions, ATTACKER)

    expect(reasonsOf(verifyPreparedTransactions([tampered], solExpectation(payments)))).toContain(
      `The transaction makes ${ATTACKER.toBase58()} pay the network fee instead of your wallet`
    )
  })
})

describe('verifyPreparedTransactions — donation (v0)', () => {
  it('should accept a SOL donation to the fee wallet and reject one to another treasury', async () => {
    const { transaction } = await createDonationTransaction({ walletPublicKey: WALLET, amount: 0.25 })
    const operation = { kind: 'sol-transfers', payments: [{ recipient: FEE_WALLET.toBase58(), amount: 0.25 }] } as const

    expect(verifyPreparedTransactions([asClientVersioned(transaction)], expectation(operation, 0)).ok).toBe(true)

    const otherTreasury = Keypair.generate().publicKey.toBase58()
    const reasons = reasonsOf(
      verifyPreparedTransactions([asClientVersioned(transaction)], {
        ...expectation({ kind: 'sol-transfers', payments: [{ recipient: otherTreasury, amount: 0.25 }] }, 0),
        feeWallet: otherTreasury,
      })
    )
    expect(reasons).toEqual([
      `The transaction sends 0.25 SOL to ${FEE_WALLET.toBase58()}, which is neither the fee wallet nor a recipient you entered`,
      `Missing payment of 0.25 SOL to ${otherTreasury}`,
    ])
  })

  it('should verify an unchecked SPL donation transfer only when the client knows the decimals', async () => {
    mocks.accounts.set(MINT.toBase58(), mintAccount({ decimals: 6 }))
    const { transaction } = await createDonationTransaction({ walletPublicKey: WALLET, tokenMintAddress: MINT, amount: 3.5 })
    const operation = {
      kind: 'token-transfers',
      mint: MINT.toBase58(),
      payments: [{ recipient: FEE_WALLET.toBase58(), amount: 3.5 }],
    } as const

    expect(verifyPreparedTransactions([asClientVersioned(transaction)], expectation({ ...operation, decimals: 6 }, 0)).ok).toBe(true)
    expect(reasonsOf(verifyPreparedTransactions([asClientVersioned(transaction)], expectation(operation, 0)))).toEqual([
      'The transaction uses an unchecked token transfer whose amount cannot be verified',
      `Missing transfer of 3.5 tokens to ${FEE_WALLET.toBase58()}`,
    ])
  })
})

describe('verifyPreparedTransactions — freeze / unfreeze (v0)', () => {
  const targets = Array.from({ length: 3 }, () => Keypair.generate().publicKey)

  it('should accept freezing the selected wallets and reject a token account of another wallet', async () => {
    mocks.accounts.set(MINT.toBase58(), mintAccount({ decimals: 6, freezeAuthority: WALLET }))
    for (const target of targets) {
      mocks.accounts.set(getAssociatedTokenAddressSync(MINT, target).toBase58(), tokenAccount(MINT, target, 1))
    }
    const result = await createBatchFreezeTransaction({ walletPublicKey: WALLET, targetWallets: targets, mintAddress: MINT })
    const transactions = result.transactions.map(asClientVersioned)
    const operation = { kind: 'freeze', mint: MINT.toBase58(), targetWallets: targets.map((target) => target.toBase58()) } as const

    expect(verifyPreparedTransactions(transactions, expectation(operation, 0.01 * targets.length)).ok).toBe(true)
    expect(
      reasonsOf(
        verifyPreparedTransactions(transactions, expectation({ ...operation, targetWallets: operation.targetWallets.slice(1) }, 0.03))
      )
    ).toEqual([
      `The transaction freezes token account ${getAssociatedTokenAddressSync(MINT, targets[0]).toBase58()}, which does not belong to a wallet you entered`,
    ])
    expect(reasonsOf(verifyPreparedTransactions(transactions, expectation({ ...operation, kind: 'thaw' }, 0.03)))).toContain(
      'The transaction contains an unexpected token instruction (freezeAccount)'
    )
  })

  it('should accept unfreezing frozen accounts', async () => {
    mocks.accounts.set(MINT.toBase58(), mintAccount({ decimals: 6, freezeAuthority: WALLET }))
    for (const target of targets) {
      mocks.accounts.set(getAssociatedTokenAddressSync(MINT, target).toBase58(), tokenAccount(MINT, target, 2))
    }
    const result = await createBatchUnfreezeTransaction({ walletPublicKey: WALLET, targetWallets: targets, mintAddress: MINT })
    const operation = { kind: 'thaw', mint: MINT.toBase58(), targetWallets: targets.map((target) => target.toBase58()) } as const

    expect(verifyPreparedTransactions(result.transactions.map(asClientVersioned), expectation(operation, 0.03)).ok).toBe(true)
  })
})
