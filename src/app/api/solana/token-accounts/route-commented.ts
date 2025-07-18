// import { deserializeMetadata } from '@metaplex-foundation/mpl-token-metadata'
// import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters'
// import { NextResponse } from 'next/server'
// import { Connection, PublicKey } from '@solana/web3.js'
// import getConfig from '@/lib/config/config'
// import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token'
// import { createLogger } from '@/lib/logger/logger'
// import { sol } from '@metaplex-foundation/umi'
// import { RouteHandlerResponseBaseType } from '@/types/global'
// import { fetchImage } from '@/lib/solana/utils'

// const logger = createLogger({
//   action: 'Solana/TokenAccounts/POST',
//   file: 'api/solana/token-accounts/route.ts',
// })

// const METADATA_PROGRAM_ID = new PublicKey(
//   'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
// )

export type TokenAccountsReponseType = {
	token_account_address: string
	token_address: string
	token_image: string | null
	amount: number
	name: string | null
	symbol: string | null
}

// // This POST endpoint fetches token accounts and metadata for a given wallet address
// // It uses non-standad way. By using fetchDigitalAsset from @metaplex-foundation/mpl-token-metadata, each call of fetchDigitalAsset will fetch metadata for a single token mint.
// // This is not efficient as it will make multiple requests to fetch metadata for each token mint -> each call will cause RPC call to solana node.
// // I constructed metadata PDAs for all token mints and then batch fetched metadata accounts in one RPC call (getMultipleAccountsInfo()).
// // This way, I fetched metadata for all token mints in a single RPC call.
// // This RPC call returned me all metadata but in the buffer format. I then deserialized each metadata account using deserializeMetadata() function.
// // I also fetched token image for each token mint using fetchImage() function.
// export const POST = async (
//   request: Request
// ): Promise<
//   | NextResponse<{
//       error: string
//     }>
//   | NextResponse<RouteHandlerResponseBaseType<TokenAccountsReponseType[]>>
// > => {
//   const { walletAddress } = await request.json()

//   if (!walletAddress) {
//     logger.error('Missing wallet address')
//     return NextResponse.json(
//       { error: 'Missing wallet address' },
//       { status: 400 }
//     )
//   }

//   const { rpcEndpoint } = getConfig()
//   const connection = new Connection(rpcEndpoint)

//   try {
//     // Fetch token accounts using Promise.allSettled to handle success and failure
//     const results = await Promise.allSettled([
//       connection.getParsedTokenAccountsByOwner(new PublicKey(walletAddress), {
//         programId: TOKEN_PROGRAM_ID,
//       }),
//       connection.getParsedTokenAccountsByOwner(new PublicKey(walletAddress), {
//         programId: TOKEN_2022_PROGRAM_ID,
//       }),
//     ])

//     // Extract results from the settled promises
//     const tokenAccounts =
//       results[0].status === 'fulfilled' ? results[0].value : null
//     const token2022Accounts =
//       results[1].status === 'fulfilled' ? results[1].value : null

//     const allAccounts = [
//       ...(tokenAccounts?.value ? tokenAccounts.value : []),
//       ...(token2022Accounts?.value ? token2022Accounts.value : []),
//     ].filter(
//       (account) => account.account.data.parsed.info.tokenAmount.uiAmount > 0
//     )

//     // Derive metadata PDAs for all token mints
//     const mintAddresses = allAccounts.map(
//       (account) => account.account.data.parsed.info.mint
//     )
//     const metadataPDAs = mintAddresses.map(
//       (mint) =>
//         PublicKey.findProgramAddressSync(
//           [
//             Buffer.from('metadata'),
//             METADATA_PROGRAM_ID.toBuffer(),
//             new PublicKey(mint).toBuffer(),
//           ],
//           METADATA_PROGRAM_ID
//         )[0]
//     )

//     // Batch fetch metadata accounts
//     const metadataAccounts =
//       await connection.getMultipleAccountsInfo(metadataPDAs)

//     // Check for null or invalid accounts
//     if (!metadataAccounts || metadataAccounts.some((account) => !account)) {
//       logger.error(
//         `Failed to fetch some or all metadata accounts for token mints. Total Accounts: ${metadataPDAs.length}, Fetched: ${metadataAccounts?.length}`
//       )
//       return NextResponse.json(
//         { error: 'Failed to fetch metadata accounts' },
//         { status: 500 }
//       )
//     }

//     // Decode metadata accounts
//     const tokens = await Promise.all(
//       metadataPDAs.map(async (pda, index) => {
//         const account = metadataAccounts[index]
//         const tokenAccountAddress = allAccounts[index]?.pubkey.toBase58()
//         const tokenAddress = mintAddresses[index]
//         const amount =
//           allAccounts[index]?.account.data.parsed.info.tokenAmount.uiAmount || 0

//         // Handle missing or invalid accounts
//         if (!account || !account.data) {
//           logger.warn(`Metadata not found for token mint ${tokenAddress}`)
//           return {
//             token_account_address: tokenAccountAddress || 'Unknown',
//             token_address: tokenAddress || 'Unknown',
//             token_image: null,
//             amount,
//             name: null,
//             symbol: null,
//           }
//         }

//         try {
//           // Prepare RPC account
//           const rpcAccount = {
//             data: new Uint8Array(account.data), // Convert Buffer to Uint8Array
//             executable: false,
//             owner: fromWeb3JsPublicKey(METADATA_PROGRAM_ID), // Convert PublicKey
//             lamports: sol(amount), // SolAmount conversion
//             publicKey: fromWeb3JsPublicKey(pda), // Convert PublicKey
//           }

//           // Deserialize metadata
//           const metadata = deserializeMetadata(rpcAccount)
//           const tokenImage = metadata.uri
//             ? await fetchImage(metadata.uri)
//             : null

//           return {
//             token_account_address: tokenAccountAddress,
//             token_address: tokenAddress,
//             token_image: tokenImage,
//             amount,
//             name: metadata.name || null,
//             symbol: metadata.symbol || null,
//           }
//         } catch (error) {
//           logger.error(
//             `Error deserializing metadata for token mint ${tokenAddress}: ${error}`
//           )
//           return {
//             token_account_address: tokenAccountAddress || 'Unknown',
//             token_address: tokenAddress || 'Unknown',
//             token_image: null,
//             amount,
//             name: null,
//             symbol: null,
//           }
//         }
//       })
//     )

//     return NextResponse.json({ success: true, data: tokens })
//   } catch (error) {
//     logger.error(`Failed to fetch token accounts or metadata: ${error}`)
//     return NextResponse.json(
//       { error: 'Failed to fetch token data' },
//       { status: 500 }
//     )
//   }
// }
