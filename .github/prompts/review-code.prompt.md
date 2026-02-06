---
description: "Review code changes for quality, security, and Solana safety"
---

Review the current code changes using this structured checklist:

## Review Checklist

### 1. Correctness
- Does the code do what it claims?
- Are edge cases handled (null, empty, boundary)?
- Are loading, error, and empty states handled in UI?
- Does error handling use `AppError`/`SolanaError` + `handleError()`?

### 2. Security & Solana Safety
- No hardcoded secrets, private keys, or RPC endpoints?
- Server-side code uses private RPC only (`getServerConfig()`)?
- No user data stored server-side (privacy-first)?
- Wallet inputs validated with `isValidSolanaAddress`?
- Transaction instruction ordering correct (service memo first, fee second)?

### 3. Maintainability
- Follows existing patterns from `docs/TOOLING.md`?
- Solana imports from `@/lib/solana` barrel (not individual files)?
- Components reuse from `src/components/common/`?
- Arrow function components, no `any`, no `console.log`?
- Functions small and single-purpose?

### 4. Testing
- New code has tests (if test infra exists)?
- Tests cover happy path, errors, and edge cases?

### 5. Performance
- Cache Components pattern correct (`'use cache'` + `cacheLife()`)?
- No public RPC calls in server-side code?
- No unnecessary re-renders?

## Output Format

For each finding, report:
- **Severity**: Blocker / Major / Minor / Nit
- **Category**: Correctness / Security / Maintainability / Testing / Performance
- **Problem**: What's wrong and why
- **Suggestion**: How to fix it

Use `#changes` to get the current source control changes for review.
