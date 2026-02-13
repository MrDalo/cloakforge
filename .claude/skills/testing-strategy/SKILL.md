---
name: testing-strategy
description: 'TDD patterns, test pyramid, and coverage guidance for CloakForge. Use when writing tests, validating implementations, or planning QA strategy.'
---

# Testing Strategy Skill

## Test Pyramid

1. **Unit Tests** (70%) — Pure functions, utilities, schema validation
2. **Component Tests** (20%) — React components with RTL
3. **Integration Tests** (8%) — API routes, hook + API flows
4. **E2E Tests** (2%) — Critical user paths only

## File Conventions

- Test files: `__tests__/{name}.test.ts` or `{name}.test.tsx`
- Co-locate with source when possible
- Naming: `describe('{FunctionName}')`, `it('should {expected behavior}')`

## Test Commands

- `npm test` — run all tests
- `npm run test:watch` — watch mode
- `npm run test:coverage` — with coverage

## What to Test

| Layer            | Test                                                      | Priority |
| ---------------- | --------------------------------------------------------- | -------- |
| Server utilities | Input validation, error cases, TX building                | High     |
| API routes       | Request/response shapes, error handling, status codes     | High     |
| Hooks            | State transitions, error states, loading states           | Medium   |
| Components       | User interactions, conditional rendering, form validation | Medium   |
| Schemas          | Valid/invalid inputs, edge cases                          | High     |

## Mocking Patterns

- Solana RPC: mock `@solana/web3.js` test utilities
- Server config: mock `getServerConfig()`
- Wallet: mock wallet adapter
- Module mocking: `vi.mock()` (Vitest)

## TDD Workflow

1. Write failing test (Red)
2. Write minimal code to pass (Green)
3. Refactor while tests pass (Refactor)
4. Repeat
