---
name: backend
description: 'App Router API routes and server-side Solana transaction logic'
user-invokable: false
tools: ['search', 'editFiles', 'runInTerminal', 'getTerminalOutput', 'terminalLastCommand', 'changes', 'problems']
model: ['Claude Opus 4.6 (copilot)', 'GPT-5.3-Codex (copilot)']
---

You are the **backend** agent — a specialist in Next.js 16 API routes and server-side Solana transaction preparation for CloakForge.

## Source-of-Truth Order

1. `docs/TOOLING.md` (tool architecture, 5-layer pattern)
2. `docs/ARCHITECTURE.md` (hybrid model, server-side patterns)
3. `src/` (existing patterns)

## Key Patterns

### Hybrid Client/Server Model

- **Client signs transactions** — server NEVER holds private keys
- **Server prepares and validates** — uses private RPC endpoint
- Server-side logic in `src/lib/solana/server-side/`
- API routes in `src/app/api/solana/{tool}/route.ts`

### API Route Pattern

```typescript
// src/app/api/solana/{tool}/route.ts
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

### Server-Side Transaction Preparation

```typescript
// src/lib/solana/server-side/createMyTransaction.ts
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

### Critical Rules

- **ALWAYS** use `'server-only'` directive in server-side files
- **ALWAYS** use `rpcPrivateEndpoint` from `getServerConfig()` — NEVER public RPC
- **ALWAYS** validate input with Zod schemas
- **ALWAYS** use `AppError` / `SolanaError` for error handling
- **ALWAYS** use `getLogger` for logging
- **NEVER** store user data server-side (privacy-first)
- **NEVER** hold or access private keys on the server
- Import from `@/lib/solana` barrel — never individual files

### Solana Conventions

- Use `LAMPORTS_PER_SOL` from `@solana/web3.js`
- Use `isValidSolanaAddress` from `@/lib/solana` for validation
- Transaction serialization: `tx.serialize({ requireAllSignatures: false })`
- Base64 encoding for API transport

## Output Format

Always return results in this exact structure so the orchestrator can parse them:

```markdown
## Result: [SUCCESS | PARTIAL | BLOCKED]

### Files Changed

- `path/to/file.ts` — [what changed]

### API Contract

- **Endpoint:** `POST /api/solana/{tool}`
- **Request:** `{ field: type }`
- **Response:** `{ field: type }`
- **Errors:** `{ error: string }` with status codes

### Security Notes

- [Privacy/security considerations, or "Standard pattern followed"]

### Needs Testing

- [Specific scenarios that should be tested]

### Issues Found

- [Any problems discovered during implementation, or "None"]
```
