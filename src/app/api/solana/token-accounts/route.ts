import { NextResponse } from 'next/server'
import { Connection, PublicKey } from '@solana/web3.js'
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import getConfig from '@/lib/config/config'
import { getLogger } from '@/lib/logger/logger'
import { APP_ERROR_CODES } from '@/lib/utils/appErrorCodes'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'
import getUserErrorMessageFromError from '@/lib/utils/getUserErrorMessageFromError'
import getStatusCodeFromError from '@/lib/utils/getStatusCodeFromError'
import type { ApiResponseBase } from '@/types/error'

const logger = getLogger({
  context: 'api',
  route: '/api/solana/token-accounts',
  method: 'POST',
})

// Metaplex Metadata Program ID
const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

export type TokenAccountsReponseType = {
  token_account_address: string
  token_address: string
  token_image: string | null
  amount: number
  name: string | null
  symbol: string | null
}

// Helper function to derive metadata PDA
function getMetadataPDA(mintAddress: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintAddress.toBuffer()],
    METADATA_PROGRAM_ID
  )
  return pda
}

// Helper function to parse metadata from account data
function parseMetadata(data: Buffer): { name: string | null; symbol: string | null; uri: string | null } {
  try {
    // Metaplex metadata format parsing
    // Skip first 1 byte (discriminator) and 32 bytes (update_authority)
    let offset = 1 + 32

    // Skip mint (32 bytes)
    offset += 32

    // Read name length (4 bytes) and name
    const nameLength = data.readUInt32LE(offset)
    offset += 4
    const name = data
      .subarray(offset, offset + nameLength)
      .toString('utf8')
      .replace(/\0/g, '')
      .trim()
    offset += nameLength

    // Read symbol length (4 bytes) and symbol
    const symbolLength = data.readUInt32LE(offset)
    offset += 4
    const symbol = data
      .subarray(offset, offset + symbolLength)
      .toString('utf8')
      .replace(/\0/g, '')
      .trim()
    offset += symbolLength

    // Read URI length (4 bytes) and URI
    const uriLength = data.readUInt32LE(offset)
    offset += 4
    const uri = data
      .subarray(offset, offset + uriLength)
      .toString('utf8')
      .replace(/\0/g, '')
      .trim()

    return {
      name: name || null,
      symbol: symbol || null,
      uri: uri || null,
    }
  } catch (error) {
    logger.error(`Error parsing metadata: ${error}`)
    return { name: null, symbol: null, uri: null }
  }
}

// Helper function to fetch image from URI
async function fetchTokenImage(uri: string | null): Promise<string | null> {
  if (!uri) return null

  try {
    const response = await fetch(uri, { method: 'GET' })
    if (!response.ok) return null

    const metadata = await response.json()
    return metadata.image || null
  } catch (error) {
    logger.warn(`Failed to fetch image from URI ${uri}: ${error}`)
    return null
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponseBase<TokenAccountsReponseType[]>>> {
  try {
    const { walletAddress } = await request.json()

    if (!walletAddress) {
      logger.error('Missing wallet address')
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Missing wallet address',
          error_code: APP_ERROR_CODES.MISSING_REQUIRED_FIELD,
          data: [],
        },
        { status: 400 }
      )
    }

    logger.info('Fetching token accounts for wallet', { walletAddress })

    const { rpcEndpoint } = getConfig()
    const connection = new Connection(rpcEndpoint)

    let walletPubkey: PublicKey
    try {
      walletPubkey = new PublicKey(walletAddress)
    } catch (error) {
      logger.error('Invalid wallet address format', error, { walletAddress })
      return NextResponse.json(
        {
          status: 'error',
          status_code: 400,
          error_message: 'Invalid wallet address format',
          error_code: SOLANA_ERROR_CODES.INVALID_WALLET_ADDRESS,
          data: [],
        },
        { status: 400 }
      )
    }

    // Fetch token accounts from both TOKEN_PROGRAM and TOKEN_2022_PROGRAM in parallel
    const [tokenAccountsResult, token2022AccountsResult] = await Promise.allSettled([
      connection.getParsedTokenAccountsByOwner(walletPubkey, {
        programId: TOKEN_PROGRAM_ID,
      }),
      connection.getParsedTokenAccountsByOwner(walletPubkey, {
        programId: TOKEN_2022_PROGRAM_ID,
      }),
    ])

    // Combine results and filter for non-zero balances
    const tokenAccounts = tokenAccountsResult.status === 'fulfilled' ? tokenAccountsResult.value.value : []
    const token2022Accounts = token2022AccountsResult.status === 'fulfilled' ? token2022AccountsResult.value.value : []

    const allAccounts = [...tokenAccounts, ...token2022Accounts].filter(
      (account) => account.account.data.parsed.info.tokenAmount.uiAmount > 0
    )

    if (allAccounts.length === 0) {
      logger.info('No token accounts found for wallet', { walletAddress })
      return NextResponse.json({
        status: 'success',
        status_code: 200,
        error_message: '',
        data: [],
      })
    }

    // Extract mint addresses and derive metadata PDAs
    const mintAddresses = allAccounts.map((account) => new PublicKey(account.account.data.parsed.info.mint))
    const metadataPDAs = mintAddresses.map((mint) => getMetadataPDA(mint))

    // Batch fetch all metadata accounts in one RPC call
    const metadataAccounts = await connection.getMultipleAccountsInfo(metadataPDAs)

    // Process all tokens in parallel
    const tokensPromises = allAccounts.map(async (account, index) => {
      const mintAddress = mintAddresses[index]
      const metadataAccount = metadataAccounts[index]
      const tokenAccountInfo = account.account.data.parsed.info

      const tokenData: TokenAccountsReponseType = {
        token_account_address: account.pubkey.toBase58(),
        token_address: mintAddress.toBase58(),
        token_image: null,
        amount: tokenAccountInfo.tokenAmount.uiAmount || 0,
        name: null,
        symbol: null,
      }

      // Parse metadata if account exists
      if (metadataAccount?.data) {
        const metadata = parseMetadata(metadataAccount.data)
        tokenData.name = metadata.name
        tokenData.symbol = metadata.symbol

        // Fetch token image if URI exists
        if (metadata.uri) {
          tokenData.token_image = await fetchTokenImage(metadata.uri)
        }
      }

      return tokenData
    })

    const tokens = await Promise.all(tokensPromises)

    logger.info(`Successfully fetched ${tokens.length} token accounts for wallet ${walletAddress}`)

    return NextResponse.json({
      status: 'success',
      status_code: 200,
      error_message: '',
      data: tokens,
    })
  } catch (error) {
    logger.error('Failed to fetch token accounts', error, {
      action: 'fetchTokenAccounts',
    })

    const statusCode = getStatusCodeFromError(error)
    const errorMessage = getUserErrorMessageFromError(error, SOLANA_ERROR_CODES.RPC_ERROR)

    return NextResponse.json(
      {
        status: 'error',
        status_code: statusCode,
        error_message: errorMessage,
        error_code: SOLANA_ERROR_CODES.RPC_ERROR,
        data: [],
      },
      { status: statusCode }
    )
  }
}
