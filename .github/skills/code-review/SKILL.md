# Code Review Skill

This skill provides a structured methodology for reviewing CloakForge code changes.

## When to Use

Use this skill when reviewing code, evaluating pull requests, or assessing code quality.

## Review Checklist

### 1. Correctness
- Does the code do what it claims to do?
- Are edge cases handled (null, empty, boundary values)?
- Are error paths handled with `AppError`/`SolanaError` + `handleError()`?
- Does it match the patterns in `docs/TOOLING.md`?
- Are loading, error, and empty UI states present?

### 2. Security & Solana Safety
- No hardcoded secrets, tokens, private keys, or RPC endpoints?
- Server-side code uses `getServerConfig().rpcPrivateEndpoint` only?
- No user data stored server-side (privacy-first principle)?
- Wallet addresses validated with `isValidSolanaAddress`?
- Transaction instruction ordering: service memo first, fee transfer second?
- Balance pre-checks before transaction submission?
- Ownership validation for authority operations?

### 3. Maintainability
- Functions are small and single-purpose (<150 lines for components)?
- Naming follows conventions (PascalCase components, camelCase hooks, kebab-case routes)?
- Solana imports from `@/lib/solana` barrel (never individual files)?
- Components reuse from `src/components/common/` where possible?
- Arrow function components used (`namedComponents: 'arrow-function'`)?
- No `any` types (strict TypeScript enforced)?
- No `console.log` (uses `getLogger()` instead)?
- Comments explain *why*, not *what*?

### 4. Testing
- New code has corresponding tests (if test infra exists)?
- Tests cover happy path, error cases, and edge cases?
- Tests are deterministic (no flaky behavior)?
- Solana-specific: wallet mock, RPC mock, transaction verification?

### 5. Performance
- Cache Components pattern correct (`'use cache'` + `cacheLife()` + `cacheTag()`)?
- No unnecessary public RPC calls in server code?
- React Compiler compatible (no manual memoization needed)?
- Large lists paginated or virtualized?
- No memory leaks (event listeners, subscriptions cleaned up)?

### 6. CloakForge Conventions
- Follows 5-layer tool architecture from `docs/TOOLING.md`?
- Uses `useToolBase` for hook error handling?
- Uses `apiClient<Req, Res>()` for type-safe API calls?
- Uses `ToolActionButton` for auto-disable when tool disabled?
- Zod schemas in `src/lib/schemas/` for validation?

## Severity Levels

| Level | Label | Description | Action |
|-------|-------|-------------|--------|
| 🔴 | Blocker | Security flaw, Solana safety issue, data loss risk | Must fix before merge |
| 🟠 | Major | Bug, missing error handling, broken flow | Should fix before merge |
| 🟡 | Minor | Style, naming, minor optimization | Fix in this PR or follow-up |
| 🔵 | Nit | Suggestion, preference, nice-to-have | Optional |

## Review Comment Format

```
[SEVERITY] Category: Brief description

**Problem:** What's wrong and why it matters
**Suggestion:** How to fix it
**Example:** (optional code snippet)
```

## Decision Framework

- **APPROVE** — No blockers, lint passes (`npm run lint:nowarn`), code is clean
- **REQUEST CHANGES** — Has blocker(s) or multiple major issues
- **COMMENT** — Questions or suggestions, no blocking issues
