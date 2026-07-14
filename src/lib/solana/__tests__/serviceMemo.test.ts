/**
 * Unit tests for src/lib/solana/serviceMemo.ts
 */

import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/logger/logger', () => ({
  getLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

import { Transaction, TransactionInstruction } from '@solana/web3.js'
import {
  SERVICE_IDENTIFIERS,
  addServiceMemo,
  createServiceMemoInstruction,
  extractServiceUsageFromSignatures,
  type ServiceIdentifier,
} from '../serviceMemo'

const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'

// ─── SERVICE_IDENTIFIERS ───────────────────────────────────────────────────────

describe('SERVICE_IDENTIFIERS', () => {
  it('should has TOKEN_CREATOR identifier', () => {
    expect(SERVICE_IDENTIFIERS.TOKEN_CREATOR).toBe('token-creator-service')
  })

  it('should has TOKEN_BURNER identifier', () => {
    expect(SERVICE_IDENTIFIERS.TOKEN_BURNER).toBe('burn-tokens-service')
  })

  it('should has FREEZE_WALLETS identifier', () => {
    expect(SERVICE_IDENTIFIERS.FREEZE_WALLETS).toBe('freeze-wallets-service')
  })

  it('should has UNFREEZE_WALLETS identifier', () => {
    expect(SERVICE_IDENTIFIERS.UNFREEZE_WALLETS).toBe('unfreeze-wallets-service')
  })

  it('should has AUTHORITY_MANAGEMENT identifier', () => {
    expect(SERVICE_IDENTIFIERS.AUTHORITY_MANAGEMENT).toBe('authority-management-service')
  })

  it('should has TRANSACTION_MULTISENDER identifier', () => {
    expect(SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER).toBe('transaction-multisender-service')
  })

  it('should has LIQUIDITY_PROVIDER identifier', () => {
    expect(SERVICE_IDENTIFIERS.LIQUIDITY_PROVIDER).toBe('liquidity-provider-service')
  })

  it('should has PORTFOLIO_TRACKER identifier', () => {
    expect(SERVICE_IDENTIFIERS.PORTFOLIO_TRACKER).toBe('portfolio-tracker-service')
  })

  it('should has DONATION identifier', () => {
    expect(SERVICE_IDENTIFIERS.DONATION).toBe('donation-service')
  })

  it('should has exactly 9 service identifiers', () => {
    expect(Object.keys(SERVICE_IDENTIFIERS)).toHaveLength(9)
  })

  it('should all service identifiers end with -service', () => {
    Object.values(SERVICE_IDENTIFIERS).forEach((id) => {
      expect(id).toMatch(/-service$/)
    })
  })
})

// ─── createServiceMemoInstruction ─────────────────────────────────────────────

describe('createServiceMemoInstruction', () => {
  it('should returns a TransactionInstruction', () => {
    const instruction = createServiceMemoInstruction(SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    expect(instruction).toBeInstanceOf(TransactionInstruction)
  })

  it('should uses the official Memo Program ID', () => {
    const instruction = createServiceMemoInstruction(SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    expect(instruction.programId.toBase58()).toBe(MEMO_PROGRAM_ID)
  })

  it('should has empty keys array', () => {
    const instruction = createServiceMemoInstruction(SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    expect(instruction.keys).toHaveLength(0)
  })

  it('should encodes the service ID in the data buffer', () => {
    const serviceId = SERVICE_IDENTIFIERS.TOKEN_CREATOR
    const instruction = createServiceMemoInstruction(serviceId)
    const decodedMemo = Buffer.from(instruction.data).toString('utf8')
    expect(decodedMemo).toBe(serviceId)
  })

  it('should encodes serviceId:additionalData when additionalData is provided', () => {
    const serviceId = SERVICE_IDENTIFIERS.TOKEN_BURNER
    const additionalData = 'mintAddr=abc123'
    const instruction = createServiceMemoInstruction(serviceId, additionalData)
    const decodedMemo = Buffer.from(instruction.data).toString('utf8')
    expect(decodedMemo).toBe(`${serviceId}:${additionalData}`)
  })

  it('should does not include colon when no additionalData is given', () => {
    const instruction = createServiceMemoInstruction(SERVICE_IDENTIFIERS.FREEZE_WALLETS)
    const decodedMemo = Buffer.from(instruction.data).toString('utf8')
    expect(decodedMemo).not.toContain(':')
  })

  it('should works for all service identifiers', () => {
    Object.values(SERVICE_IDENTIFIERS).forEach((serviceId) => {
      const instruction = createServiceMemoInstruction(serviceId as ServiceIdentifier)
      expect(instruction).toBeInstanceOf(TransactionInstruction)
      const decodedMemo = Buffer.from(instruction.data).toString('utf8')
      expect(decodedMemo).toBe(serviceId)
    })
  })
})

// ─── addServiceMemo ────────────────────────────────────────────────────────────

describe('addServiceMemo', () => {
  it('should adds a memo instruction to the transaction', () => {
    const transaction = new Transaction()
    const initialInstructionCount = transaction.instructions.length
    addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    expect(transaction.instructions).toHaveLength(initialInstructionCount + 1)
  })

  it('should the added instruction uses the Memo Program ID', () => {
    const transaction = new Transaction()
    addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    const addedInstruction = transaction.instructions[transaction.instructions.length - 1]
    expect(addedInstruction.programId.toBase58()).toBe(MEMO_PROGRAM_ID)
  })

  it('should the added instruction has the correct memo data', () => {
    const transaction = new Transaction()
    const serviceId = SERVICE_IDENTIFIERS.AUTHORITY_MANAGEMENT
    addServiceMemo(transaction, serviceId)
    const addedInstruction = transaction.instructions[transaction.instructions.length - 1]
    const decodedMemo = Buffer.from(addedInstruction.data).toString('utf8')
    expect(decodedMemo).toBe(serviceId)
  })

  it('should includes additionalData in the memo when provided', () => {
    const transaction = new Transaction()
    const serviceId = SERVICE_IDENTIFIERS.LIQUIDITY_PROVIDER
    const additionalData = 'pool=xyz789'
    addServiceMemo(transaction, serviceId, additionalData)
    const addedInstruction = transaction.instructions[transaction.instructions.length - 1]
    const decodedMemo = Buffer.from(addedInstruction.data).toString('utf8')
    expect(decodedMemo).toBe(`${serviceId}:${additionalData}`)
  })

  it('should the added instruction has empty keys', () => {
    const transaction = new Transaction()
    addServiceMemo(transaction, SERVICE_IDENTIFIERS.PORTFOLIO_TRACKER)
    const addedInstruction = transaction.instructions[transaction.instructions.length - 1]
    expect(addedInstruction.keys).toHaveLength(0)
  })

  it('should can add multiple memo instructions to the same transaction', () => {
    const transaction = new Transaction()
    addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_BURNER)
    expect(transaction.instructions).toHaveLength(2)
  })

  it('should produces a TransactionInstruction identical to createServiceMemoInstruction', () => {
    const transaction = new Transaction()
    const serviceId = SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER
    const additionalData = 'batchSize=10'

    addServiceMemo(transaction, serviceId, additionalData)
    const fromAdd = transaction.instructions[0]
    const fromCreate = createServiceMemoInstruction(serviceId, additionalData)

    expect(Buffer.from(fromAdd.data).toString('utf8')).toBe(Buffer.from(fromCreate.data).toString('utf8'))
    expect(fromAdd.programId.toBase58()).toBe(fromCreate.programId.toBase58())
  })
})

// ─── extractServiceUsageFromSignatures ────────────────────────────────────────

describe('extractServiceUsageFromSignatures', () => {
  it('should returns an object with all service identifiers initialized to 0', async () => {
    const result = await extractServiceUsageFromSignatures([])
    Object.values(SERVICE_IDENTIFIERS).forEach((serviceId) => {
      expect(result[serviceId as ServiceIdentifier]).toBe(0)
    })
  })

  it('should returns an object for non-empty signature arrays (placeholder behavior)', async () => {
    const result = await extractServiceUsageFromSignatures(['sig1', 'sig2'])
    expect(typeof result).toBe('object')
    // All values should be 0 since parsing is not implemented
    Object.values(result).forEach((count) => {
      expect(count).toBe(0)
    })
  })
})
