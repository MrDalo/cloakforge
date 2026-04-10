import { describe, it, expect } from 'vitest'
import { getSolanaEnvironment } from '../environmentUtils'

describe('getSolanaEnvironment', () => {
  // ---------------------------------------------------------------------------
  // Devnet
  // ---------------------------------------------------------------------------

  it('detects devnet by "devnet" substring', () => {
    const result = getSolanaEnvironment('https://api.devnet.solana.com')
    expect(result.name).toBe('Devnet')
    expect(result.variant).toBe('secondary')
    expect(result.description).toContain('testing')
  })

  it('is case-insensitive for devnet detection', () => {
    const result = getSolanaEnvironment('https://API.DEVNET.SOLANA.COM')
    expect(result.name).toBe('Devnet')
  })

  it('detects devnet in custom RPC with "devnet" in the URL', () => {
    const result = getSolanaEnvironment('https://my-devnet-node.example.com')
    expect(result.name).toBe('Devnet')
  })

  // ---------------------------------------------------------------------------
  // Testnet
  // ---------------------------------------------------------------------------

  it('detects testnet by "testnet" substring', () => {
    const result = getSolanaEnvironment('https://api.testnet.solana.com')
    expect(result.name).toBe('Testnet')
    expect(result.variant).toBe('outline')
    expect(result.description).toContain('validation')
  })

  it('is case-insensitive for testnet detection', () => {
    const result = getSolanaEnvironment('https://API.TESTNET.SOLANA.COM')
    expect(result.name).toBe('Testnet')
  })

  // ---------------------------------------------------------------------------
  // Mainnet
  // ---------------------------------------------------------------------------

  it('detects mainnet by "mainnet" substring', () => {
    const result = getSolanaEnvironment('https://api.mainnet-beta.solana.com')
    expect(result.name).toBe('Mainnet')
    expect(result.variant).toBe('default')
    expect(result.description).toContain('real SOL')
  })

  it('detects mainnet by full official domain', () => {
    const result = getSolanaEnvironment('https://api.mainnet-beta.solana.com')
    expect(result.name).toBe('Mainnet')
  })

  it('detects mainnet in custom RPC with "mainnet" in URL', () => {
    const result = getSolanaEnvironment('https://solana-mainnet.g.alchemy.com/v2/key')
    expect(result.name).toBe('Mainnet')
  })

  it('is case-insensitive for mainnet detection', () => {
    const result = getSolanaEnvironment('HTTPS://API.MAINNET-BETA.SOLANA.COM')
    expect(result.name).toBe('Mainnet')
  })

  // ---------------------------------------------------------------------------
  // Unknown
  // ---------------------------------------------------------------------------

  it('returns Unknown for unrecognised endpoint', () => {
    const result = getSolanaEnvironment('https://my-custom-rpc.example.com')
    expect(result.name).toBe('Unknown')
    expect(result.variant).toBe('destructive')
    expect(result.description).toContain('Unknown')
  })

  it('returns Unknown for a localhost endpoint', () => {
    const result = getSolanaEnvironment('http://localhost:8899')
    expect(result.name).toBe('Unknown')
    expect(result.variant).toBe('destructive')
  })

  it('returns Unknown for an empty string', () => {
    const result = getSolanaEnvironment('')
    expect(result.name).toBe('Unknown')
  })

  // ---------------------------------------------------------------------------
  // Priority: devnet takes precedence over testnet if both appear
  // ---------------------------------------------------------------------------

  it('devnet takes priority when URL contains both "devnet" and "testnet"', () => {
    const result = getSolanaEnvironment('https://devnet-testnet-node.example.com')
    expect(result.name).toBe('Devnet')
  })
})
