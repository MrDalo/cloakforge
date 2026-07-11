---
globs: src/app/api/**/*.{ts,tsx}, src/lib/solana/server-side/**/*.ts
description: Backend conventions for API routes and server-side Solana transaction logic
---

## Hybrid Client/Server Model

- Client signs transactions — server NEVER holds private keys
- Server prepares and validates — uses private RPC endpoint
- Server-side logic lives in `src/lib/solana/server-side/`
- API routes live in `src/app/api/solana/{tool}/route.ts`

## API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerConfig } from '@/lib/config/serverConfig'
import { getLogger } from '@/lib/logger/logger'
import { AppError } from '@/lib/errors'

const logger = getLogger({ context: 'api/{tool}' })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Validate with Zod schema
    // Call server-side utility
    // Return serialized transaction
    return NextResponse.json({ transaction: serializedTx })
  } catch (error) {
    logger.error('Failed to create transaction', { error })
    const appError = AppError.from(error)
    return NextResponse.json({ error: appError.message }, { status: appError.statusCode })
  }
}
```

## Server Utility Template

```typescript
import 'server-only'
import { getServerConfig } from '@/lib/config/serverConfig'
import { getLogger } from '@/lib/logger/logger'

export async function createMyTransaction(params: MyParams) {
  const { rpcPrivateEndpoint } = getServerConfig()
  // Use rpcPrivateEndpoint for all RPC calls
  // Build transaction
  // Return serialized (base64)
}
```

## Critical Rules

- **ALWAYS** use `'server-only'` directive in server-side files
- **ALWAYS** use `rpcPrivateEndpoint` from `getServerConfig()` — NEVER public RPC
- **ALWAYS** validate input with Zod schemas
- **ALWAYS** use `AppError` / `SolanaError` for error handling
- **ALWAYS** use `getLogger` for logging
- **NEVER** store user data server-side (privacy-first)
- **NEVER** hold or access private keys on the server
- Import from `@/lib/solana` barrel — never individual files
