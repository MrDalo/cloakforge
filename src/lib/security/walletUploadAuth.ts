/**
 * Shared (client + server) message format for wallet-signed IPFS upload requests.
 * Keeping the message-building logic in one isomorphic module means the client
 * (signing) and the server (verifying) can never drift out of sync.
 *
 * The signed message is bound to:
 * - the site domain (host) the request is sent to, so a signature collected on another
 *   site cannot be replayed against CloakForge;
 * - the upload actions it authorizes (`file` and/or `json`), so a metadata-only signature
 *   cannot be used to pin arbitrary files;
 * - a timestamp the server checks against a short freshness window.
 */

export type WalletUploadAction = 'file' | 'json'

export const WALLET_UPLOAD_ACTIONS: readonly WalletUploadAction[] = ['file', 'json']

/** Request header names carrying the upload authorization. */
export const WALLET_UPLOAD_HEADERS = {
  authorization: 'Authorization',
  walletAddress: 'x-wallet-address',
  timestamp: 'x-timestamp',
  actions: 'x-upload-actions',
} as const

const MESSAGE_TITLE = 'CloakForge IPFS upload authorization'
const MESSAGE_NOTICE = 'Signing this message does not send a transaction or cost any fees.'

export interface WalletUploadMessageParams {
  /** Host (domain[:port]) of the site the upload request is sent to, e.g. `www.cloakforge.app`. */
  domain: string
  walletAddress: string
  /** Canonical, comma-separated action list (see {@link formatWalletUploadActions}). */
  actions: string
  /** Unix epoch milliseconds when the message was signed. */
  timestamp: number
}

/** Returns the canonical, de-duplicated and ordered `file,json` action string. */
export const formatWalletUploadActions = (actions: readonly WalletUploadAction[]): string =>
  WALLET_UPLOAD_ACTIONS.filter((action) => actions.includes(action)).join(',')

/**
 * Parses an action header value. Returns null unless it is exactly the canonical form
 * produced by {@link formatWalletUploadActions} (non-empty, known actions, no duplicates).
 */
export function parseWalletUploadActions(value: string | null | undefined): WalletUploadAction[] | null {
  if (!value || value.length > 32) return null
  const parts = value.split(',')
  const actions = parts.filter((part): part is WalletUploadAction => (WALLET_UPLOAD_ACTIONS as readonly string[]).includes(part))
  if (actions.length === 0 || actions.length !== parts.length) return null
  return formatWalletUploadActions(actions) === value ? actions : null
}

/** Builds the exact message a wallet must sign to authorize an IPFS upload request. */
export const buildWalletUploadMessage = ({ domain, walletAddress, actions, timestamp }: WalletUploadMessageParams): string =>
  [
    MESSAGE_TITLE,
    MESSAGE_NOTICE,
    '',
    `Domain: ${domain}`,
    `Wallet: ${walletAddress}`,
    `Actions: ${actions}`,
    `Issued At: ${new Date(timestamp).toISOString()}`,
    `Timestamp: ${timestamp}`,
  ].join('\n')

export type SignMessageFn = (message: Uint8Array) => Promise<Uint8Array>

/** Host of the current page; upload requests are same-origin so this matches the server's Host. */
function getCurrentDomain(): string {
  const host = typeof window !== 'undefined' ? window.location.host : ''
  if (!host) {
    throw new Error('Wallet upload authorization must be created in the browser')
  }
  return host
}

/**
 * Signs a fresh upload-auth message with the connected wallet and returns the headers
 * to attach to an IPFS upload request. Pass every action the flow needs (e.g. `['file', 'json']`)
 * so one wallet prompt covers the logo and metadata uploads of the same flow; the server
 * only accepts the signature for the listed actions and for a short time window.
 */
export async function createWalletUploadAuthHeaders(
  walletAddress: string,
  signMessage: SignMessageFn,
  actions: readonly WalletUploadAction[],
  domain: string = getCurrentDomain()
): Promise<Record<string, string>> {
  const actionList = formatWalletUploadActions(actions)
  if (!actionList) {
    throw new Error('At least one upload action is required')
  }

  const timestamp = Date.now()
  const message = buildWalletUploadMessage({ domain, walletAddress, actions: actionList, timestamp })
  const signatureBytes = await signMessage(new TextEncoder().encode(message))

  return {
    [WALLET_UPLOAD_HEADERS.authorization]: `Bearer ${Buffer.from(signatureBytes).toString('base64')}`,
    [WALLET_UPLOAD_HEADERS.walletAddress]: walletAddress,
    [WALLET_UPLOAD_HEADERS.timestamp]: String(timestamp),
    [WALLET_UPLOAD_HEADERS.actions]: actionList,
  }
}
