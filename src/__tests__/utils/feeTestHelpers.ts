import {
  PublicKey,
  SystemInstruction,
  SystemProgram,
  TransactionMessage,
  type TransactionInstruction,
  type VersionedTransaction,
} from '@solana/web3.js'

/** Fee wallet address used by the server-side builder tests' getServerConfig mocks. */
export const TEST_FEE_WALLET = new PublicKey('FeeWa11etAddre55111111111111111111111111111')

/**
 * Sums the lamports of all SystemProgram transfers to the fee wallet — i.e. the service fee a
 * built transaction actually charges.
 */
export const feeTransferLamports = (instructions: TransactionInstruction[], feeWallet: PublicKey = TEST_FEE_WALLET): number =>
  instructions
    .filter((ix) => ix.programId.equals(SystemProgram.programId) && SystemInstruction.decodeInstructionType(ix) === 'Transfer')
    .map((ix) => SystemInstruction.decodeTransfer(ix))
    .filter((transfer) => transfer.toPubkey.equals(feeWallet))
    .reduce((sum, transfer) => sum + Number(transfer.lamports), 0)

/** All instructions of a list of versioned transactions (decompiled). */
export const versionedInstructions = (transactions: VersionedTransaction[]): TransactionInstruction[] =>
  transactions.flatMap((tx) => TransactionMessage.decompile(tx.message).instructions)
