---
name: code-review
description: 'Structured code review checklists and severity levels for CloakForge. Use when reviewing code changes, PRs, or implementation quality.'
---

# Code Review Skill

## Severity Levels

| Level | Label      | Meaning                                   | Action                  |
| ----- | ---------- | ----------------------------------------- | ----------------------- |
| 🔴    | Critical   | Security flaw, data loss, breaking change | Must fix before merge   |
| 🟡    | Important  | Bug, missing validation, anti-pattern     | Should fix before merge |
| 🟢    | Minor      | Style, naming, optimization               | Fix if time permits     |
| 💡    | Suggestion | Alternative approach, future improvement  | Optional                |

## Review Checklist

### Security (Web3-Critical)

- No private keys in client code
- Server uses `rpcPrivateEndpoint` (never public)
- Input validated with Zod schemas
- No user data stored server-side
- Transaction amounts validated
- No XSS vectors

### Correctness

- Logic handles edge cases
- Error handling complete (AppError/SolanaError)
- No `any` types
- Async states handled (loading, error, success)

### Patterns

- Follows 5-layer tool architecture
- Reuses common components (no duplication)
- Imports from `@/lib/solana` barrel
- Logging via `getLogger()`
- No manual memoization

### Performance

- `'use cache'` where appropriate
- No unnecessary re-renders
- Images via next/image
- Bundle impact considered

## Review Verdict

- **APPROVED**: No critical/important findings, lint passes
- **NEEDS_REVISION**: Important findings, no critical
- **FAILED**: Critical findings present
