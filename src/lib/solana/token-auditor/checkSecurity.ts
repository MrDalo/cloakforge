import { Connection, PublicKey } from '@solana/web3.js'
import { ExtensionType, getExtensionTypes, getTransferFeeConfig, unpackMint } from '@solana/spl-token'
import { parseMetaplexMetadata } from '@/lib/solana/getTokenMetadata'
import { SecurityAnalysis, Risk } from './types'
import { getLogger } from '@/lib/logger/logger'

const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

export async function checkSecurity(connection: Connection, mintAddress: string): Promise<SecurityAnalysis> {
  const logger = getLogger({ context: 'token-auditor', action: 'checkSecurity' })
  const mintPubkey = new PublicKey(mintAddress)
  const risks: Risk[] = []

  // Optimization: Fetch Mint and Metadata in a single RPC call
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), mintPubkey.toBuffer()],
    METADATA_PROGRAM_ID
  )

  const [mintAccountInfo, metadataAccountInfo] = await connection.getMultipleAccountsInfo([mintPubkey, metadataPDA])

  if (!mintAccountInfo) {
    throw new Error('Mint account not found')
  }

  // 1. Parse Mint Info
  const mintInfo = unpackMint(mintPubkey, mintAccountInfo, mintAccountInfo.owner)

  // 2. Check Authorities
  const mintAuthority = mintInfo.mintAuthority?.toString() || null
  const freezeAuthority = mintInfo.freezeAuthority?.toString() || null

  if (mintAuthority) {
    risks.push({
      level: 'CRITICAL',
      label: 'Mint Authority Active',
      description: 'The owner can mint infinite tokens and dump the price.',
      scorePenalty: 100,
    })
  }

  if (freezeAuthority) {
    risks.push({
      level: 'CRITICAL',
      label: 'Freeze Authority Active',
      description: 'The owner can freeze your wallet, preventing you from selling (Honeypot risk).',
      scorePenalty: 100,
    })
  }

  // 3. Check Token-2022 Extensions
  const extensions = getExtensionTypes(mintInfo.tlvData)
  const extensionNames = extensions.map((e) => ExtensionType[e])
  const isToken2022 = extensions.length > 0
  let transferFee = 0

  if (extensions.includes(ExtensionType.TransferFeeConfig)) {
    const transferFeeConfig = getTransferFeeConfig(mintInfo)
    if (transferFeeConfig) {
      const fee = Number(transferFeeConfig.newerTransferFee.transferFeeBasisPoints)
      transferFee = fee
      if (fee > 0) {
        risks.push({
          level: 'MEDIUM',
          label: 'Transfer Fee Enabled',
          description: `This token has a transfer tax of ${(fee / 100).toFixed(2)}%.`,
          scorePenalty: 10,
        })
      }
    }
  }

  if (extensions.includes(ExtensionType.TransferHook)) {
    risks.push({
      level: 'HIGH',
      label: 'Transfer Hook Enabled',
      description: 'This token has a transfer hook which can programmatically block transfers.',
      scorePenalty: 30,
    })
  }

  if (extensions.includes(ExtensionType.PermanentDelegate)) {
    risks.push({
      level: 'CRITICAL',
      label: 'Permanent Delegate Set',
      description: 'A permanent delegate can burn or transfer tokens from ANY account.',
      scorePenalty: 100,
    })
  }

  // 4. Check Metadata Mutability
  let isMutable = true // Default to true (risky) if not found
  let name = 'Unknown'
  let symbol = 'UNKNOWN'
  let image = ''

  if (metadataAccountInfo) {
    try {
      const metadata = await parseMetaplexMetadata(metadataAccountInfo.data)
      if (metadata) {
        isMutable = metadata.isMutable
        name = metadata.name.replace(/\0/g, '').trim()
        symbol = metadata.symbol.replace(/\0/g, '').trim()

        // Fetch image if URI exists
        if (metadata.uri) {
          try {
            const uri = metadata.uri.replace(/\0/g, '').trim()
            const response = await fetch(uri)
            const json = await response.json()
            if (json.image) image = json.image
          } catch (e) {
            logger.warn('Failed to fetch metadata URI', { error: e })
          }
        }
      }
    } catch (e) {
      logger.warn('Failed to unpack metadata', { error: e })
    }
  }

  if (isMutable) {
    risks.push({
      level: 'LOW', // Lowered from High because it's common for new projects
      label: 'Metadata is Mutable',
      description: 'The developer can change the token name, symbol, or image.',
      scorePenalty: 20,
    })
  }

  // Format supply
  const decimals = mintInfo.decimals
  const supply = (Number(mintInfo.supply) / Math.pow(10, decimals)).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })

  return {
    mintAuthority,
    freezeAuthority,
    isMutable,
    isToken2022,
    extensions: extensionNames,
    transferFee,
    risks,
    name,
    symbol,
    decimals,
    supply,
    image,
  }
}
