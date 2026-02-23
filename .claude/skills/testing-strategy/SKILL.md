---
name: testing-strategy
description: 'TDD patterns, test pyramid, and coverage guidance for CloakForge. Use when writing tests, validating implementations, or planning QA strategy.'
---

# Testing Strategy

## Priority Matrix

| Layer            | What to Test                                              | Priority |
| ---------------- | --------------------------------------------------------- | -------- |
| Server utilities | Input validation, error cases, TX building                | High     |
| API routes       | Request/response shapes, error handling, status codes     | High     |
| Schemas          | Valid/invalid inputs, edge cases                          | High     |
| Hooks            | State transitions, error states, loading states           | Medium   |
| Components       | User interactions, conditional rendering, form validation | Medium   |

## Mocking Patterns

- Solana RPC: mock `@solana/web3.js` test utilities
- Server config: mock `getServerConfig()`
- Wallet: mock wallet adapter
- Module mocking: `vi.mock()` (Vitest)

## What NOT to Test

- shadcn/ui component internals
- React Compiler optimizations
- Third-party library behavior
- Private implementation details
