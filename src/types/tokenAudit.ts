/**
 * Token Auditor types — shared by the server-side on-chain analysis and the result UI.
 *
 * Everything here is read from the chain or derived from on-chain data by fixed rules.
 * Nothing is estimated or filled with placeholder values: a value that could not be read is
 * `null` (or a check with status `unknown`), never a guess.
 */

/** Outcome of one automated check. `unknown` means it could not be determined and is never treated as a pass. */
export type AuditCheckStatus = 'pass' | 'warn' | 'fail' | 'unknown'

export type AuditCheckId =
  | 'mint-authority'
  | 'freeze-authority'
  | 'token-extensions'
  | 'transfer-fee'
  | 'permanent-delegate'
  | 'transfer-hook'
  | 'default-account-state'
  | 'pausable'
  | 'non-transferable'
  | 'mint-close-authority'
  | 'confidential-transfer'
  | 'other-extensions'
  | 'metadata-mutability'
  | 'holder-concentration'

export interface AuditCheck {
  id: AuditCheckId
  title: string
  status: AuditCheckStatus
  /** Short explanation of what was found and why it matters. */
  explanation: string
  /** Account the finding refers to (an authority, delegate or program), when there is one. */
  address?: string
}

/**
 * Overall level derived deterministically from the checks:
 * `high` if any check failed, `medium` if any check warned or could not be determined, otherwise `low`.
 */
export type AuditRiskLevel = 'high' | 'medium' | 'low'

export interface TokenAuditSummary {
  pass: number
  warn: number
  fail: number
  unknown: number
  riskLevel: AuditRiskLevel
}

export type TokenProgramKind = 'spl-token' | 'token-2022'

export interface TokenAuditMetadata {
  /** Where the metadata was read from: the Token-2022 metadata extension or a Metaplex metadata account. */
  source: 'token-2022' | 'metaplex'
  /** Self-reported by the token creator; sanitized for display. */
  name: string
  symbol: string
  uri: string
  /** Account allowed to change name/symbol/URI, or null when revoked. */
  updateAuthority: string | null
  /** Whether name/symbol/URI can still be changed (ignores the MetadataPointer, which is checked separately). */
  isMutable: boolean
}

/** One transfer-fee setting: a percentage (basis points) limited per transfer by a maximum fee. */
export interface TransferFeeTerms {
  basisPoints: number
  /** Maximum fee charged per transfer, in raw base units. */
  maximumFeeRaw: string
}

export interface TransferFeeInfo {
  /** False when the current epoch could not be read; `inForce` is then the highest configured fee. */
  epochKnown: boolean
  /** Fee charged now. With an unknown epoch: the larger percentage and larger cap of the two configured fees. */
  inForce: TransferFeeTerms
  /** Fee that takes effect at a future epoch, or null when none is pending (or the epoch is unknown). */
  scheduled: TransferFeeTerms | null
  /** Account that can change the fee, or null when revoked. */
  configAuthority: string | null
}

export interface Token2022ExtensionInfo {
  /** Names of every extension present on the mint, including ones this tool does not analyze. */
  present: string[]
  transferFee: TransferFeeInfo | null
  /** Permanent delegate (can move or burn tokens from any account), or null when absent/revoked. */
  permanentDelegate: string | null
  transferHook: { programId: string | null; authority: string | null } | null
  defaultAccountStateFrozen: boolean
  pausable: { authority: string | null; paused: boolean } | null
  nonTransferable: boolean
  mintCloseAuthority: string | null
  confidentialTransfer: boolean
  metadataPointer: { authority: string | null; metadataAddress: string | null } | null
}

/**
 * Who controls a top token account.
 * - `wallet`: the owner is a regular keypair address (a person, team or exchange — not distinguishable on-chain).
 * - `program-controlled`: the owner is a program-derived address (liquidity pool, lock, vault, bonding curve…);
 *   which program and what it does is NOT verified.
 * - `unknown`: the token account could not be read.
 */
export type HolderKind = 'wallet' | 'program-controlled' | 'unknown'

export interface TopHolder {
  /** Token account address. */
  tokenAccount: string
  /** Owner of the token account, or null when it could not be read. */
  owner: string | null
  kind: HolderKind
  amountRaw: string
  /** Share of total supply in percent, rounded down to two decimals. */
  sharePercent: number
}

export interface HolderConcentration {
  /** Up to 10 largest token accounts, largest first. */
  topHolders: TopHolder[]
  /** Combined share of the listed accounts, all kinds. */
  top10SharePercent: number
  /** Combined share of the listed accounts owned by regular wallets. */
  walletSharePercent: number
  /** Largest share held by one wallet (summed across its listed accounts). */
  largestWalletSharePercent: number
  /** Combined share of listed accounts that are program-controlled or unreadable (not classified further). */
  unclassifiedSharePercent: number
}

/** On-chain facts gathered for one mint, before any risk rules are applied. */
export interface TokenAuditFacts {
  mint: string
  tokenProgram: TokenProgramKind
  decimals: number
  supplyRaw: string
  /** Supply scaled by decimals, with thousands separators. */
  supplyDisplay: string
  mintAuthority: string | null
  freezeAuthority: string | null
  metadata: TokenAuditMetadata | null
  /** Set when the MetadataPointer targets a separate account this tool does not read. */
  externalMetadataAddress: string | null
  /** Token-2022 extension details; null for classic SPL Token mints. */
  extensions: Token2022ExtensionInfo | null
  /** Null when holder data could not be read (e.g. RPC timeout); never estimated. */
  holders: HolderConcentration | null
}

export interface TokenAuditReport extends TokenAuditFacts {
  checks: AuditCheck[]
  summary: TokenAuditSummary
  /** ISO timestamp of when the on-chain data was read. */
  analyzedAt: string
}

export type TokenAuditFailureStatus = 'invalid-address' | 'not-found' | 'not-a-mint' | 'unavailable'

export type TokenAuditResult = { status: 'ok'; report: TokenAuditReport } | { status: TokenAuditFailureStatus }
