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
  it('has TOKEN_CREATOR identifier', () => {
    expect(SERVICE_IDENTIFIERS.TOKEN_CREATOR).toBe('token-creator-service')
  })

  it('has TOKEN_BURNER identifier', () => {
    expect(SERVICE_IDENTIFIERS.TOKEN_BURNER).toBe('burn-tokens-service')
  })

  it('has FREEZE_ACCOUNTS identifier', () => {
    expect(SERVICE_IDENTIFIERS.FREEZE_ACCOUNTS).toBe('freeze-accounts-service')
  })

  it('has UNFREEZE_ACCOUNTS identifier', () => {
    expect(SERVICE_IDENTIFIERS.UNFREEZE_ACCOUNTS).toBe('unfreeze-accounts-service')
  })

  it('has AUTHORITY_MANAGEMENT identifier', () => {
    expect(SERVICE_IDENTIFIERS.AUTHORITY_MANAGEMENT).toBe('authority-management-service')
  })

  it('has TRANSACTION_MULTISENDER identifier', () => {
    expect(SERVICE_IDENTIFIERS.TRANSACTION_MULTISENDER).toBe('transaction-multisender-service')
  })

  it('has CREATE_LIQUIDITY identifier', () => {
    expect(SERVICE_IDENTIFIERS.CREATE_LIQUIDITY).toBe('create-liquidity-service')
  })

  it('has PORTFOLIO_TRACKER identifier', () => {
    expect(SERVICE_IDENTIFIERS.PORTFOLIO_TRACKER).toBe('portfolio-tracker-service')
  })

  it('has exactly 8 service identifiers', () => {
    expect(Object.keys(SERVICE_IDENTIFIERS)).toHaveLength(8)
  })

  it('all service identifiers end with -service', () => {
    Object.values(SERVICE_IDENTIFIERS).forEach((id) => {
      expect(id).toMatch(/-service$/)
    })
  })
})

// ─── createServiceMemoInstruction ─────────────────────────────────────────────

describe('createServiceMemoInstruction', () => {
  it('returns a TransactionInstruction', () => {
    const instruction = createServiceMemoInstruction(SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    expect(instruction).toBeInstanceOf(TransactionInstruction)
  })

  it('uses the official Memo Program ID', () => {
    const instruction = createServiceMemoInstruction(SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    expect(instruction.programId.toBase58()).toBe(MEMO_PROGRAM_ID)
  })

  it('has empty keys array', () => {
    const instruction = createServiceMemoInstruction(SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    expect(instruction.keys).toHaveLength(0)
  })

  it('encodes the service ID in the data buffer', () => {
    const serviceId = SERVICE_IDENTIFIERS.TOKEN_CREATOR
    const instruction = createServiceMemoInstruction(serviceId)
    const decodedMemo = Buffer.from(instruction.data).toString('utf8')
    expect(decodedMemo).toBe(serviceId)
  })

  it('encodes serviceId:additionalData when additionalData is provided', () => {
    const serviceId = SERVICE_IDENTIFIERS.TOKEN_BURNER
    const additionalData = 'mintAddr=abc123'
    const instruction = createServiceMemoInstruction(serviceId, additionalData)
    const decodedMemo = Buffer.from(instruction.data).toString('utf8')
    expect(decodedMemo).toBe(`${serviceId}:${additionalData}`)
  })

  it('does not include colon when no additionalData is given', () => {
    const instruction = createServiceMemoInstruction(SERVICE_IDENTIFIERS.FREEZE_ACCOUNTS)
    const decodedMemo = Buffer.from(instruction.data).toString('utf8')
    expect(decodedMemo).not.toContain(':')
  })

  it('works for all service identifiers', () => {
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
  it('adds a memo instruction to the transaction', () => {
    const transaction = new Transaction()
    const initialInstructionCount = transaction.instructions.length
    addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    expect(transaction.instructions).toHaveLength(initialInstructionCount + 1)
  })

  it('the added instruction uses the Memo Program ID', () => {
    const transaction = new Transaction()
    addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    const addedInstruction = transaction.instructions[transaction.instructions.length - 1]
    expect(addedInstruction.programId.toBase58()).toBe(MEMO_PROGRAM_ID)
  })

  it('the added instruction has the correct memo data', () => {
    const transaction = new Transaction()
    const serviceId = SERVICE_IDENTIFIERS.AUTHORITY_MANAGEMENT
    addServiceMemo(transaction, serviceId)
    const addedInstruction = transaction.instructions[transaction.instructions.length - 1]
    const decodedMemo = Buffer.from(addedInstruction.data).toString('utf8')
    expect(decodedMemo).toBe(serviceId)
  })

  it('includes additionalData in the memo when provided', () => {
    const transaction = new Transaction()
    const serviceId = SERVICE_IDENTIFIERS.CREATE_LIQUIDITY
    const additionalData = 'pool=xyz789'
    addServiceMemo(transaction, serviceId, additionalData)
    const addedInstruction = transaction.instructions[transaction.instructions.length - 1]
    const decodedMemo = Buffer.from(addedInstruction.data).toString('utf8')
    expect(decodedMemo).toBe(`${serviceId}:${additionalData}`)
  })

  it('the added instruction has empty keys', () => {
    const transaction = new Transaction()
    addServiceMemo(transaction, SERVICE_IDENTIFIERS.PORTFOLIO_TRACKER)
    const addedInstruction = transaction.instructions[transaction.instructions.length - 1]
    expect(addedInstruction.keys).toHaveLength(0)
  })

  it('can add multiple memo instructions to the same transaction', () => {
    const transaction = new Transaction()
    addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_CREATOR)
    addServiceMemo(transaction, SERVICE_IDENTIFIERS.TOKEN_BURNER)
    expect(transaction.instructions).toHaveLength(2)
  })

  it('produces a TransactionInstruction identical to createServiceMemoInstruction', () => {
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
  it('returns an object with all service identifiers initialized to 0', async () => {
    const result = await extractServiceUsageFromSignatures([])
    Object.values(SERVICE_IDENTIFIERS).forEach((serviceId) => {
      expect(result[serviceId as ServiceIdentifier]).toBe(0)
    })
  })

  it('returns an object for non-empty signature arrays (placeholder behavior)', async () => {
    const result = await extractServiceUsageFromSignatures(['sig1', 'sig2'])
    expect(typeof result).toBe('object')
    // All values should be 0 since parsing is not implemented
    Object.values(result).forEach((count) => {
      expect(count).toBe(0)
    })
  })
})
