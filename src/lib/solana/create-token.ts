/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} from '@solana/web3.js'
import {
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from '@solana/spl-token'
import getConfig from '@/lib/config/config'
import { TokenCreatorFormSchemaType } from '@/components/token-creator/token-creator-form/token-creator-form-schema'
import { uploadFileToIPFS, uploadJSONToIPFS } from '../ipfs/utils'

/**
 * Creates an SPL 2022 token.
 *
 * @param walletPublicKey - the connected wallet's public key.
 * @param signTransaction - a function to sign transactions from the wallet adapter.
 * @param tokenData - the data from your token creator form.
 * @returns The mint public key as a string.
 */
const createToken = async (
  walletPublicKey: PublicKey,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  tokenData: TokenCreatorFormSchemaType
): Promise<string> => {
  // 1. Set up the connection.
  const { rpcEndpoint } = getConfig()
  const connection = new Connection(rpcEndpoint, 'confirmed')

  // 2. Create the mint account.
  const mint = Keypair.generate()
  const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE)

  const createMintAccountIx = SystemProgram.createAccount({
    fromPubkey: walletPublicKey,
    newAccountPubkey: mint.publicKey,
    space: MINT_SIZE,
    lamports,
    programId: TOKEN_2022_PROGRAM_ID,
  })

  const initMintIx = createInitializeMintInstruction(
    mint.publicKey,
    tokenData.decimal,
    walletPublicKey, // mint authority
    walletPublicKey, // freeze authority
    TOKEN_2022_PROGRAM_ID
  )

  const transaction = new Transaction()
  transaction.add(createMintAccountIx, initMintIx)

  // 3. Revoke authorities if requested.
  if (tokenData.revoke_mint_authority) {
    const revokeMintAuthorityIx = createSetAuthorityInstruction(
      mint.publicKey,
      walletPublicKey,
      AuthorityType.MintTokens,
      null,
      [],
      TOKEN_2022_PROGRAM_ID
    )
    transaction.add(revokeMintAuthorityIx)
  }

  if (tokenData.revoke_freeze_authority) {
    const revokeFreezeAuthorityIx = createSetAuthorityInstruction(
      mint.publicKey,
      walletPublicKey,
      AuthorityType.FreezeAccount,
      null,
      [],
      TOKEN_2022_PROGRAM_ID
    )
    transaction.add(revokeFreezeAuthorityIx)
  }

  // 4. Create the associated token account and mint tokens.
  const userTokenAccount = await getAssociatedTokenAddress(
    mint.publicKey,
    walletPublicKey
  )
  const createAtaIx = createAssociatedTokenAccountInstruction(
    walletPublicKey, // payer
    userTokenAccount,
    walletPublicKey,
    mint.publicKey,
    TOKEN_2022_PROGRAM_ID
  )
  transaction.add(createAtaIx)

  const mintToIx = createMintToInstruction(
    mint.publicKey,
    userTokenAccount,
    walletPublicKey,
    tokenData.supply
  )
  transaction.add(mintToIx)

  // 5. Upload image and metadata to IPFS via Pinata.
  let imageUri = ''
  if (tokenData.logo) {
    imageUri = await uploadFileToIPFS(tokenData.logo)
  } else {
    imageUri =
      'https://ipfs.io/ipfs/bafkreib32upwnobzayvo3lt6e6myvjtgfcocl5ge3gjuecxocb4v7ypdku'
  }

  const metadataContent = {
    name: tokenData.token_name,
    symbol: tokenData.token_symbol,
    description: tokenData.description,
    image: imageUri,
    twitter: tokenData.twitter,
    telegram: tokenData.telegram,
    website: tokenData.website,
    createdOn: 'https://cryptoforge.app/',
  }
  const metadataUri = await uploadJSONToIPFS(metadataContent)

  // 6. Create on‑chain metadata via the Metaplex token metadata program.
  const metadataProgramId = new PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  )
  const [metadataPDA] = await PublicKey.findProgramAddress(
    [
      Buffer.from('metadata'),
      metadataProgramId.toBuffer(),
      mint.publicKey.toBuffer(),
    ],
    metadataProgramId
  )

  const metadataData = {
    name: tokenData.token_name,
    symbol: tokenData.token_symbol,
    uri: metadataUri,
    sellerFeeBasisPoints: 0,
    creators: [
      {
        address: walletPublicKey.toBase58(),
        verified: true,
        share: 100,
      },
    ],
  }

  // const metadataIx = CreateMetadataAccountV3InstructionData(
  //   {
  //     metadata: metadataPDA,
  //     mint: mint.publicKey,
  //     mintAuthority: walletPublicKey,
  //     payer: walletPublicKey,
  //     updateAuthority: walletPublicKey,
  //   },
  //   {
  //     createMetadataAccountArgsV2: {
  //       data: metadataData,
  //       isMutable: !tokenData.immutable,
  //     },
  //   }
  // )
  // transaction.add(metadataIx)

  // 7. Finalize and send the transaction.
  transaction.feePayer = walletPublicKey
  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash

  transaction.partialSign(mint)
  const signedTx = await signTransaction(transaction)
  const txid = await connection.sendRawTransaction(signedTx.serialize())
  await connection.confirmTransaction(txid, 'confirmed')

  return mint.publicKey.toBase58()
}

export default createToken
