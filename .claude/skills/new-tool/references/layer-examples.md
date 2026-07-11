# Layer Examples — New Tool Reference

## Contents
1. [Layer 1: Types & Zod Schema](#1-layer-1-types--zod-schema)
2. [Layer 2: Server Utility](#2-layer-2-server-utility)
3. [Layer 3: API Route](#3-layer-3-api-route)
4. [Layer 4: Client Hook](#4-layer-4-client-hook)
5. [Layer 5: UI Components](#5-layer-5-ui-components)

---

## 1. Layer 1: Types & Zod Schema

### `src/types/myTool.ts`
```typescript
import type { PublicKey, Transaction } from '@solana/web3.js'

export interface MyToolParams {
  walletPublicKey: PublicKey
  tokenAddress: string | PublicKey
  amount: number
  decimals: number
}

export interface MyToolResult {
  transaction: Transaction
  message: string
}
```

### Add to `src/lib/schemas/apiSchemas.ts`
```typescript
export const myToolRequestSchema = z.object({
  walletAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Wallet address is required'),
  tokenAddress: solanaAddressSchema.refine((val) => val.length > 0, 'Token address is required'),
  amount: z.number().min(0.000001, 'Amount must be greater than 0'),
  decimals: z.number().int().min(0).max(9, 'Decimals must be between 0 and 9'),
  tokenSymbol: z.string().optional(),
})

export type MyToolRequestSchema = z.infer<typeof myToolRequestSchema>
```

### Add to `src/types/api.ts` (response type)
```typescript
export interface UnsignedMyToolTransactionResponse {
  serializedTransaction: string
  message: string
}
```

---

## 2. Layer 2: Server Utility

`src/lib/solana/server-side/createMyToolTransaction.ts`

```typescript
import 'server-only'

import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js'
import { createMyInstruction, TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token'
import { addComputeBudgetInstructions, calculateDynamicPriorityFee, createConnectionPair, lamportsToSol } from '@/lib/solana'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import getServerConfig from '@/lib/config/getServerConfig'
import { getCachedToolConfig } from '@/lib/contentful/toolConfigCache'
import { createServiceMemoInstruction, SERVICE_IDENTIFIERS } from '../serviceMemo'
import type { MyToolParams, MyToolResult } from '@/types/myTool'

export async function createMyToolTransaction(params: MyToolParams): Promise<MyToolResult> {
  const { walletPublicKey, tokenAddress, amount, decimals } = params
  const serverConfig = getServerConfig()
  const { kitRpc, legacyConnection } = createConnectionPair(serverConfig.rpcPrivateEndpoint)

  const logger = getLogger({
    context: 'my-tool',
    function: 'createMyToolTransaction',
    wallet: walletPublicKey.toString(),
  })

  try {
    const tokenPubkey = typeof tokenAddress === 'string' ? new PublicKey(tokenAddress) : tokenAddress

    // 1. Validate inputs
    if (amount <= 0) throw new AppError('INVALID_AMOUNT', 'Amount must be greater than zero')

    // 2. Detect token program from on-chain account
    const accountInfo = await legacyConnection.getAccountInfo(tokenPubkey, 'confirmed')
    if (!accountInfo) throw new AppError('TOKEN_NOT_FOUND', 'Token not found')

    let tokenProgramId: PublicKey
    if (accountInfo.owner.equals(TOKEN_PROGRAM_ID)) {
      tokenProgramId = TOKEN_PROGRAM_ID
    } else if (accountInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      tokenProgramId = TOKEN_2022_PROGRAM_ID
    } else {
      throw new AppError('INVALID_INPUT', `Unknown token program: ${accountInfo.owner}`)
    }

    // 3. Validate authority (example: mint authority check)
    const mintInfo = await getMint(legacyConnection, tokenPubkey, 'confirmed', tokenProgramId)
    if (!mintInfo.mintAuthority?.equals(walletPublicKey)) {
      throw new AppError('UNAUTHORIZED', 'You are not the authority for this token')
    }

    // 4. Get service fee
    let totalServiceFeeSOL = 0
    try {
      const toolConfig = await getCachedToolConfig('my-tool')
      if (toolConfig?.baseFee) totalServiceFeeSOL = toolConfig.baseFee
    } catch {
      logger.warn('Tool config fetch failed, using fallback fee')
      totalServiceFeeSOL = 0.009
    }

    // 5. Check SOL balance
    const balanceLamports = await legacyConnection.getBalance(walletPublicKey)
    const walletBalance = lamportsToSol(balanceLamports)
    const estimatedCost = 0.0001 + totalServiceFeeSOL
    if (walletBalance < estimatedCost) {
      throw new AppError('INSUFFICIENT_FUNDS', `Need ${estimatedCost.toFixed(4)} SOL, have ${walletBalance.toFixed(4)} SOL`)
    }

    // 6. Dynamic priority fee
    const dynamicPriorityFee = await calculateDynamicPriorityFee(kitRpc, logger).catch(() => 1_000)

    // 7. Build transaction
    const { blockhash } = await legacyConnection.getLatestBlockhash('confirmed')
    const transaction = new Transaction()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = walletPublicKey

    addComputeBudgetInstructions(transaction, 100_000, dynamicPriorityFee)
    transaction.add(createServiceMemoInstruction(SERVICE_IDENTIFIERS.MY_TOOL))

    // Deduplication nonce
    const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')
    const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(8))).toString('base64')
    transaction.add(new TransactionInstruction({
      keys: [], programId: MEMO_PROGRAM_ID,
      data: Buffer.from(`my-tool:${nonce}`, 'utf-8'),
    }))

    // Service fee
    if (totalServiceFeeSOL > 0) {
      transaction.add(SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: new PublicKey(serverConfig.feeWalletAddress),
        lamports: Math.floor(totalServiceFeeSOL * LAMPORTS_PER_SOL),
      }))
    }

    // Core instruction
    transaction.add(createMyInstruction(tokenPubkey, walletPublicKey, amount, tokenProgramId))

    // Validate size
    transaction.serialize({ requireAllSignatures: false })

    return { transaction, message: `Ready to process ${amount} tokens` }
  } catch (error) {
    logger.error('createMyToolTransaction failed', error)
    if (error instanceof AppError) throw error
    throw new AppError('TRANSACTION_FAILED', 'Failed to prepare transaction. Please try again.')
  }
}
```

---

## 3. Layer 3: API Route

`src/app/api/solana/my-tool/route.ts`

```typescript
import 'server-only'
import { createSolanaApiRoute } from '@/lib/api'
import { createMyToolTransaction } from '@/lib/solana/server-side/createMyToolTransaction'
import { myToolRequestSchema } from '@/lib/schemas/apiSchemas'
import type { UnsignedMyToolTransactionResponse } from '@/types'

export const POST = createSolanaApiRoute({
  name: 'solana/my-tool',
  schema: myToolRequestSchema,
  additionalAddressFields: ['tokenAddress'],  // converted to PublicKey in data
  handler: async (data) => {
    const result = await createMyToolTransaction({
      walletPublicKey: data.walletPublicKey,  // already PublicKey from factory
      tokenAddress: data.tokenAddress,
      amount: data.amount,
      decimals: data.decimals,
    })

    const response: UnsignedMyToolTransactionResponse = {
      serializedTransaction: Buffer.from(
        result.transaction.serialize({ requireAllSignatures: false })
      ).toString('base64'),
      message: result.message,
    }

    return response
  },
})
```

---

## 4. Layer 4: Client Hook

`src/hooks/solana/useMyTool.ts`

```typescript
'use client'
import { useCallback } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction } from '@solana/web3.js'
import { useToolBase, type ToolExecutionContext, type UseToolBaseReturn } from './useToolBase'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'
import { apiClient } from '@/lib/utils/apiClient'
import { validateBalance } from '@/lib/solana/validateBalance'
import { confirmTransactionWithParallelStrategy, createConnectionPair } from '@/lib/solana'
import { useToolConfig } from '@/stores/toolConfigStore'
import { showTransactionToast } from '@/lib/toast/showTransactionToast'
import type { MyToolRequest, UnsignedMyToolTransactionResponse } from '@/types/api'

export interface MyToolParams {
  tokenAddress: string
  amount: number
  decimals: number
  tokenSymbol?: string
}

export interface MyToolResult {
  signature: string
  message: string
  confirmed: boolean
}

export type UseMyToolReturn = Omit<UseToolBaseReturn<MyToolParams, MyToolResult>, 'execute' | 'validateRequirements'> & {
  executeMyTool: UseToolBaseReturn<MyToolParams, MyToolResult>['execute']
}

export function useMyTool(): UseMyToolReturn {
  const { connection } = useConnection()
  const { config } = useToolConfig('my-tool')

  const executeMyTool = useCallback(
    async (context: ToolExecutionContext, params: MyToolParams): Promise<MyToolResult> => {
      const { tokenAddress, amount, decimals, tokenSymbol = 'tokens' } = params
      const logger = getLogger({ context: 'my-tool', hook: 'useMyTool', wallet: context.walletAddress })

      // 1. Client-side validation
      if (!tokenAddress || amount <= 0) throw new AppError('INVALID_INPUT', 'Invalid parameters')

      // 2. Balance check
      const balanceValidation = await validateBalance({
        walletPublicKey: new PublicKey(context.walletAddress),
        connection,
        serviceId: 'my-tool',
        formData: {},
        serviceFee: config?.baseFee ?? 0.009,
        networkFee: config?.networkFee ?? 0.0005,
      })
      if (!balanceValidation.hasSufficientBalance) {
        throw new AppError('INSUFFICIENT_FUNDS', `Need ${balanceValidation.estimatedCost.toFixed(4)} SOL`)
      }

      // 3. Fetch prepared transaction from server
      const requestBody: MyToolRequest = { walletAddress: context.walletAddress, tokenAddress, amount, decimals }
      let apiResponse: UnsignedMyToolTransactionResponse
      try {
        apiResponse = await apiClient<MyToolRequest, UnsignedMyToolTransactionResponse>('/api/solana/my-tool', requestBody)
      } catch (error) {
        if (error instanceof AppError) throw error
        throw new AppError('TRANSACTION_FAILED', `API call failed: ${(error as Error)?.message}`)
      }

      // 4. Deserialize + refresh blockhash
      const transaction = Transaction.from(Buffer.from(apiResponse.serializedTransaction, 'base64'))
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash

      // 5. Sign
      let signedTx: Transaction
      try {
        signedTx = await context.signTransaction(transaction)
      } catch (error) {
        if (error instanceof Error && (error.message.includes('rejected') || error.message.includes('cancelled'))) {
          throw new AppError('TRANSACTION_FAILED', 'Transaction cancelled by user')
        }
        throw new AppError('TRANSACTION_FAILED', 'Signing failed. Please try again.')
      }

      // 6. Send
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // 7. Confirm
      const { kitRpc } = createConnectionPair()
      const confirmResult = await confirmTransactionWithParallelStrategy(signature, 50_000, kitRpc, connection, logger)
      if (!confirmResult.confirmed) {
        throw new AppError('FINALIZATION_TIMEOUT', 'Confirmation timed out. Check Solana Explorer for status.')
      }

      return { signature, message: `Successfully processed ${amount} ${tokenSymbol}`, confirmed: true }
    },
    [connection, config]
  )

  const toolBase = useToolBase<MyToolParams, MyToolResult>(
    { toolId: 'my-tool', toolName: 'My Tool', requiresWallet: true },
    executeMyTool
  )

  const executeMyToolWithToast: UseToolBaseReturn<MyToolParams, MyToolResult>['execute'] = useCallback(
    async (params) => {
      const result = await toolBase.execute(params)
      if (result) showTransactionToast(result.signature, result.message)
      return result
    },
    [toolBase]
  )

  return {
    executeMyTool: executeMyToolWithToast,
    isExecuting: toolBase.isExecuting,
    lastResult: toolBase.lastResult,
    reset: toolBase.reset,
    isWalletReady: toolBase.isWalletReady,
    validationErrors: toolBase.validationErrors,
  }
}
```

---

## 5. Layer 5: UI Components

### Page (`src/app/tools/my-tool/page.tsx`)
```typescript
import type { Metadata } from 'next'
import { MyToolPage } from '@/components/pages/MyToolPage/MyToolPage'

export const metadata: Metadata = {
  title: 'My Tool | CloakForge',
  description: 'Description for SEO',
}

export default function MyToolRoute() {
  return <MyToolPage />
}
```

### Page Component (`src/components/pages/MyToolPage/MyToolPage.tsx`)
```typescript
'use client'
import { useState } from 'react'
import { WalletConnectionButton } from '@/components/common/WalletConnectionButton'
import { ExplorerLink } from '@/components/common/ExplorerLink'
import { MyToolForm } from './MyToolForm'
import { useMyTool } from '@/hooks/solana/useMyTool'

export function MyToolPage() {
  const { executeMyTool, isExecuting, lastResult, isWalletReady } = useMyTool()

  return (
    <main className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">My Tool</h1>
      <p className="text-muted-foreground mb-6">Description of what this tool does.</p>

      {!isWalletReady ? (
        <WalletConnectionButton />
      ) : (
        <MyToolForm onSubmit={executeMyTool} isSubmitting={isExecuting} />
      )}

      {lastResult && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-green-600 font-medium">{lastResult.message}</p>
          <ExplorerLink signature={lastResult.signature} className="mt-2" />
        </div>
      )}
    </main>
  )
}
```

### Form (`src/components/pages/MyToolPage/MyToolForm.tsx`)
```typescript
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { CustomFormField } from '@/components/common/CustomFormField'
import { FeeBreakdown } from '@/components/common/FeeBreakdown'
import { InfoTooltip } from '@/components/common/InfoTooltip'
import type { MyToolParams } from '@/hooks/solana/useMyTool'

const formSchema = z.object({
  tokenAddress: z.string().min(1, 'Token address is required'),
  amount: z.number().min(0.000001, 'Amount must be greater than 0'),
})

interface MyToolFormProps {
  onSubmit: (params: MyToolParams) => Promise<unknown>
  isSubmitting: boolean
}

export function MyToolForm({ onSubmit, isSubmitting }: MyToolFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { tokenAddress: '', amount: 0 },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit({ ...data, decimals: 6 }))} className="space-y-4">
        <CustomFormField
          control={form.control}
          name="tokenAddress"
          label={<>Token Address <InfoTooltip content="The SPL token mint address" /></>}
          placeholder="Enter token address"
        />
        <CustomFormField
          control={form.control}
          name="amount"
          label="Amount"
          type="number"
          placeholder="0.00"
        />
        <FeeBreakdown serviceId="my-tool" />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Processing...' : 'Execute'}
        </Button>
      </form>
    </Form>
  )
}
```
