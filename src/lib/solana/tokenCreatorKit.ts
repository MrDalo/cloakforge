/**
 * Modern SPL Token 2022 Creator using Solana Kit
 *
 * This is a hybrid implementation using:
 * - @solana/kit for modern RPC connection and balance checks
 * - Legacy SPL Token libraries for Token 2022 operations
 * - Embedded metadata using Token 2022's metadata extension
 * - Pinata IPFS for off-chain metadata storage
 */

import { createSolanaRpc, address, type Address } from '@solana/kit'

// Legacy imports for Token 2022 (until Kit has full support)
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, ComputeBudgetProgram } from '@solana/web3.js'
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
  getMintLen,
  ExtensionType,
  createInitializeMetadataPointerInstruction,
  TYPE_SIZE,
  LENGTH_SIZE,
} from '@solana/spl-token'

import { createInitializeInstruction, createUpdateFieldInstruction, pack, TokenMetadata } from '@solana/spl-token-metadata'

import { uploadFileToIPFS, uploadJSONToIPFS } from '../ipfs/utils'
import getConfig from '@/lib/config/config'
import { TokenCreatorFormData } from '@/components/pages/TokenCreatorPage/TokenCreationForm/tokenCreatorFormSchema'

export interface TokenCreationResult {
  mintAddress: string
  signature: string
  metadata: {
    name: string
    symbol: string
    uri: string
    imageUri: string
  }
}

/**
 * Creates a new SPL Token 2022 with embedded metadata using Solana Kit for RPC
 * and legacy libraries for Token 2022 operations
 */
export const createTokenWithSolanaKit = async (
  walletAddress: Address | string,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
  tokenData: TokenCreatorFormData
): Promise<TokenCreationResult> => {
  // Convert to legacy PublicKey for compatibility
  const walletPubkey = new PublicKey(typeof walletAddress === 'string' ? walletAddress : walletAddress)

  // Input validation
  if (!walletPubkey) {
    throw new Error('Wallet address is required')
  }
  if (!signTransaction) {
    throw new Error('Transaction signing function is required')
  }
  if (!tokenData.name?.trim()) {
    throw new Error('Token name is required')
  }
  if (tokenData.name.trim().length > 32) {
    throw new Error('Token name must be 32 characters or less')
  }
  if (!tokenData.symbol?.trim()) {
    throw new Error('Token symbol is required')
  }
  if (tokenData.symbol.trim().length > 10) {
    throw new Error('Token symbol must be 10 characters or less')
  }
  if (!tokenData.totalSupply || Number(tokenData.totalSupply) <= 0) {
    throw new Error('Valid total supply is required')
  }
  if (Number(tokenData.totalSupply) > Number.MAX_SAFE_INTEGER) {
    throw new Error('Total supply is too large')
  }

  // Setup connections - use Kit RPC for modern connection and legacy Connection for compatibility
  const { rpcEndpoint } = getConfig()
  const kitRpc = createSolanaRpc(rpcEndpoint)
  const legacyConnection = new Connection(rpcEndpoint, 'confirmed')

  try {
    // Use Kit RPC for balance check (more efficient)
    const kitWalletAddress = address(walletPubkey.toString())
    const walletBalance = await kitRpc.getBalance(kitWalletAddress).send()
    const estimatedCost = 10000000 // 0.01 SOL in lamports

    if (Number(walletBalance) < estimatedCost) {
      throw new Error(`Insufficient funds. Need at least 0.01 SOL, but wallet has ${Number(walletBalance) / 1000000000} SOL`)
    }

    // Setup mint configuration
    const mintKeypair = Keypair.generate()
    const mintAddress = mintKeypair.publicKey
    const decimals = Number(tokenData.decimals)
    const supply = Number(tokenData.totalSupply)

    // Validate decimals
    if (decimals < 0 || decimals > 9) {
      throw new Error('Decimals must be between 0 and 9')
    }

    // Upload image and create metadata
    let imageUri = ''
    if (tokenData.logo) {
      try {
        imageUri = await uploadFileToIPFS(tokenData.logo)
      } catch (error) {
        throw new Error(`Failed to upload image to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } else {
      imageUri = 'https://ipfs.io/ipfs/bafkreib32upwnobzayvo3lt6e6myvjtgfcocl5ge3gjuecxocb4v7ypdku'
    }

    // Create comprehensive off-chain metadata
    const offChainMetadata = {
      name: tokenData.name,
      symbol: tokenData.symbol,
      description: tokenData.description || '',
      image: imageUri,
      external_url: tokenData.website || '',
      attributes: [],
      properties: {
        files: [
          {
            uri: imageUri,
            type: 'image/png',
          },
        ],
        category: 'image',
        creators: [
          {
            address: walletPubkey.toString(),
            share: 100,
          },
        ],
      },
      ...(tokenData.twitter && { twitter: tokenData.twitter }),
      ...(tokenData.telegram && { telegram: tokenData.telegram }),
      ...(tokenData.website && { website: tokenData.website }),
      ...(tokenData.discord && { discord: tokenData.discord }),
      createdWith: 'CryptoForge',
      createdAt: new Date().toISOString(),
    }

    let metadataUri: string
    try {
      metadataUri = await uploadJSONToIPFS(offChainMetadata)
    } catch (error) {
      throw new Error(`Failed to upload metadata to IPFS: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Create on-chain metadata object
    const additionalMetadata: [string, string][] = [
      ['description', tokenData.description || ''],
      ['created_with', 'CryptoForge'],
      ['created_at', new Date().toISOString()],
    ]

    if (tokenData.website) {
      additionalMetadata.push(['website', tokenData.website])
    }
    if (tokenData.twitter) {
      additionalMetadata.push(['twitter', tokenData.twitter])
    }
    if (tokenData.telegram) {
      additionalMetadata.push(['telegram', tokenData.telegram])
    }
    if (tokenData.discord) {
      additionalMetadata.push(['discord', tokenData.discord])
    }

    const metadata: TokenMetadata = {
      mint: mintAddress,
      name: tokenData.name,
      symbol: tokenData.symbol,
      uri: metadataUri,
      additionalMetadata,
    }

    // Calculate required space for the mint account with safety buffer
    const mintLen = getMintLen([ExtensionType.MetadataPointer])
    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length
    const safetyBuffer = 200
    const totalLen = mintLen + metadataLen + safetyBuffer

    // Validate space requirements
    if (totalLen > 10 * 1024 * 1024) {
      throw new Error('Token metadata is too large')
    }

    // Get rent exemption amount using legacy connection
    const lamportsForRent = await legacyConnection.getMinimumBalanceForRentExemption(totalLen)

    // Build transaction instructions using legacy approach for Token 2022
    const transaction = new Transaction()

    // Add compute budget instructions for better transaction reliability
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 400_000,
      })
    )

    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1,
      })
    )

    // Create mint account
    const createMintAccountIx = SystemProgram.createAccount({
      fromPubkey: walletPubkey,
      newAccountPubkey: mintAddress,
      space: totalLen,
      lamports: lamportsForRent,
      programId: TOKEN_2022_PROGRAM_ID,
    })
    transaction.add(createMintAccountIx)

    // Initialize metadata pointer (pointing to the mint itself)
    const initMetadataPointerIx = createInitializeMetadataPointerInstruction(mintAddress, walletPubkey, mintAddress, TOKEN_2022_PROGRAM_ID)
    transaction.add(initMetadataPointerIx)

    // Initialize mint
    const initMintIx = createInitializeMintInstruction(mintAddress, decimals, walletPubkey, walletPubkey, TOKEN_2022_PROGRAM_ID)
    transaction.add(initMintIx)

    // Initialize metadata inside the mint
    const initMetadataIx = createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      mint: mintAddress,
      metadata: mintAddress,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
      mintAuthority: walletPubkey,
      updateAuthority: walletPubkey,
    })
    transaction.add(initMetadataIx)

    // Add additional metadata fields
    for (const [key, value] of metadata.additionalMetadata) {
      if (value && value.trim()) {
        const updateFieldIx = createUpdateFieldInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          metadata: mintAddress,
          updateAuthority: walletPubkey,
          field: key,
          value,
        })
        transaction.add(updateFieldIx)
      }
    }

    // Create associated token account and mint tokens
    const userTokenAccount = await getAssociatedTokenAddress(mintAddress, walletPubkey, false, TOKEN_2022_PROGRAM_ID)

    const createAtaIx = createAssociatedTokenAccountInstruction(
      walletPubkey,
      userTokenAccount,
      walletPubkey,
      mintAddress,
      TOKEN_2022_PROGRAM_ID
    )
    transaction.add(createAtaIx)

    // Calculate mint amount with decimals
    const mintAmount = supply * Math.pow(10, decimals)

    const mintToIx = createMintToInstruction(mintAddress, userTokenAccount, walletPubkey, mintAmount, [], TOKEN_2022_PROGRAM_ID)
    transaction.add(mintToIx)

    // Handle authority revocation if requested
    if (tokenData.revokeMintAuthority) {
      const revokeMintAuthorityIx = createSetAuthorityInstruction(
        mintAddress,
        walletPubkey,
        AuthorityType.MintTokens,
        null,
        [],
        TOKEN_2022_PROGRAM_ID
      )
      transaction.add(revokeMintAuthorityIx)
    }

    if (tokenData.revokeUpdateAuthority) {
      const revokeUpdateAuthorityIx = createSetAuthorityInstruction(
        mintAddress,
        walletPubkey,
        AuthorityType.FreezeAccount,
        null,
        [],
        TOKEN_2022_PROGRAM_ID
      )
      transaction.add(revokeUpdateAuthorityIx)
    }

    // Finalize transaction
    transaction.feePayer = walletPubkey
    const { blockhash } = await legacyConnection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash

    // Sign with mint keypair
    transaction.partialSign(mintKeypair)

    // Sign with wallet
    const signedTransaction = await signTransaction(transaction)

    // Send transaction
    const signature = await legacyConnection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    })

    // Confirm transaction
    await legacyConnection.confirmTransaction(signature, 'confirmed')

    return {
      mintAddress: mintAddress.toString(),
      signature,
      metadata: {
        name: tokenData.name,
        symbol: tokenData.symbol,
        uri: metadataUri,
        imageUri,
      },
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('Token creation failed with unknown error')
  }
}

export default createTokenWithSolanaKit
