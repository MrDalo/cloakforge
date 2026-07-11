---
name: testing-strategy
description: TDD patterns, test pyramid, and coverage guidance for CloakForge. Use when implementing features with TDD methodology, writing unit/integration tests, planning test coverage strategies, validating test quality, establishing testing workflows for new functionality, or debugging test failures in Solana/Web3 applications.
---

# Testing Strategy

Comprehensive testing methodology for CloakForge's Web3 application stack.

## Test-Driven Development Workflow

### Red-Green-Refactor Cycle

1. **Red**: Write failing test defining desired behavior
2. **Green**: Write minimal code to make test pass
3. **Refactor**: Improve code while maintaining passing tests

### Implementation Order

```
Schema Tests → Server Utility Tests → API Route Tests → Hook Tests → Component Tests
```

Each layer builds on the tested foundation below it.

## Test Pyramid (CloakForge-Specific)

| Test Type | Percentage | Focus | Tools |
|-----------|------------|-------|--------|
| Unit Tests | 70% | Pure functions, utilities, schemas | Vitest |
| Component Tests | 20% | React components with RTL | Vitest + RTL |
| Integration Tests | 8% | API routes, hook + API flows | Vitest + MSW |
| E2E Tests | 2% | Critical user paths | Playwright |

## Priority Matrix

### High Priority (Must Test)
- **Server utilities**: Input validation, error cases, transaction building
- **API routes**: Request/response shapes, error handling, status codes
- **Schemas**: Valid/invalid inputs, edge cases, Zod transformations

### Medium Priority (Should Test)
- **Hooks**: State transitions, error states, loading states
- **Components**: User interactions, conditional rendering, form validation

## CloakForge Testing Patterns

### Solana Transaction Testing

```typescript
// Test transaction building
const mockInstruction = vi.mocked(createTransferInstruction)
const result = await createMyTransaction(params)
expect(mockInstruction).toHaveBeenCalledWith(/* expected params */)
expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/) // base64 format
```

### API Route Testing

```typescript
// Test POST /api/solana/my-tool/route
const response = await POST(request)
expect(response.status).toBe(200)
const data = await response.json()
expect(data).toMatchObject({ transaction: expect.any(String) })
```

## Coverage Targets

| Layer | Target | Rationale |
|-------|---------|-----------|
| Schemas | 100% | Critical validation layer |
| Server utilities | 95% | Transaction safety critical |
| API routes | 90% | Error handling essential |
| Hooks | 80% | State management complexity |
| Components | 70% | UI interactions |

## Mocking Strategy

### Essential Mocks

- **Solana RPC**: Mock connection and method responses
- **Wallet Adapter**: Mock connection, signing, and sending
- **Server Config**: Mock `getServerConfig()` for private RPC
- **Network Requests**: Use MSW for API route testing

### Mock Patterns Reference

See [references/mock-patterns.md](references/mock-patterns.md) for comprehensive mocking examples including:
- Solana RPC mocking
- Wallet adapter mocking
- API route mocking with MSW
- Form and query mocking patterns

## What NOT to Test

- shadcn/ui component internals (externally maintained)
- React Compiler optimizations (framework responsibility)
- Third-party library behavior (assume they work)
- Private implementation details (test public API only)

## Testing Resources

### Detailed Patterns
- **TDD Examples**: See [references/tdd-examples.md](references/tdd-examples.md) for complete TDD workflows
- **Mock Patterns**: See [references/mock-patterns.md](references/mock-patterns.md) for comprehensive mocking examples

## Implementation Checklist

- [ ] Schema tests cover all validation rules
- [ ] Server utility tests include error cases
- [ ] API route tests verify all status codes
- [ ] Hook tests cover loading/error states
- [ ] Component tests verify user interactions
- [ ] Coverage targets achieved
- [ ] Tests run fast and reliably
