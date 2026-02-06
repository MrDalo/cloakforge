# Testing Strategy Skill

This skill provides patterns and best practices for writing effective tests in CloakForge.

## When to Use

Use this skill when writing tests, designing test suites, or setting up testing infrastructure.

## TDD Workflow: Red-Green-Refactor

1. **Red** — Write a failing test that describes the expected behavior
2. **Green** — Write the minimum code to make the test pass
3. **Refactor** — Clean up the code while keeping tests green

## Test Structure: Arrange-Act-Assert

```typescript
describe('FeatureName', () => {
  it('should [expected behavior] when [condition]', () => {
    // Arrange — set up test data and dependencies
    const input = createTestInput();

    // Act — execute the code under test
    const result = featureUnderTest(input);

    // Assert — verify the expected outcome
    expect(result).toEqual(expectedOutput);
  });
});
```

## Test Pyramid

```
        /  E2E  \         ← Few: critical user journeys (wallet connect → tool → sign)
       / Integration \     ← Some: API route → server utility, hook → API
      /    Unit Tests   \  ← Many: schemas, utils, transaction builders
```

### Unit Tests (70%)
- Zod schemas in `src/lib/schemas/` — valid/invalid inputs
- Solana utils in `src/lib/solana/` — address validation, balance formatting
- Transaction builders in `src/lib/solana/server-side/` — instruction ordering
- Pure functions and transformations

### Integration Tests (20%)
- API routes — request validation, response format, error handling
- Hooks → API calls — mock wallet + RPC, verify flow
- Server utilities — transaction building with mock RPC

### E2E Tests (10%)
- Wallet connection → tool usage → transaction signing
- Critical user journeys end-to-end

## CloakForge-Specific Test Patterns

### Mocking Wallet Adapter
```typescript
const mockWallet = {
  publicKey: new PublicKey('...'),
  signTransaction: vi.fn().mockResolvedValue(mockSignedTx),
  connected: true,
};
```

### Mocking RPC Responses
```typescript
const mockConnection = {
  getBalance: vi.fn().mockResolvedValue(1_000_000_000), // 1 SOL
  getTokenAccountsByOwner: vi.fn().mockResolvedValue({ value: [] }),
};
```

### Testing Transaction Instruction Order
```typescript
// Service memo must be first, fee transfer second
expect(transaction.instructions[0].programId).toEqual(MEMO_PROGRAM_ID);
expect(transaction.instructions[1].programId).toEqual(SystemProgram.programId);
```

### Testing Error Handling
```typescript
it('should throw SolanaError when insufficient balance', async () => {
  mockConnection.getBalance.mockResolvedValue(0);
  await expect(useTool()).rejects.toThrow(SolanaError);
});
```

### Testing Zod Schemas
```typescript
describe('burnTokenSchema', () => {
  it('should accept valid input', () => {
    expect(() => burnTokenSchema.parse(validInput)).not.toThrow();
  });
  
  it('should reject invalid Solana address', () => {
    expect(() => burnTokenSchema.parse({ ...validInput, mint: 'not-an-address' })).toThrow();
  });
});
```

## Coverage Requirements

For each feature, ensure:
- [ ] Happy path — main success scenario (e.g., token created successfully)
- [ ] Input validation — invalid addresses, zero amounts, missing fields
- [ ] Error handling — RPC failures, insufficient balance, wallet disconnected
- [ ] Edge cases — max supply, zero decimals, empty token accounts
- [ ] Solana-specific — transaction simulation, signature verification

## Test Naming Convention
```
should [expected behavior] when [condition/state]
```
Examples:
- `should return formatted balance when wallet has SOL`
- `should throw SolanaError when RPC returns timeout`
- `should place service memo before fee transfer in transaction`

## Anti-Patterns to Avoid

- **Flaky tests** — mock all blockchain calls, never hit real RPC
- **Test coupling** — tests should run independently in any order
- **Testing implementation** — test behavior, not internal Solana instruction details
- **Slow tests** — minimize async, use mocked providers
- **Testing React Compiler internals** — compiler handles optimization, test behavior
