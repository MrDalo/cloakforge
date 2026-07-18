/**
 * Shared (client + server) message format for wallet-signed IPFS upload requests.
 * Keeping the message-building logic in one isomorphic module means the client
 * (signing) and the server (verifying) can never drift out of sync.
 */

const IPFS_UPLOAD_MESSAGE_PREFIX = 'cloakforge-ipfs-upload'

/** Builds the exact message a wallet must sign to authorize an IPFS upload request. */
export const buildWalletUploadMessage = (walletAddress: string, timestamp: number): string =>
  `${IPFS_UPLOAD_MESSAGE_PREFIX}:${walletAddress}:${timestamp}`

export type SignMessageFn = (message: Uint8Array) => Promise<Uint8Array>

/**
 * Signs a fresh upload-auth message with the connected wallet and returns the headers
 * to attach to an IPFS upload request. Callers should sign once and reuse the headers
 * for both the file and JSON upload calls of the same token-creation flow.
 */
export async function createWalletUploadAuthHeaders(walletAddress: string, signMessage: SignMessageFn): Promise<Record<string, string>> {
  const timestamp = Date.now()
  const message = buildWalletUploadMessage(walletAddress, timestamp)
  const signatureBytes = await signMessage(new TextEncoder().encode(message))

  return {
    Authorization: `Bearer ${Buffer.from(signatureBytes).toString('base64')}`,
    'x-wallet-address': walletAddress,
    'x-timestamp': String(timestamp),
  }
}
