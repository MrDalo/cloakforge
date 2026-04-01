# API Endpoint Template

## Standard Files

```
src/app/api/solana/{endpoint}/route.ts           # API route
src/lib/schemas/apiSchemas.ts                    # Extend with new schema
src/lib/solana/server-side/{operation}.ts       # Server utility
```

## Agent Task Order

1. **Backend Agent** - Create route, schema, server utility
2. **Tester Agent** - API route tests
3. **Reviewer Agent** - Security and validation audit

## Standard Patterns

- POST method with Zod validation
- Uses `getServerConfig()` for private RPC
- Returns serialized transaction as base64
- Consistent error handling with `AppError`
