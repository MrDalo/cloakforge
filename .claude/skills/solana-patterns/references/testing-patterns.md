# Solana Testing Patterns — Reference

## Contents
1. [Server Utility Tests](#1-server-utility-tests)
2. [API Route Tests](#2-api-route-tests)
3. [Hook Tests](#3-hook-tests)
4. [Schema Tests](#4-schema-tests)
5. [Mock Setups](#5-mock-setups)

---

## 1. Server Utility Tests

```typescript
// src/lib/solana/server-side/__tests__/createMyTransaction.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMyTransaction } from '../createMyTransaction'
import { AppError } from '@/lib/errors'

vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn().mockReturnValue({
    rpcPrivateEndpoint: 'https://mock-rpc.com',
    feeWalletAddress: '11111111111111111111111111111112',
  }),
}))

vi.mock('@/lib/solana', () => ({
  createConnectionPair: vi.fn().mockReturnValue({
    kitRpc: {},
    legacyConnection: {
      getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'mock-blockhash' }),
      getBalance: vi.fn().mockResolvedValue(1_000_000_000), // 1 SOL
      getParsedAccountInfo: vi.fn().mockResolvedValue({
        value: {
          owner: { equals: vi.fn().mockReturnValue(true) },
          data: {
            program: 'spl-token',
            parsed: {
              info: {
                mint: 'mock-mint',
                owner: 'mock-wallet',
                tokenAmount: { amount: '1000000', decimals: 6, uiAmount: 1.0 },
                state: 'initialized',
              },
            },
          },
        },
      }),
    },
  }),
  addComputeBudgetInstructions: vi.fn(),
  calculateDynamicPriorityFee: vi.fn().mockResolvedValue(1_000),
  lamportsToSol: vi.fn().mockReturnValue(1.0),
}))

vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: vi.fn().mockResolvedValue({ baseFee: 0.009 }),
}))

vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn().mockReturnValue({
    info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn(),
  }),
}))

describe('createMyTransaction', () => {
  const validParams = {
    walletPublicKey: { toString: () => 'mock-wallet', equals: vi.fn() } as any,
    tokenAddress: 'mock-token-address',
  }

  it('should return a serializable transaction on valid input', async () => {
    const result = await createMyTransaction(validParams)
    expect(result.transaction).toBeDefined()
    expect(() => result.transaction.serialize({ requireAllSignatures: false })).not.toThrow()
  })

  it('should throw UNAUTHORIZED when wallet is not the authority', async () => {
    // Arrange: mock getMint to return different authority
    await expect(createMyTransaction({ ...validParams, walletPublicKey: 'wrong-wallet' as any }))
      .rejects.toThrow(AppError)
  })

  it('should throw TOKEN_NOT_FOUND when account does not exist', async () => {
    vi.mocked(require('@/lib/solana').createConnectionPair).mockReturnValueOnce({
      kitRpc: {},
      legacyConnection: { getAccountInfo: vi.fn().mockResolvedValue(null) },
    })
    await expect(createMyTransaction(validParams)).rejects.toMatchObject({ code: 'TOKEN_NOT_FOUND' })
  })

  it('should throw INSUFFICIENT_FUNDS when SOL balance is too low', async () => {
    vi.mocked(require('@/lib/solana').lamportsToSol).mockReturnValueOnce(0.0)
    await expect(createMyTransaction(validParams)).rejects.toMatchObject({ code: 'INSUFFICIENT_FUNDS' })
  })
})
```

---

## 2. API Route Tests

```typescript
// src/app/api/solana/my-tool/__tests__/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '../route'

vi.mock('@/lib/solana/server-side/createMyTransaction', () => ({
  createMyTransaction: vi.fn().mockResolvedValue({
    transaction: { serialize: vi.fn().mockReturnValue(Buffer.from('mock-tx')) },
  }),
}))

describe('POST /api/solana/my-tool', () => {
  const validBody = {
    walletAddress: 'DqXFjUGKKY9VT6LCr2zVGJgNL1QKC6CaS4LDN8RfzMGf',
    tokenAddress: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  }

  it('should return 200 with serialized transaction on valid input', async () => {
    const request = new NextRequest('http://localhost/api/solana/my-tool', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.serializedTransaction).toBeDefined()
  })

  it('should return 400 on invalid wallet address', async () => {
    const request = new NextRequest('http://localhost/api/solana/my-tool', {
      method: 'POST',
      body: JSON.stringify({ ...validBody, walletAddress: 'invalid' }),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should return 400 on missing required fields', async () => {
    const request = new NextRequest('http://localhost/api/solana/my-tool', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('should return 500 when server utility throws unexpected error', async () => {
    vi.mocked(require('@/lib/solana/server-side/createMyTransaction').createMyTransaction)
      .mockRejectedValueOnce(new Error('RPC timeout'))
    const request = new NextRequest('http://localhost/api/solana/my-tool', {
      method: 'POST',
      body: JSON.stringify(validBody),
    })
    const response = await POST(request)
    expect(response.status).toBeGreaterThanOrEqual(400)
  })
})
```

---

## 3. Hook Tests

```typescript
// src/hooks/solana/__tests__/useMyTool.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMyTool } from '../useMyTool'

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    connected: true,
    publicKey: { toString: () => 'mock-wallet' },
    signTransaction: vi.fn(async (tx) => tx),
  })),
  useConnection: vi.fn(() => ({
    connection: {
      getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'fresh-hash' }),
      sendRawTransaction: vi.fn().mockResolvedValue('mock-sig'),
      getParsedAccountInfo: vi.fn().mockResolvedValue({ value: null }),
    },
  })),
}))

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: vi.fn().mockResolvedValue({
    serializedTransaction: Buffer.from('mock-transaction').toString('base64'),
  }),
}))

vi.mock('@/lib/solana', () => ({
  confirmTransactionWithParallelStrategy: vi.fn().mockResolvedValue({ confirmed: true }),
  createConnectionPair: vi.fn().mockReturnValue({ kitRpc: {} }),
}))

describe('useMyTool', () => {
  it('should execute successfully with connected wallet', async () => {
    const { result } = renderHook(() => useMyTool())
    let toolResult: unknown
    await act(async () => {
      toolResult = await result.current.execute({ tokenAddress: 'mock-address' })
    })
    expect(toolResult).toBeDefined()
  })

  it('should set isExecuting true during execution', async () => {
    const { result } = renderHook(() => useMyTool())
    let executingDuringCall = false
    // Check isExecuting flips during async call
    vi.mocked(require('@/lib/utils/apiClient').apiClient).mockImplementationOnce(async () => {
      executingDuringCall = result.current.isExecuting
      return { serializedTransaction: Buffer.from('tx').toString('base64') }
    })
    await act(async () => { await result.current.execute({ tokenAddress: 'mock' }) })
    expect(executingDuringCall).toBe(true)
  })

  it('should handle user wallet rejection gracefully', async () => {
    vi.mocked(require('@solana/wallet-adapter-react').useWallet).mockReturnValueOnce({
      connected: true,
      publicKey: { toString: () => 'mock-wallet' },
      signTransaction: vi.fn().mockRejectedValue(new Error('User rejected the request.')),
    })
    const { result } = renderHook(() => useMyTool())
    const toolResult = await act(async () => result.current.execute({ tokenAddress: 'mock' }))
    expect(toolResult).toBeNull()
  })
})
```

---

## 4. Schema Tests

```typescript
// src/lib/schemas/__tests__/myToolSchema.test.ts
import { describe, it, expect } from 'vitest'
import { myToolRequestSchema } from '../apiSchemas'

const VALID_SOLANA_ADDRESS = 'DqXFjUGKKY9VT6LCr2zVGJgNL1QKC6CaS4LDN8RfzMGf'

describe('myToolRequestSchema', () => {
  it('should accept valid input', () => {
    expect(() => myToolRequestSchema.parse({
      walletAddress: VALID_SOLANA_ADDRESS,
      tokenAddress: VALID_SOLANA_ADDRESS,
    })).not.toThrow()
  })

  it('should reject invalid Solana address format', () => {
    expect(() => myToolRequestSchema.parse({
      walletAddress: 'not-a-valid-address',
      tokenAddress: VALID_SOLANA_ADDRESS,
    })).toThrow('Invalid Solana address')
  })

  it('should reject missing required fields', () => {
    expect(() => myToolRequestSchema.parse({ walletAddress: VALID_SOLANA_ADDRESS }))
      .toThrow()
  })

  it('should reject amount = 0', () => {
    expect(() => myToolRequestSchema.parse({
      walletAddress: VALID_SOLANA_ADDRESS,
      tokenAddress: VALID_SOLANA_ADDRESS,
      amount: 0,
    })).toThrow()
  })
})
```

---

## 5. Mock Setups

### Standard Server Utility Mock Block
```typescript
vi.mock('@/lib/config/getServerConfig', () => ({
  default: vi.fn().mockReturnValue({
    rpcPrivateEndpoint: 'https://mock-rpc.com',
    feeWalletAddress: '11111111111111111111111111111112',
  }),
}))
vi.mock('@/lib/logger/logger', () => ({
  getLogger: vi.fn().mockReturnValue({ info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}))
vi.mock('@/lib/errors', () => ({
  AppError: class AppError extends Error {
    constructor(public code: string, message: string) { super(message) }
  },
}))
vi.mock('@/lib/contentful/toolConfigCache', () => ({
  getCachedToolConfig: vi.fn().mockResolvedValue({ baseFee: 0.009, networkFee: 0.0005 }),
}))
```

### Standard Hook Mock Block
```typescript
vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: vi.fn(() => ({
    connected: true,
    publicKey: { toString: () => 'DqXFjUGKKY9VT6LCr2zVGJgNL1QKC6CaS4LDN8RfzMGf' },
    signTransaction: vi.fn(async (tx) => tx),
  })),
  useConnection: vi.fn(() => ({
    connection: {
      getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: 'mock-blockhash' }),
      sendRawTransaction: vi.fn().mockResolvedValue('mock-signature-abc123'),
      getBalance: vi.fn().mockResolvedValue(2_000_000_000), // 2 SOL
    },
  })),
}))
vi.mock('@/stores/toolConfigStore', () => ({
  useToolConfig: vi.fn(() => ({ config: { baseFee: 0.009, networkFee: 0.0005 } })),
}))
```
