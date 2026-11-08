/**
 * Token-2022 extension decoding for the Token Auditor (no RPC calls).
 *
 * Uses the @solana/spl-token extension readers on an already-decoded mint and reduces each
 * safety-relevant extension to plain, serializable values.
 */

import 'server-only'

import { PublicKey } from '@solana/web3.js'
import {
  AccountState,
  ExtensionType,
  getDefaultAccountState,
  getEpochFee,
  getExtensionTypes,
  getMetadataPointerState,
  getMintCloseAuthority,
  getNonTransferable,
  getPausableConfig,
  getPermanentDelegate,
  getTransferFeeConfig,
  getTransferHook,
  type Mint,
  type TransferFeeConfig,
} from '@solana/spl-token'
import type { Token2022ExtensionInfo, TransferFeeInfo, TransferFeeTerms } from '@/types/tokenAudit'

/** Token-2022 extension types that exist on-chain but are missing from the installed ExtensionType enum. */
const EXTRA_EXTENSION_NAMES: Readonly<Record<number, string>> = {
  16: 'ConfidentialTransferFeeConfig',
  17: 'ConfidentialTransferFeeAmount',
  24: 'ConfidentialMintBurn',
}

/**
 * Converts an optional on-chain key (all-zero key means "none") to a base58 address.
 *
 * @param key - Key read from chain, possibly absent or zeroed.
 * @returns Base58 address, or null when unset.
 */
export function toOptionalAddress(key: PublicKey | null | undefined): string | null {
  return key && !key.equals(PublicKey.default) ? key.toBase58() : null
}

/**
 * Lists the names of all extensions present in a mint's TLV data, in on-chain order.
 *
 * @param mint - Decoded mint (classic mints have empty TLV data).
 * @returns Extension names; unrecognized types are reported as `Unknown(<type>)`.
 */
export function listExtensionNames(mint: Mint): string[] {
  return getExtensionTypes(mint.tlvData).map((type) => ExtensionType[type] ?? EXTRA_EXTENSION_NAMES[type] ?? `Unknown(${type})`)
}

/**
 * Reduces a transfer-fee configuration to the fee in force now and the fee scheduled for a later epoch.
 *
 * Token-2022 keeps the previous fee in `olderTransferFee` after `newerTransferFee.epoch` has passed, so the
 * newer fee is only "scheduled" while the current epoch is still before its start. Without an epoch the
 * larger of the two fees is reported as in force (conservative) and nothing is reported as scheduled.
 *
 * @param config - TransferFeeConfig extension state.
 * @param epoch - Current epoch, or null when it could not be read.
 * @returns Serializable transfer-fee summary.
 */
export function describeTransferFee(config: TransferFeeConfig, epoch: bigint | null): TransferFeeInfo {
  const { olderTransferFee, newerTransferFee } = config
  const toTerms = (fee: TransferFeeConfig['newerTransferFee']): TransferFeeTerms => ({
    basisPoints: fee.transferFeeBasisPoints,
    maximumFeeRaw: fee.maximumFee.toString(),
  })
  const configAuthority = toOptionalAddress(config.transferFeeConfigAuthority)

  if (epoch === null) {
    return {
      epochKnown: false,
      inForce: {
        basisPoints: Math.max(olderTransferFee.transferFeeBasisPoints, newerTransferFee.transferFeeBasisPoints),
        maximumFeeRaw: (olderTransferFee.maximumFee > newerTransferFee.maximumFee
          ? olderTransferFee.maximumFee
          : newerTransferFee.maximumFee
        ).toString(),
      },
      scheduled: null,
      configAuthority,
    }
  }

  return {
    epochKnown: true,
    inForce: toTerms(getEpochFee(config, epoch)),
    scheduled: epoch < newerTransferFee.epoch ? toTerms(newerTransferFee) : null,
    configAuthority,
  }
}

/**
 * Decodes the safety-relevant Token-2022 extensions of a mint.
 *
 * @param mint - Decoded Token-2022 mint (with TLV data).
 * @param epoch - Current epoch for transfer-fee resolution, or null when unknown.
 * @returns Extension summary.
 */
export function decodeToken2022Extensions(mint: Mint, epoch: bigint | null): Token2022ExtensionInfo {
  const transferFeeConfig = getTransferFeeConfig(mint)
  const transferHook = getTransferHook(mint)
  const pausable = getPausableConfig(mint)
  const metadataPointer = getMetadataPointerState(mint)

  return {
    present: listExtensionNames(mint),
    transferFee: transferFeeConfig ? describeTransferFee(transferFeeConfig, epoch) : null,
    permanentDelegate: toOptionalAddress(getPermanentDelegate(mint)?.delegate),
    transferHook: transferHook
      ? { programId: toOptionalAddress(transferHook.programId), authority: toOptionalAddress(transferHook.authority) }
      : null,
    defaultAccountStateFrozen: getDefaultAccountState(mint)?.state === AccountState.Frozen,
    pausable: pausable ? { authority: toOptionalAddress(pausable.authority), paused: Boolean(pausable.paused) } : null,
    nonTransferable: getNonTransferable(mint) !== null,
    mintCloseAuthority: toOptionalAddress(getMintCloseAuthority(mint)?.closeAuthority),
    confidentialTransfer: getExtensionTypes(mint.tlvData).includes(ExtensionType.ConfidentialTransferMint),
    metadataPointer: metadataPointer
      ? {
          authority: toOptionalAddress(metadataPointer.authority),
          metadataAddress: toOptionalAddress(metadataPointer.metadataAddress),
        }
      : null,
  }
}
