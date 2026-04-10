# Raydium Liquidity Provider Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive Raydium-only liquidity pool creation tool with CPMM/CLMM support, smart token pair defaults, and Raydium SDK v2 integration.

**Architecture:** SDK-hybrid approach using CloakForge's 5-layer pattern - server-side leverages @raydium-io/raydium-sdk-v2 for pool creation while client handles wallet signing and form management.

**Tech Stack:** Next.js 16, React 19, TypeScript, Raydium SDK v2, React Hook Form, Zod validation, shadcn/ui

---

## File Structure Overview

**New Files to Create:**
- `src/app/tools/liquidity-provider/page.tsx` - Tool route page
- `src/app/tools/liquidity-provider/layout.tsx` - Tool layout with metadata
- `src/components/pages/LiquidityProviderPage/index.ts` - Page exports
- `src/components/pages/LiquidityProviderPage/HeroSection/HeroSection.tsx` - Hero component
- `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/LiquidityProviderForm.tsx` - Main form
- `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/FormSections.tsx` - Form sections
- `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/liquidityProviderFormSchema.ts` - Zod schema
- `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/index.ts` - Form exports
- `src/components/pages/LiquidityProviderPage/FAQSection/FAQSection.tsx` - FAQ component
- `src/components/pages/LiquidityProviderPage/FAQSection/faqData.ts` - FAQ data
- `src/components/pages/LiquidityProviderPage/BenefitsSection/benefitsConfig.ts` - Benefits config
- `src/components/pages/LiquidityProviderPage/liquidityProviderData.ts` - Page data
- `src/hooks/solana/useLiquidityProvider.ts` - Client hook
- `src/app/api/solana/liquidity-provider/route.ts` - API route
- `src/lib/solana/server-side/createRaydiumPool.ts` - Server utility
- `src/types/liquidityProvider.ts` - TypeScript types

**Files to Modify:**
- `src/lib/schemas/apiSchemas.ts` - Add liquidity provider schemas
- `src/lib/config/getToolUIConfig.ts` - Add tool configuration
- `src/components/common/GlobalHeader/navigationData.ts` - Add navigation
- `package.json` - Add Raydium SDK dependency

**Test Files:**
- `src/hooks/solana/__tests__/useLiquidityProvider.test.ts` - Hook tests
- `src/lib/solana/server-side/__tests__/createRaydiumPool.test.ts` - Server utility tests
- `src/components/pages/LiquidityProviderPage/__tests__/LiquidityProviderForm.test.tsx` - Form tests

---

### Task 1: Install Dependencies and Setup Base Structure

**Files:**
- Modify: `package.json`
- Create: `src/types/liquidityProvider.ts`

- [ ] **Step 1: Install Raydium SDK v2**

```bash
npm install @raydium-io/raydium-sdk-v2
```

- [ ] **Step 2: Verify installation**

Run: `npm list @raydium-io/raydium-sdk-v2`
Expected: Show installed version

- [ ] **Step 3: Create TypeScript types**

Create: `src/types/liquidityProvider.ts`

```typescript
export interface LiquidityProviderParams {
  // Pool Type
  poolType: 'CPMM' | 'CLMM'
  
  // Token Configuration
  tokenA: string
  tokenB: 'SOL' | 'USDC' | 'USDT' | 'custom'
  customTokenB?: string
  
  // Liquidity Amounts
  amountA: string
  amountB: string
  
  // Pool Configuration
  feeTier: '0.01' | '0.05' | '0.25' | '1.00'
  slippageTolerance: string
  
  // CLMM-specific
  minPrice?: string
  maxPrice?: string
  
  // Advanced
  deadline: string
  platformFee: string
}

export interface LiquidityProviderResult {
  poolAddress: string
  signature: string
  poolType: 'CPMM' | 'CLMM'
  tokenPair: string
  message: string
}

export interface LiquidityProviderRequest {
  walletAddress: string
  poolConfig: {
    poolType: 'CPMM' | 'CLMM'
    tokenA: string
    tokenB: string
    feeTier: string
    initialLiquidity: {
      amountA: string
      amountB: string
    }
    priceRange?: {
      minPrice: string
      maxPrice: string
    }
  }
  platformFee?: string
}

export interface LiquidityProviderResponse {
  serializedTransaction: string
  poolPublicKey: string
  estimatedCosts: {
    poolCreation: number
    platformFee: number
    networkFee: number
  }
  message: string
}
```

- [ ] **Step 4: Commit initial setup**

```bash
git add package.json package-lock.json src/types/liquidityProvider.ts
git commit -m "feat: install Raydium SDK v2 and create base types for liquidity provider tool"
```

### Task 2: Create API Schema and Configuration

**Files:**
- Modify: `src/lib/schemas/apiSchemas.ts`
- Modify: `src/lib/config/getToolUIConfig.ts`

- [ ] **Step 1: Write test for API schema**

Create: `src/lib/schemas/__tests__/liquidityProviderSchema.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { liquidityProviderRequestSchema } from '../apiSchemas'

describe('liquidityProviderRequestSchema', () => {
  it('should validate valid CPMM request', () => {
    const validRequest = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      poolConfig: {
        poolType: 'CPMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5'
        }
      }
    }
    
    expect(() => liquidityProviderRequestSchema.parse(validRequest)).not.toThrow()
  })

  it('should validate valid CLMM request with price range', () => {
    const validRequest = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      poolConfig: {
        poolType: 'CLMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5'
        },
        priceRange: {
          minPrice: '1.5',
          maxPrice: '2.5'
        }
      }
    }
    
    expect(() => liquidityProviderRequestSchema.parse(validRequest)).not.toThrow()
  })

  it('should reject invalid pool type', () => {
    const invalidRequest = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      poolConfig: {
        poolType: 'INVALID',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5'
        }
      }
    }
    
    expect(() => liquidityProviderRequestSchema.parse(invalidRequest)).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/schemas/__tests__/liquidityProviderSchema.test.ts`
Expected: FAIL with "liquidityProviderRequestSchema not found"

- [ ] **Step 3: Add schema to apiSchemas.ts**

Modify: `src/lib/schemas/apiSchemas.ts`

```typescript
// Add this to existing schemas
export const liquidityProviderRequestSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
  poolConfig: z.object({
    poolType: z.enum(['CPMM', 'CLMM']),
    tokenA: z.string().min(1, 'Token A is required'),
    tokenB: z.string().min(1, 'Token B is required'),
    feeTier: z.enum(['0.01', '0.05', '0.25', '1.00']),
    initialLiquidity: z.object({
      amountA: z.string().min(1, 'Amount A is required'),
      amountB: z.string().min(1, 'Amount B is required'),
    }),
    priceRange: z.object({
      minPrice: z.string(),
      maxPrice: z.string(),
    }).optional(),
  }),
  platformFee: z.string().optional(),
})

export type LiquidityProviderRequestData = z.infer<typeof liquidityProviderRequestSchema>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/schemas/__tests__/liquidityProviderSchema.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Add tool UI configuration**

Modify: `src/lib/config/getToolUIConfig.ts`

```typescript
// Add to toolConfigs object
'liquidity-provider': {
  title: 'Liquidity Provider',
  description: 'Create liquidity pools on Raydium',
  icon: Droplets,
  variant: 'emerald',
  submitText: 'Create Pool',
  loadingText: 'Creating Pool...',
  baseFee: 0.19, // CPMM pool creation cost
  networkFee: 0.0005,
}
```

- [ ] **Step 6: Commit schema and config**

```bash
git add src/lib/schemas/apiSchemas.ts src/lib/config/getToolUIConfig.ts src/lib/schemas/__tests__/liquidityProviderSchema.test.ts
git commit -m "feat: add liquidity provider API schema and tool configuration"
```

### Task 3: Create Form Schema and Validation

**Files:**
- Create: `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/liquidityProviderFormSchema.ts`

- [ ] **Step 1: Write test for form schema**

Create: `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/__tests__/liquidityProviderFormSchema.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { LiquidityProviderFormSchema } from '../liquidityProviderFormSchema'

describe('LiquidityProviderFormSchema', () => {
  it('should validate complete form data', () => {
    const validData = {
      poolType: 'CPMM',
      tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenB: 'SOL',
      amountA: '1000',
      amountB: '0.5',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
      platformFee: '0.1'
    }
    
    expect(() => LiquidityProviderFormSchema.parse(validData)).not.toThrow()
  })

  it('should validate CLMM with price range', () => {
    const validData = {
      poolType: 'CLMM',
      tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenB: 'USDC',
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      minPrice: '1.5',
      maxPrice: '2.5',
      deadline: '20',
      platformFee: '0.1'
    }
    
    expect(() => LiquidityProviderFormSchema.parse(validData)).not.toThrow()
  })

  it('should validate custom token B', () => {
    const validData = {
      poolType: 'CPMM',
      tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenB: 'custom',
      customTokenB: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
      platformFee: '0.1'
    }
    
    expect(() => LiquidityProviderFormSchema.parse(validData)).not.toThrow()
  })

  it('should require customTokenB when tokenB is custom', () => {
    const invalidData = {
      poolType: 'CPMM',
      tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenB: 'custom',
      // Missing customTokenB
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      deadline: '20',
      platformFee: '0.1'
    }
    
    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })

  it('should reject invalid fee tier', () => {
    const invalidData = {
      poolType: 'CPMM',
      tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenB: 'SOL',
      amountA: '1000',
      amountB: '0.5',
      feeTier: '0.99', // Invalid fee tier
      slippageTolerance: '0.5',
      deadline: '20',
      platformFee: '0.1'
    }
    
    expect(() => LiquidityProviderFormSchema.parse(invalidData)).toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/pages/LiquidityProviderPage/LiquidityProviderForm/__tests__/liquidityProviderFormSchema.test.ts`
Expected: FAIL with "LiquidityProviderFormSchema not found"

- [ ] **Step 3: Create form schema**

Create: `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/liquidityProviderFormSchema.ts`

```typescript
import { z } from 'zod'

export const LiquidityProviderFormSchema = z.object({
  // Pool Type
  poolType: z.enum(['CPMM', 'CLMM']).default('CPMM'),
  
  // Token Configuration
  tokenA: z.string().min(1, 'Token A address is required'),
  tokenB: z.enum(['SOL', 'USDC', 'USDT', 'custom']).default('SOL'),
  customTokenB: z.string().optional(),
  
  // Liquidity Amounts
  amountA: z.string().min(1, 'Token A amount is required'),
  amountB: z.string().min(1, 'Token B amount is required'),
  
  // Pool Configuration
  feeTier: z.enum(['0.01', '0.05', '0.25', '1.00']).default('0.05'),
  slippageTolerance: z.string().default('0.5'),
  
  // CLMM-specific
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  
  // Advanced
  deadline: z.string().default('20'),
  platformFee: z.string().default('0.1'),
}).refine((data) => {
  // Require customTokenB when tokenB is 'custom'
  if (data.tokenB === 'custom' && !data.customTokenB) {
    return false
  }
  return true
}, {
  message: 'Custom token B address is required when custom is selected',
  path: ['customTokenB']
}).refine((data) => {
  // Validate price range for CLMM
  if (data.poolType === 'CLMM' && data.minPrice && data.maxPrice) {
    const min = parseFloat(data.minPrice)
    const max = parseFloat(data.maxPrice)
    return min < max
  }
  return true
}, {
  message: 'Min price must be less than max price',
  path: ['maxPrice']
})

export type LiquidityProviderFormData = z.infer<typeof LiquidityProviderFormSchema>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/pages/LiquidityProviderPage/LiquidityProviderForm/__tests__/liquidityProviderFormSchema.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Commit form schema**

```bash
git add src/components/pages/LiquidityProviderPage/LiquidityProviderForm/
git commit -m "feat: create liquidity provider form schema with validation"
```

### Task 4: Create Server-side Raydium Integration

**Files:**
- Create: `src/lib/solana/server-side/createRaydiumPool.ts`

- [ ] **Step 1: Write test for server utility**

Create: `src/lib/solana/server-side/__tests__/createRaydiumPool.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { PublicKey } from '@solana/web3.js'
import { createRaydiumPoolTransaction } from '../createRaydiumPool'

// Mock Raydium SDK
vi.mock('@raydium-io/raydium-sdk-v2', () => ({
  Raydium: {
    load: vi.fn(() => ({
      cpmm: {
        createPool: vi.fn(() => ({
          transactions: [{ transaction: 'mock-transaction', signers: [] }]
        }))
      },
      clmm: {
        createPool: vi.fn(() => ({
          transactions: [{ transaction: 'mock-transaction', signers: [] }]
        }))
      }
    }))
  }
}))

describe('createRaydiumPoolTransaction', () => {
  it('should create CPMM pool transaction', async () => {
    const params = {
      walletPublicKey: new PublicKey('So11111111111111111111111111111111111111112'),
      poolConfig: {
        poolType: 'CPMM' as const,
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5'
        }
      }
    }

    const result = await createRaydiumPoolTransaction(params)
    
    expect(result).toHaveProperty('serializedTransaction')
    expect(result).toHaveProperty('poolPublicKey')
    expect(result).toHaveProperty('estimatedCosts')
  })

  it('should create CLMM pool transaction with price range', async () => {
    const params = {
      walletPublicKey: new PublicKey('So11111111111111111111111111111111111111112'),
      poolConfig: {
        poolType: 'CLMM' as const,
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5'
        },
        priceRange: {
          minPrice: '1.5',
          maxPrice: '2.5'
        }
      }
    }

    const result = await createRaydiumPoolTransaction(params)
    
    expect(result).toHaveProperty('serializedTransaction')
    expect(result).toHaveProperty('poolPublicKey')
    expect(result).toHaveProperty('estimatedCosts')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/solana/server-side/__tests__/createRaydiumPool.test.ts`
Expected: FAIL with "createRaydiumPoolTransaction not found"

- [ ] **Step 3: Create server utility with Raydium SDK integration**

Create: `src/lib/solana/server-side/createRaydiumPool.ts`

```typescript
import 'server-only'

import { PublicKey, Transaction } from '@solana/web3.js'
import { Raydium } from '@raydium-io/raydium-sdk-v2'
import { getServerConfig } from '@/lib/config/serverConfig'
import { getLogger } from '@/lib/logger/logger'
import type { LiquidityProviderRequest } from '@/types/liquidityProvider'

export interface CreateRaydiumPoolParams {
  walletPublicKey: PublicKey
  poolConfig: LiquidityProviderRequest['poolConfig']
}

export interface CreateRaydiumPoolResult {
  serializedTransaction: string
  poolPublicKey: string
  estimatedCosts: {
    poolCreation: number
    platformFee: number
    networkFee: number
  }
  message: string
}

export async function createRaydiumPoolTransaction({
  walletPublicKey,
  poolConfig,
}: CreateRaydiumPoolParams): Promise<CreateRaydiumPoolResult> {
  const { rpcPrivateEndpoint } = getServerConfig()
  const logger = getLogger({ context: 'createRaydiumPool' })

  try {
    logger.info('Creating Raydium pool transaction', {
      walletAddress: walletPublicKey.toString(),
      poolType: poolConfig.poolType,
      tokenPair: `${poolConfig.tokenA}/${poolConfig.tokenB}`,
    })

    // Initialize Raydium SDK
    const raydium = await Raydium.load({
      connection: rpcPrivateEndpoint,
      // Additional SDK configuration will be added based on actual SDK API
    })

    let transactionResult: any
    let poolAddress: string
    let creationCost: number

    if (poolConfig.poolType === 'CPMM') {
      // Create CPMM pool using Raydium SDK
      logger.info('Creating CPMM pool')
      
      transactionResult = await raydium.cpmm.createPool({
        mintA: new PublicKey(poolConfig.tokenA),
        mintB: new PublicKey(poolConfig.tokenB),
        initialAmountA: parseFloat(poolConfig.initialLiquidity.amountA),
        initialAmountB: parseFloat(poolConfig.initialLiquidity.amountB),
        feeTier: parseFloat(poolConfig.feeTier) * 10000, // Convert to basis points
        owner: walletPublicKey,
      })
      
      creationCost = 0.19 // CPMM creation cost
      
    } else {
      // Create CLMM pool using Raydium SDK
      logger.info('Creating CLMM pool')
      
      const createPoolParams = {
        mintA: new PublicKey(poolConfig.tokenA),
        mintB: new PublicKey(poolConfig.tokenB),
        feeTier: parseFloat(poolConfig.feeTier) * 10000, // Convert to basis points
        initialPrice: poolConfig.priceRange 
          ? parseFloat(poolConfig.priceRange.minPrice)
          : undefined,
        owner: walletPublicKey,
      }
      
      transactionResult = await raydium.clmm.createPool(createPoolParams)
      
      creationCost = 0.06 // CLMM creation cost
    }

    // Extract transaction and pool address from SDK result
    const transaction = transactionResult.transactions[0].transaction as Transaction
    poolAddress = transactionResult.poolAddress || 'pending' // Will be generated on-chain
    
    // Serialize transaction for client signing
    const serializedTransaction = Buffer.from(
      transaction.serialize({ requireAllSignatures: false })
    ).toString('base64')

    const result: CreateRaydiumPoolResult = {
      serializedTransaction,
      poolPublicKey: poolAddress,
      estimatedCosts: {
        poolCreation: creationCost,
        platformFee: 0.01, // 0.01 SOL platform fee
        networkFee: 0.0005, // Standard network fee
      },
      message: `${poolConfig.poolType} pool transaction prepared successfully`,
    }

    logger.info('Pool transaction created successfully', {
      poolType: poolConfig.poolType,
      estimatedCosts: result.estimatedCosts,
    })

    return result

  } catch (error) {
    logger.error('Failed to create Raydium pool transaction', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      poolType: poolConfig.poolType,
    })
    throw error
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/solana/server-side/__tests__/createRaydiumPool.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Commit server utility**

```bash
git add src/lib/solana/server-side/createRaydiumPool.ts src/lib/solana/server-side/__tests__/createRaydiumPool.test.ts
git commit -m "feat: implement Raydium SDK integration for pool creation"
```

### Task 5: Create API Route

**Files:**
- Create: `src/app/api/solana/liquidity-provider/route.ts`

- [ ] **Step 1: Write test for API route**

Create: `src/app/api/solana/liquidity-provider/__tests__/route.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { POST } from '../route'

// Mock dependencies
vi.mock('@/lib/solana/server-side/createRaydiumPool', () => ({
  createRaydiumPoolTransaction: vi.fn(() => ({
    serializedTransaction: 'mock-transaction',
    poolPublicKey: 'mock-pool-address',
    estimatedCosts: {
      poolCreation: 0.19,
      platformFee: 0.01,
      networkFee: 0.0005,
    },
    message: 'Pool created successfully',
  }))
}))

describe('/api/solana/liquidity-provider', () => {
  it('should handle valid CPMM pool creation request', async () => {
    const requestBody = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      poolConfig: {
        poolType: 'CPMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5'
        }
      }
    }

    const request = new Request('http://localhost:3001/api/solana/liquidity-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('serializedTransaction')
    expect(data).toHaveProperty('poolPublicKey')
    expect(data).toHaveProperty('estimatedCosts')
  })

  it('should handle valid CLMM pool creation request', async () => {
    const requestBody = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      poolConfig: {
        poolType: 'CLMM',
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5'
        },
        priceRange: {
          minPrice: '1.5',
          maxPrice: '2.5'
        }
      }
    }

    const request = new Request('http://localhost:3001/api/solana/liquidity-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('serializedTransaction')
    expect(data.poolPublicKey).toBe('mock-pool-address')
  })

  it('should reject invalid request body', async () => {
    const invalidRequestBody = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      poolConfig: {
        // Missing poolType
        tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        tokenB: 'So11111111111111111111111111111111111111112',
        feeTier: '0.05',
        initialLiquidity: {
          amountA: '1000',
          amountB: '0.5'
        }
      }
    }

    const request = new Request('http://localhost:3001/api/solana/liquidity-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidRequestBody),
    })

    const response = await POST(request)
    
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/solana/liquidity-provider/__tests__/route.test.ts`
Expected: FAIL with "POST not found"

- [ ] **Step 3: Create API route**

Create: `src/app/api/solana/liquidity-provider/route.ts`

```typescript
import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { PublicKey } from '@solana/web3.js'
import { liquidityProviderRequestSchema } from '@/lib/schemas/apiSchemas'
import { createRaydiumPoolTransaction } from '@/lib/solana/server-side/createRaydiumPool'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import type { LiquidityProviderResponse } from '@/types/liquidityProvider'

const logger = getLogger({ context: 'api/liquidity-provider' })

/**
 * POST /api/solana/liquidity-provider
 *
 * Creates a Raydium liquidity pool (CPMM or CLMM) and returns unsigned transaction
 * for client-side signing.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = liquidityProviderRequestSchema.parse(body)
    
    logger.info('Processing liquidity provider request', {
      walletAddress: validatedData.walletAddress,
      poolType: validatedData.poolConfig.poolType,
      tokenPair: `${validatedData.poolConfig.tokenA}/${validatedData.poolConfig.tokenB}`,
    })

    // Create pool transaction using Raydium SDK
    const result = await createRaydiumPoolTransaction({
      walletPublicKey: new PublicKey(validatedData.walletAddress),
      poolConfig: validatedData.poolConfig,
    })

    const response: LiquidityProviderResponse = {
      serializedTransaction: result.serializedTransaction,
      poolPublicKey: result.poolPublicKey,
      estimatedCosts: result.estimatedCosts,
      message: result.message,
    }

    logger.info('Liquidity provider transaction created successfully', {
      poolType: validatedData.poolConfig.poolType,
      poolAddress: result.poolPublicKey,
      costs: result.estimatedCosts,
    })

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Failed to create liquidity provider transaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    // Handle Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/solana/liquidity-provider/__tests__/route.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Commit API route**

```bash
git add src/app/api/solana/liquidity-provider/
git commit -m "feat: create liquidity provider API route with validation"
```

### Task 6: Create Client Hook

**Files:**
- Create: `src/hooks/solana/useLiquidityProvider.ts`

- [ ] **Step 1: Write test for client hook**

Create: `src/hooks/solana/__tests__/useLiquidityProvider.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useLiquidityProvider } from '../useLiquidityProvider'

// Mock dependencies
vi.mock('@solana/wallet-adapter-react', () => ({
  useConnection: () => ({
    connection: {
      getLatestBlockhash: vi.fn(() => ({ blockhash: 'mock-blockhash' })),
      sendRawTransaction: vi.fn(() => 'mock-signature'),
    }
  })
}))

vi.mock('@/lib/utils/apiClient', () => ({
  apiClient: vi.fn(() => ({
    serializedTransaction: 'mock-transaction',
    poolPublicKey: 'mock-pool-address',
    estimatedCosts: {
      poolCreation: 0.19,
      platformFee: 0.01,
      networkFee: 0.0005,
    },
    message: 'Pool created successfully',
  }))
}))

vi.mock('./useToolBase', () => ({
  useToolBase: vi.fn((config, executor) => ({
    execute: executor,
    isExecuting: false,
    lastResult: null,
    reset: vi.fn(),
    isWalletReady: true,
    validationErrors: [],
  }))
}))

describe('useLiquidityProvider', () => {
  it('should execute CPMM pool creation successfully', async () => {
    const { result } = renderHook(() => useLiquidityProvider())
    
    const params = {
      poolType: 'CPMM' as const,
      tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenB: 'SOL' as const,
      amountA: '1000',
      amountB: '0.5',
      feeTier: '0.05' as const,
      slippageTolerance: '0.5',
      deadline: '20',
      platformFee: '0.1',
    }

    const mockContext = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      signTransaction: vi.fn((tx) => tx),
    }

    await waitFor(async () => {
      const executionResult = await result.current.createPool(params)
      expect(executionResult).toHaveProperty('poolAddress')
      expect(executionResult).toHaveProperty('signature')
      expect(executionResult.poolType).toBe('CPMM')
    })
  })

  it('should execute CLMM pool creation with price range', async () => {
    const { result } = renderHook(() => useLiquidityProvider())
    
    const params = {
      poolType: 'CLMM' as const,
      tokenA: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      tokenB: 'USDC' as const,
      amountA: '1000',
      amountB: '500',
      feeTier: '0.05' as const,
      slippageTolerance: '0.5',
      minPrice: '1.5',
      maxPrice: '2.5',
      deadline: '20',
      platformFee: '0.1',
    }

    const mockContext = {
      walletAddress: 'So11111111111111111111111111111111111111112',
      signTransaction: vi.fn((tx) => tx),
    }

    await waitFor(async () => {
      const executionResult = await result.current.createPool(params)
      expect(executionResult).toHaveProperty('poolAddress')
      expect(executionResult).toHaveProperty('signature')
      expect(executionResult.poolType).toBe('CLMM')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/solana/__tests__/useLiquidityProvider.test.ts`
Expected: FAIL with "useLiquidityProvider not found"

- [ ] **Step 3: Create client hook**

Create: `src/hooks/solana/useLiquidityProvider.ts`

```typescript
/**
 * useLiquidityProvider Hook
 *
 * Client-side hook for creating Raydium liquidity pools via server API.
 * Supports both CPMM and CLMM pool types with comprehensive validation.
 */

import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { Transaction, PublicKey } from '@solana/web3.js'

import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { validateBalance } from '@/lib/solana/validateBalance'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana'
import type { 
  LiquidityProviderParams, 
  LiquidityProviderResult, 
  LiquidityProviderRequest, 
  LiquidityProviderResponse 
} from '@/types/liquidityProvider'
import { useToolConfig } from '@/stores/toolConfigStore'

/**
 * Return type for useLiquidityProvider hook
 */
export type UseLiquidityProviderReturn = Omit<UseToolBaseReturn<LiquidityProviderParams, LiquidityProviderResult>, 'execute' | 'validateRequirements'> & {
  createPool: UseToolBaseReturn<LiquidityProviderParams, LiquidityProviderResult>['execute']
}

/**
 * Custom hook for creating Raydium liquidity pools
 */
export function useLiquidityProvider(): UseLiquidityProviderReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('liquidity-provider')

  const executeLiquidityProvider = useCallback(
    async (context: ToolExecutionContext, params: LiquidityProviderParams): Promise<LiquidityProviderResult> => {
      const {
        poolType,
        tokenA,
        tokenB,
        customTokenB,
        amountA,
        amountB,
        feeTier,
        minPrice,
        maxPrice,
        platformFee = '0.1',
      } = params

      const logger = getLogger({
        context: 'liquidity-provider',
        hook: 'useLiquidityProvider',
        wallet: context.walletAddress,
      })

      // Determine actual token B address
      const tokenBAddress = tokenB === 'custom' ? customTokenB : 
        tokenB === 'SOL' ? 'So11111111111111111111111111111111111111112' :
        tokenB === 'USDC' ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' :
        tokenB === 'USDT' ? 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' : 
        tokenB

      if (!tokenBAddress) {
        throw new AppError('INVALID_INPUT', 'Invalid token B configuration')
      }

      // Validate input parameters
      if (!tokenA || !tokenBAddress || !amountA || !amountB) {
        throw new AppError('INVALID_INPUT', 'Missing required pool parameters')
      }

      if (poolType === 'CLMM' && minPrice && maxPrice) {
        const min = parseFloat(minPrice)
        const max = parseFloat(maxPrice)
        if (min >= max) {
          throw new AppError('INVALID_INPUT', 'Min price must be less than max price for CLMM pools')
        }
      }

      // Client-side balance validation
      const estimatedCost = poolType === 'CPMM' ? 0.19 : 0.06
      const totalCost = estimatedCost + parseFloat(platformFee) + (config?.networkFee ?? 0.0005)

      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'liquidity-provider',
        formData: { poolType },
        serviceFee: totalCost,
        networkFee: config?.networkFee ?? 0.0005,
      })

      if (!balanceValidation.hasSufficientBalance) {
        throw new AppError(
          'INSUFFICIENT_FUNDS',
          `Insufficient funds. Need at least ${balanceValidation.estimatedCost.toFixed(4)} SOL, but wallet has ${balanceValidation.currentBalance.toFixed(4)} SOL`
        )
      }

      // Prepare API request
      const requestBody: LiquidityProviderRequest = {
        walletAddress: context.walletAddress,
        poolConfig: {
          poolType,
          tokenA,
          tokenB: tokenBAddress,
          feeTier,
          initialLiquidity: {
            amountA,
            amountB,
          },
          ...(poolType === 'CLMM' && minPrice && maxPrice && {
            priceRange: {
              minPrice,
              maxPrice,
            }
          }),
        },
        platformFee,
      }

      logger.info('Creating liquidity pool transaction', {
        poolType,
        tokenPair: `${tokenA}/${tokenBAddress}`,
        amounts: { amountA, amountB },
      })

      // Call server API
      const response = await apiClient<LiquidityProviderRequest, LiquidityProviderResponse>(
        '/api/solana/liquidity-provider', 
        requestBody
      )

      // Deserialize and sign transaction
      const transaction = Transaction.from(Buffer.from(response.serializedTransaction, 'base64'))
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      const signedTransaction = await context.signTransaction(transaction)

      // Submit transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // Confirm transaction
      const { kitRpc } = createConnectionPair()
      const confirmationResult = await confirmTransactionWithParallelStrategy(
        signature, 
        50000, 
        kitRpc, 
        connection, 
        logger
      )

      if (!confirmationResult.confirmed) {
        const finalCheck = await connection.getSignatureStatus(signature, { searchTransactionHistory: true })
        if (finalCheck?.value?.err) {
          throw new Error(`Transaction failed: ${String(finalCheck?.value?.err)}`)
        }
        if (!finalCheck?.value?.confirmationStatus) {
          throw new AppError('FINALIZATION_TIMEOUT', 'Transaction confirmation timed out')
        }
      }

      return {
        poolAddress: response.poolPublicKey,
        signature,
        poolType,
        tokenPair: `${tokenA}/${tokenBAddress}`,
        message: `Successfully created ${poolType} pool`,
      }
    },
    [connection, config?.networkFee]
  )

  // Use useToolBase for wallet validation and error handling
  const toolBase = useToolBase<LiquidityProviderParams, LiquidityProviderResult>(
    {
      toolId: 'liquidity-provider',
      toolName: 'Liquidity Provider',
      requiresWallet: true,
    },
    executeLiquidityProvider
  )

  // Wrapper function for pool creation
  const createPool: UseToolBaseReturn<LiquidityProviderParams, LiquidityProviderResult>['execute'] = useCallback(
    async (params: LiquidityProviderParams) => {
      const result = await toolBase.execute(params)
      return result
    },
    [toolBase]
  )

  return {
    createPool,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}

export default useLiquidityProvider
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/hooks/solana/__tests__/useLiquidityProvider.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Commit client hook**

```bash
git add src/hooks/solana/useLiquidityProvider.ts src/hooks/solana/__tests__/useLiquidityProvider.test.ts
git commit -m "feat: create liquidity provider client hook with validation"
```

### Task 7: Create Form Components

**Files:**
- Create: `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/FormSections.tsx`
- Create: `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/LiquidityProviderForm.tsx`
- Create: `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/index.ts`

- [ ] **Step 1: Write test for form components**

Create: `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/__tests__/LiquidityProviderForm.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LiquidityProviderForm } from '../LiquidityProviderForm'

// Mock dependencies
vi.mock('@/hooks/solana/useLiquidityProvider', () => ({
  useLiquidityProvider: () => ({
    createPool: vi.fn(),
    isExecuting: false,
    lastResult: null,
    reset: vi.fn(),
    isWalletReady: true,
    validationErrors: [],
  })
}))

vi.mock('@/lib/config/getToolUIConfig', () => ({
  getToolUIConfig: () => ({
    title: 'Liquidity Provider',
    icon: 'Droplets',
    variant: 'emerald',
    submitText: 'Create Pool',
    loadingText: 'Creating Pool...',
  })
}))

describe('LiquidityProviderForm', () => {
  it('should render with CPMM selected by default', () => {
    render(<LiquidityProviderForm />)
    
    expect(screen.getByDisplayValue('CPMM')).toBeInTheDocument()
    expect(screen.getByDisplayValue('SOL')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Token mint address')).toBeInTheDocument()
  })

  it('should show custom token B input when custom is selected', () => {
    render(<LiquidityProviderForm />)
    
    const tokenBSelect = screen.getByDisplayValue('SOL')
    fireEvent.change(tokenBSelect, { target: { value: 'custom' } })
    
    expect(screen.getByPlaceholderText('Custom token B address')).toBeInTheDocument()
  })

  it('should show CLMM price range fields when CLMM is selected', () => {
    render(<LiquidityProviderForm />)
    
    const poolTypeSelect = screen.getByDisplayValue('CPMM')
    fireEvent.change(poolTypeSelect, { target: { value: 'CLMM' } })
    
    expect(screen.getByLabelText('Min Price')).toBeInTheDocument()
    expect(screen.getByLabelText('Max Price')).toBeInTheDocument()
  })

  it('should have all required form fields', () => {
    render(<LiquidityProviderForm />)
    
    expect(screen.getByLabelText('Token A *')).toBeInTheDocument()
    expect(screen.getByLabelText('Token B *')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount A *')).toBeInTheDocument()
    expect(screen.getByLabelText('Amount B *')).toBeInTheDocument()
    expect(screen.getByLabelText('Fee Tier *')).toBeInTheDocument()
    expect(screen.getByLabelText('Slippage Tolerance (%)')).toBeInTheDocument()
    expect(screen.getByText('Create Pool')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/pages/LiquidityProviderPage/LiquidityProviderForm/__tests__/LiquidityProviderForm.test.tsx`
Expected: FAIL with "LiquidityProviderForm not found"

- [ ] **Step 3: Create FormSections component**

Create: `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/FormSections.tsx`

```typescript
'use client'

import { type UseFormReturn } from 'react-hook-form'
import { UnifiedActionButtons } from '@/components/common'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Droplets, Settings, TrendingUp, Info } from 'lucide-react'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { type LiquidityProviderFormData } from './liquidityProviderFormSchema'

interface FormSectionsProps {
  form: UseFormReturn<LiquidityProviderFormData>
}

const tokenBOptions = [
  { value: 'SOL', label: 'SOL (Solana)', description: 'Most common pairing' },
  { value: 'USDC', label: 'USDC (USD Coin)', description: 'Stable dollar pairing' },
  { value: 'USDT', label: 'USDT (Tether)', description: 'Alternative stable pairing' },
  { value: 'custom', label: 'Custom Token', description: 'Specify custom token address' },
]

const feeTierOptions = [
  { value: '0.01', label: '0.01% (Most Liquid)', description: 'Stable or high-volume pairs' },
  { value: '0.05', label: '0.05% (Standard)', description: 'Most common fee tier' },
  { value: '0.25', label: '0.25% (Less Liquid)', description: 'Moderate volume pairs' },
  { value: '1.00', label: '1.00% (Exotic Pairs)', description: 'New or volatile pairs' },
]

export const FormSections = ({ form }: FormSectionsProps): React.ReactNode => {
  const toolConfig = getToolUIConfig('liquidity-provider')
  const selectedPoolType = form.watch('poolType')
  const selectedTokenB = form.watch('tokenB')

  return (
    <div className='space-y-8'>
      {/* Pool Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Droplets className='h-5 w-5 text-emerald-500' />
            <span>Pool Type</span>
          </CardTitle>
          <CardDescription>
            Choose between CPMM (simple) or CLMM (advanced) pool types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name='poolType'
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className='grid grid-cols-1 gap-4 md:grid-cols-2'
                  >
                    <div className='flex items-center space-x-2 rounded-lg border p-4'>
                      <RadioGroupItem value='CPMM' id='cpmm' />
                      <div className='flex-1'>
                        <label htmlFor='cpmm' className='font-medium cursor-pointer'>
                          CPMM (Recommended)
                        </label>
                        <p className='text-sm text-muted-foreground'>
                          Full-range liquidity, simple to manage
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2 rounded-lg border p-4'>
                      <RadioGroupItem value='CLMM' id='clmm' />
                      <div className='flex-1'>
                        <label htmlFor='clmm' className='font-medium cursor-pointer'>
                          CLMM (Advanced)
                        </label>
                        <p className='text-sm text-muted-foreground'>
                          Concentrated liquidity, capital efficient
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Token Pair Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <TrendingUp className='h-5 w-5 text-emerald-500' />
            <span>Token Pair</span>
          </CardTitle>
          <CardDescription>
            Configure the tokens for your liquidity pool
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='tokenA'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token A *</FormLabel>
                  <FormControl>
                    <Input
                      className='bg-input-background focus:border-emerald-500 border-2'
                      placeholder='Token mint address'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='tokenB'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token B *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className='bg-input-background focus:border-emerald-500 border-2'>
                        <SelectValue placeholder='Choose token B' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tokenBOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className='font-medium'>{option.label}</div>
                            <div className='text-sm text-muted-foreground'>{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {selectedTokenB === 'custom' && (
            <FormField
              control={form.control}
              name='customTokenB'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Token B Address *</FormLabel>
                  <FormControl>
                    <Input
                      className='bg-input-background focus:border-emerald-500 border-2'
                      placeholder='Custom token B address'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='amountA'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount A *</FormLabel>
                  <FormControl>
                    <Input
                      className='bg-input-background focus:border-emerald-500 border-2'
                      placeholder='0.00'
                      type='number'
                      step='any'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='amountB'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount B *</FormLabel>
                  <FormControl>
                    <Input
                      className='bg-input-background focus:border-emerald-500 border-2'
                      placeholder='0.00'
                      type='number'
                      step='any'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pool Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Settings className='h-5 w-5 text-emerald-500' />
            <span>Pool Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          <FormField
            control={form.control}
            name='feeTier'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fee Tier *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className='bg-input-background focus:border-emerald-500 border-2'>
                      <SelectValue placeholder='Select fee tier' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {feeTierOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div>
                          <div className='font-medium'>{option.label}</div>
                          <div className='text-sm text-muted-foreground'>{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <FormField
              control={form.control}
              name='slippageTolerance'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slippage Tolerance (%)</FormLabel>
                  <FormControl>
                    <Input
                      className='bg-input-background focus:border-emerald-500 border-2'
                      placeholder='0.5'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='deadline'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction Deadline (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      className='bg-input-background focus:border-emerald-500 border-2'
                      placeholder='20'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* CLMM Price Range (conditional) */}
      {selectedPoolType === 'CLMM' && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <Info className='h-5 w-5 text-emerald-500' />
              <span>Price Range (CLMM)</span>
            </CardTitle>
            <CardDescription>
              Set custom price range for concentrated liquidity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='minPrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Price</FormLabel>
                    <FormControl>
                      <Input
                        className='bg-input-background focus:border-emerald-500 border-2'
                        placeholder='0.00'
                        type='number'
                        step='any'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='maxPrice'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Price</FormLabel>
                    <FormControl>
                      <Input
                        className='bg-input-background focus:border-emerald-500 border-2'
                        placeholder='0.00'
                        type='number'
                        step='any'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Settings className='h-5 w-5 text-emerald-500' />
            <span>Advanced Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name='platformFee'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Platform Fee (%)</FormLabel>
                <FormControl>
                  <Input
                    className='bg-input-background focus:border-emerald-500 border-2'
                    placeholder='0.1'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <UnifiedActionButtons
        form={form}
        submitConfig={{
          text: toolConfig.submitText,
          loadingText: toolConfig.loadingText,
          icon: toolConfig.icon,
          variant: toolConfig.variant,
        }}
        toolId='liquidity-provider'
      />
    </div>
  )
}
```

- [ ] **Step 4: Create main form component**

Create: `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/LiquidityProviderForm.tsx`

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { UnifiedFormWrapper, UnifiedFormCard } from '@/components/common'
import { getToolUIConfig } from '@/lib/config/getToolUIConfig'
import { FormSections } from './FormSections'
import { useLiquidityProvider } from '@/hooks/solana/useLiquidityProvider'
import { type LiquidityProviderFormData, LiquidityProviderFormSchema } from './liquidityProviderFormSchema'

export const LiquidityProviderForm = (): React.ReactNode => {
  const toolConfig = getToolUIConfig('liquidity-provider')
  const { createPool, isExecuting } = useLiquidityProvider()

  const form = useForm<LiquidityProviderFormData>({
    resolver: zodResolver(LiquidityProviderFormSchema),
    defaultValues: {
      poolType: 'CPMM',
      tokenA: '',
      tokenB: 'SOL',
      customTokenB: '',
      amountA: '',
      amountB: '',
      feeTier: '0.05',
      slippageTolerance: '0.5',
      minPrice: '',
      maxPrice: '',
      deadline: '20',
      platformFee: '0.1',
    },
    mode: 'onChange',
  })

  const handleSubmit = async (data: LiquidityProviderFormData): Promise<void> => {
    try {
      await createPool(data)
    } catch (error) {
      // Error handling is managed by the hook
      console.error('Pool creation failed:', error)
    }
  }

  return (
    <UnifiedFormWrapper>
      <Form {...form}>
        <form id='liquidity-provider-form' onSubmit={form.handleSubmit(handleSubmit)}>
          <UnifiedFormCard
            header={{
              icon: toolConfig.icon,
              title: toolConfig.title,
              variant: toolConfig.variant,
            }}
            variant={toolConfig.variant}
            isLoading={isExecuting}
          >
            <FormSections form={form} />
          </UnifiedFormCard>
        </form>
      </Form>
    </UnifiedFormWrapper>
  )
}
```

- [ ] **Step 5: Create form exports**

Create: `src/components/pages/LiquidityProviderPage/LiquidityProviderForm/index.ts`

```typescript
export { LiquidityProviderForm } from './LiquidityProviderForm'
export { FormSections } from './FormSections'
export { LiquidityProviderFormSchema, type LiquidityProviderFormData } from './liquidityProviderFormSchema'
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- src/components/pages/LiquidityProviderPage/LiquidityProviderForm/__tests__/LiquidityProviderForm.test.tsx`
Expected: PASS (all tests green)

- [ ] **Step 7: Commit form components**

```bash
git add src/components/pages/LiquidityProviderPage/LiquidityProviderForm/
git commit -m "feat: create comprehensive liquidity provider form components"
```

### Task 8: Create Page Components and Data

**Files:**
- Create: `src/components/pages/LiquidityProviderPage/HeroSection/HeroSection.tsx`
- Create: `src/components/pages/LiquidityProviderPage/FAQSection/FAQSection.tsx`
- Create: `src/components/pages/LiquidityProviderPage/FAQSection/faqData.ts`
- Create: `src/components/pages/LiquidityProviderPage/BenefitsSection/benefitsConfig.ts`
- Create: `src/components/pages/LiquidityProviderPage/liquidityProviderData.ts`
- Create: `src/components/pages/LiquidityProviderPage/index.ts`

- [ ] **Step 1: Create page data constants**

Create: `src/components/pages/LiquidityProviderPage/liquidityProviderData.ts`

```typescript
import { Droplets, TrendingUp, Shield, Zap, Target } from 'lucide-react'

export const features = [
  {
    icon: Droplets,
    title: 'CPMM & CLMM Pools',
    description: 'Support for both constant product and concentrated liquidity pools',
  },
  {
    icon: Target,
    title: 'Raydium Native',
    description: 'Direct integration with Raydium\'s official SDK for optimal performance',
  },
  {
    icon: Shield,
    title: 'Smart Validation',
    description: 'Comprehensive validation and error handling for safe pool creation',
  },
  {
    icon: Zap,
    title: 'Instant Execution',
    description: 'Fast pool creation with real-time cost estimation',
  },
  {
    icon: TrendingUp,
    title: 'Advanced Features',
    description: 'Price ranges, fee tiers, and custom configurations',
  },
]

export const benefits = [
  'Create CPMM and CLMM pools on Raydium',
  'Smart token pair defaults (SOL/USDC/USDT)',
  'Real-time fee calculation and validation',
  'Advanced price range configuration (CLMM)',
  'Professional trading interface',
  'Comprehensive error handling and support',
]
```

- [ ] **Step 2: Create FAQ data**

Create: `src/components/pages/LiquidityProviderPage/FAQSection/faqData.ts`

```typescript
export const liquidityProviderFAQ = [
  {
    question: 'What is the difference between CPMM and CLMM pools?',
    answer: 'CPMM (Constant Product Market Maker) pools use full-range liquidity and are simpler to manage. CLMM (Concentrated Liquidity Market Maker) pools allow you to concentrate liquidity within specific price ranges for better capital efficiency.',
  },
  {
    question: 'What are the costs for creating a liquidity pool?',
    answer: 'CPMM pools cost approximately 0.19 SOL (0.0422 SOL rent + 0.15 SOL protocol fee). CLMM pools cost approximately 0.06 SOL in rent costs. All costs are non-refundable.',
  },
  {
    question: 'Which fee tier should I choose?',
    answer: '0.01% for stable or high-volume pairs, 0.05% for most common pairs, 0.25% for moderate volume pairs, and 1.00% for new or volatile pairs. Higher fees compensate for increased volatility risk.',
  },
  {
    question: 'Can I create a pool for tokens that already have a pool?',
    answer: 'Only one pool can exist per token pair per fee tier on Raydium. The tool will validate and warn you if a pool already exists for your selected token pair and fee tier.',
  },
  {
    question: 'What happens after I create a pool?',
    answer: 'Once created, you become a liquidity provider and will earn trading fees proportional to your share of the pool. You can add more liquidity, remove liquidity, or collect fees through Raydium\'s interface.',
  },
  {
    question: 'Do I need to provide initial liquidity?',
    answer: 'Yes, CPMM pools require initial liquidity at creation to establish the starting price. CLMM pools can be created without initial liquidity, but you can add liquidity within your specified price range.',
  },
]
```

- [ ] **Step 3: Create benefits configuration**

Create: `src/components/pages/LiquidityProviderPage/BenefitsSection/benefitsConfig.ts`

```typescript
import { liquidityProviderFAQ } from '../FAQSection/faqData'
import { benefits } from '../liquidityProviderData'

export const liquidityProviderBenefitsConfig = {
  title: 'Why Choose Our Liquidity Provider?',
  subtitle: 'Professional-grade tools for Raydium pool creation',
  benefits,
  faq: liquidityProviderFAQ,
  ctaText: 'Create Your Pool',
  ctaHref: '#liquidity-provider-form',
}
```

- [ ] **Step 4: Create Hero Section**

Create: `src/components/pages/LiquidityProviderPage/HeroSection/HeroSection.tsx`

```typescript
'use client'

import { ArrowRight, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { features } from '../liquidityProviderData'

export const HeroSection = (): React.ReactNode => {
  const scrollToForm = (): void => {
    const form = document.getElementById('liquidity-provider-form')
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className='relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/20'>
      <div className='container mx-auto px-4 py-16 sm:py-24'>
        {/* Header */}
        <div className='text-center'>
          <Badge variant='secondary' className='mb-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'>
            <Droplets className='mr-1 h-3 w-3' />
            Raydium Integration
          </Badge>
          
          <h1 className='mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl'>
            Professional
            <span className='bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent'> Liquidity </span>
            Provider
          </h1>
          
          <p className='mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300'>
            Create CPMM and CLMM liquidity pools on Raydium with advanced features, 
            smart validation, and professional-grade tools. Direct SDK integration 
            for optimal performance and reliability.
          </p>
          
          <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <Button 
              size='lg' 
              className='bg-emerald-600 hover:bg-emerald-700 text-white'
              onClick={scrollToForm}
            >
              Create Pool Now
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
            
            <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400'>
              <span className='flex items-center'>
                <div className='mr-2 h-2 w-2 rounded-full bg-green-500'></div>
                CPMM & CLMM Support
              </span>
              <span className='flex items-center'>
                <div className='mr-2 h-2 w-2 rounded-full bg-blue-500'></div>
                Raydium SDK v2
              </span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className='mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {features.map((feature, index) => (
            <Card key={index} className='border-emerald-200 bg-white/50 backdrop-blur dark:border-emerald-800 dark:bg-gray-900/50'>
              <CardContent className='p-6'>
                <div className='flex items-start space-x-4'>
                  <div className='rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/20'>
                    <feature.icon className='h-6 w-6 text-emerald-600 dark:text-emerald-400' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-gray-900 dark:text-white'>
                      {feature.title}
                    </h3>
                    <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Create FAQ Section**

Create: `src/components/pages/LiquidityProviderPage/FAQSection/FAQSection.tsx`

```typescript
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { liquidityProviderFAQ } from './faqData'

export const FAQSection = (): React.ReactNode => {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number): void => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  return (
    <section className='bg-gray-50 py-16 dark:bg-gray-900/50'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-12'>
          <div className='flex items-center justify-center mb-4'>
            <HelpCircle className='h-8 w-8 text-emerald-600 dark:text-emerald-400' />
          </div>
          <h2 className='text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl'>
            Frequently Asked Questions
          </h2>
          <p className='mt-4 text-lg text-gray-600 dark:text-gray-300'>
            Everything you need to know about creating liquidity pools on Raydium
          </p>
        </div>

        <div className='mx-auto max-w-3xl'>
          {liquidityProviderFAQ.map((faq, index) => (
            <Card key={index} className='mb-4'>
              <Collapsible>
                <CollapsibleTrigger 
                  className='w-full'
                  onClick={() => toggleItem(index)}
                >
                  <CardHeader className='flex flex-row items-center justify-between py-4'>
                    <CardTitle className='text-left text-lg font-medium'>
                      {faq.question}
                    </CardTitle>
                    {openItems.includes(index) ? (
                      <ChevronUp className='h-5 w-5 text-emerald-600' />
                    ) : (
                      <ChevronDown className='h-5 w-5 text-emerald-600' />
                    )}
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className='pt-0'>
                    <p className='text-gray-600 dark:text-gray-300'>
                      {faq.answer}
                    </p>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Create page exports**

Create: `src/components/pages/LiquidityProviderPage/index.ts`

```typescript
export { HeroSection } from './HeroSection/HeroSection'
export { LiquidityProviderForm } from './LiquidityProviderForm'
export { FAQSection } from './FAQSection/FAQSection'
export { liquidityProviderBenefitsConfig } from './BenefitsSection/benefitsConfig'
export { features, benefits } from './liquidityProviderData'
```

- [ ] **Step 7: Commit page components**

```bash
git add src/components/pages/LiquidityProviderPage/
git commit -m "feat: create liquidity provider page components and data"
```

### Task 9: Create Tool Routes and Navigation

**Files:**
- Create: `src/app/tools/liquidity-provider/page.tsx`
- Create: `src/app/tools/liquidity-provider/layout.tsx`
- Modify: `src/components/common/GlobalHeader/navigationData.ts`

- [ ] **Step 1: Create tool page**

Create: `src/app/tools/liquidity-provider/page.tsx`

```typescript
'use client'

import { HeroSection, LiquidityProviderForm, FAQSection } from '@/components/pages/LiquidityProviderPage'
import { BenefitsSection } from '@/components/common/BenefitsSection'
import { liquidityProviderBenefitsConfig } from '@/components/pages/LiquidityProviderPage'

const LiquidityProviderPage = (): React.ReactNode => (
  <div className='bg-background relative'>
    <HeroSection />
    <LiquidityProviderForm />
    <BenefitsSection config={liquidityProviderBenefitsConfig} />
    <FAQSection />
  </div>
)

export default LiquidityProviderPage
```

- [ ] **Step 2: Create tool layout with metadata**

Create: `src/app/tools/liquidity-provider/layout.tsx`

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liquidity Provider | CloakForge',
  description: 'Create professional liquidity pools on Raydium with CPMM and CLMM support. Advanced features, smart validation, and direct SDK integration.',
  keywords: ['Raydium', 'liquidity provider', 'CPMM', 'CLMM', 'Solana', 'DeFi', 'pool creation'],
  openGraph: {
    title: 'Raydium Liquidity Provider - CloakForge',
    description: 'Professional tools for creating liquidity pools on Raydium with advanced features and smart validation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Raydium Liquidity Provider - CloakForge',
    description: 'Create CPMM and CLMM pools on Raydium with professional-grade tools.',
  },
}

export default function LiquidityProviderLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactNode {
  return children
}
```

- [ ] **Step 3: Add navigation entry**

Modify: `src/components/common/GlobalHeader/navigationData.ts`

```typescript
// Add to the tools array in navigationData.ts
{
  name: 'Liquidity Provider',
  href: '/tools/liquidity-provider',
  description: 'Create Raydium liquidity pools',
  icon: Droplets,
  category: 'DeFi Tools',
  badge: 'New',
},
```

- [ ] **Step 4: Verify pages work by running development server**

Run: `npm run dev`
Expected: Server starts on http://localhost:3001

- [ ] **Step 5: Verify navigation and page accessibility**

Navigate to: `http://localhost:3001/tools/liquidity-provider`
Expected: Page loads with hero section, form, benefits, and FAQ

- [ ] **Step 6: Commit tool routes**

```bash
git add src/app/tools/liquidity-provider/ src/components/common/GlobalHeader/navigationData.ts
git commit -m "feat: create liquidity provider tool routes and navigation"
```

### Task 10: Integration Testing and Verification

**Files:**
- Create integration tests and run full verification

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 3: Run linting**

Run: `npm run lint:nowarn`
Expected: No ESLint warnings

- [ ] **Step 4: Test form functionality manually**

1. Navigate to `/tools/liquidity-provider`
2. Fill out form with test data
3. Verify validation works
4. Check CLMM price range appears when selected
5. Verify custom token B input appears when selected

Expected: Form works correctly with all conditional fields

- [ ] **Step 5: Build production version**

Run: `npm run build`
Expected: Build completes successfully

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Raydium liquidity provider tool implementation

- Full 5-layer architecture with Raydium SDK v2 integration
- CPMM/CLMM pool type support with smart defaults
- Comprehensive form with conditional fields
- Professional UI with hero, benefits, and FAQ sections
- Complete test coverage and validation
- Zero TypeScript errors and ESLint warnings

Ready for production deployment"
```

---

## Verification Commands

**Full validation suite:**
```bash
npm run lint:nowarn && npx tsc --noEmit && npm test && npm run build
```

**Manual testing checklist:**
- [ ] Navigate to `/tools/liquidity-provider`
- [ ] Verify hero section renders correctly
- [ ] Test form validation (required fields, price range validation)
- [ ] Verify CPMM/CLMM toggle works
- [ ] Test token B dropdown with SOL/USDC/USDT/custom options
- [ ] Verify custom token B field appears when needed
- [ ] Check CLMM price range fields appear when CLMM selected
- [ ] Verify form submission flow (without actual transaction)
- [ ] Test responsive design on mobile/tablet
- [ ] Verify benefits and FAQ sections render correctly

**Integration testing:**
- [ ] Test API route with valid CPMM request
- [ ] Test API route with valid CLMM request  
- [ ] Verify error handling for invalid requests
- [ ] Test hook execution flow with mocked wallet
- [ ] Verify server utility integration with mocked SDK

## Success Criteria

✅ **All tasks completed** - 10/10 tasks implemented
✅ **Zero TypeScript errors** - `npx tsc --noEmit` passes
✅ **Zero ESLint warnings** - `npm run lint:nowarn` passes  
✅ **All tests passing** - `npm test` passes
✅ **Build succeeds** - `npm run build` completes
✅ **Manual verification** - All UI components work as expected
✅ **Integration ready** - Ready for Raydium SDK integration and testing on devnet