# Code Review Checklists by File Type

## Zod Schemas (`src/lib/schemas/`)

- [ ] Schema exported as const, named `{feature}Schema`
- [ ] Inferred TypeScript type exported: `export type {Feature} = z.infer<typeof {feature}Schema>`
- [ ] All fields have explicit validation messages
- [ ] Solana addresses validated with `.refine(isValidSolanaAddress, 'Invalid Solana address')`
- [ ] Amount fields: `.min(0)` or `.positive()` with sensible max
- [ ] No business logic in schema — schemas validate shape only
- [ ] Tests exist in `__tests__/{feature}Schema.test.ts`

```ts
// Good
export const recipientSchema = z.object({
  address: z.string().refine(isValidSolanaAddress, { message: 'Invalid Solana address' }),
  amount: z.number().positive('Amount must be positive').max(1_000_000, 'Amount too large'),
})
export type Recipient = z.infer<typeof recipientSchema>

// Bad — no validation messages, no type export
const schema = z.object({ address: z.string(), amount: z.number() })
```

## API Routes (`src/app/api/solana/{tool}/route.ts`)

- [ ] `'server-only'` NOT needed here (routes are server-only by Next.js convention), but server utilities it calls must have it
- [ ] Input validated with Zod before any processing
- [ ] Logger initialized: `const logger = getLogger({ context: 'api/{tool}' })`
- [ ] Error caught and returned as `AppError`-shaped response
- [ ] No user data logged (privacy-first)
- [ ] Returns `{ transaction: base64string }` on success
- [ ] HTTP status codes are correct (400 for validation, 500 for server errors)

```ts
// Good
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const params = mySchema.parse(body)          // throws ZodError if invalid
    const transaction = await createMyTransaction(params)
    return NextResponse.json({ transaction })
  } catch (error) {
    logger.error('Failed', { error })
    const appError = AppError.from(error)
    return NextResponse.json({ error: appError.message }, { status: appError.statusCode })
  }
}
```

## Server-Side Utilities (`src/lib/solana/server-side/`)

- [ ] `'server-only'` directive at top of file (first line after imports)
- [ ] Uses `rpcPrivateEndpoint` from `getServerConfig()` — never hardcoded URL
- [ ] Returns serialized transaction as base64 string
- [ ] No wallet interaction — only builds and serializes
- [ ] Logger initialized with specific context
- [ ] `AppError` or `SolanaError` thrown on failures

```ts
// Good
import 'server-only'
import { getServerConfig } from '@/lib/config/serverConfig'

export async function createMyTransaction(params: MyParams): Promise<string> {
  const { rpcPrivateEndpoint } = getServerConfig()
  const connection = new Connection(rpcPrivateEndpoint)
  // ...
  return transaction.serialize({ requireAllSignatures: false }).toString('base64')
}

// Bad — missing 'server-only', hardcoded RPC
export async function createMyTransaction(params: MyParams) {
  const connection = new Connection('https://api.mainnet-beta.solana.com')
```

## Client Hooks (`src/hooks/solana/use{Tool}.ts`)

- [ ] `'use client'` directive present
- [ ] Validates `publicKey` exists before any transaction code
- [ ] Checks SOL balance before submitting (if required)
- [ ] Calls API route to get prepared transaction
- [ ] Deserializes base64, signs, sends via wallet adapter
- [ ] Returns `{ execute, isPending, error, signature }` shape
- [ ] Error handled with `handleError()` — no raw error messages to UI

```ts
// Wallet check pattern
if (!publicKey) {
  throw new AppError('Please connect your wallet first', 400)
}
```

## Page Components (`src/components/pages/{Tool}Page/`)

- [ ] Uses `CustomFormField` for all form fields
- [ ] Uses `WalletConnectionButton` — not custom wallet UI
- [ ] Shows `LoadingSpinner` (with `aria-label`) during pending states
- [ ] Uses `ExplorerLink` for transaction signatures
- [ ] Uses `FeeBreakdown` for fee display
- [ ] Uses `InfoTooltip` for technical terms
- [ ] No manual `useMemo` / `useCallback` / `React.memo`
- [ ] Error messages go through `handleError()` — not shown raw

## Test Files (`__tests__/`)

- [ ] Describes use `describe('{FunctionName}')` format
- [ ] Test cases use `it('should {expected behavior}')` format
- [ ] RPC mocked — no real network calls
- [ ] `getServerConfig()` mocked in server-side tests
- [ ] Tests cover: happy path, validation errors, edge cases
- [ ] No `any` in test helpers or mocks

## Common Findings Reference

| Finding | Severity | File Type |
| ------- | -------- | --------- |
| Missing `'server-only'` | CRITICAL | server utils |
| Hardcoded public RPC URL | CRITICAL | server utils, API routes |
| No wallet connection check | CRITICAL | client hooks |
| Raw `throw new Error()` | IMPORTANT | all |
| Missing Zod validation in API route | IMPORTANT | API routes |
| `useMemo`/`useCallback` used | IMPORTANT | components, hooks |
| Barrel import bypassed | IMPORTANT | all |
| `console.log` instead of logger | MINOR | all |
| Missing `aria-label` on `LoadingSpinner` | MINOR | components |
| Magic numbers in schema | MINOR | schemas |
| No test for new utility function | MINOR | server utils |
