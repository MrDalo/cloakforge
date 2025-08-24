# Unified Tool Architecture Documentation

## Overview

The Crypto Forge application now implements a unified tool architecture that standardizes form validation, data processing, business logic execution, error handling, and fee calculation across all tools. This architecture provides consistency, reusability, and maintainability for all tool implementations.

## Architecture Components

### 1. Base Hook (`useToolBase`)

The foundation of all tool hooks that provides:

#### Core Features

- **Wallet Connection Validation**: Automatic validation of wallet connection status
- **Error Handling**: Centralized error handling with toast notifications and logging
- **Execution State Management**: Loading states, result caching, and execution control
- **Validation Framework**: Unified requirement validation
- **Logging Integration**: Structured logging for all operations

#### Interface

```typescript
interface UseToolBaseReturn<TData, TResult> {
  isExecuting: boolean
  lastResult: TResult | null
  execute: (data: TData) => Promise<TResult | null>
  validateRequirements: () => ToolValidationResult
  reset: () => void
  isWalletReady: boolean
  validationErrors: string[]
}
```

#### Usage Pattern

```typescript
const baseHook = useToolBase<FormData, Result>(config, businessLogicFunction)
```

### 2. Fee Calculation Hook (`useFeeCalculation`)

Handles all fee-related calculations with Contentful integration:

#### Features

- **Contentful Integration**: Fetches fees from Contentful CMS
- **Fee Breakdown**: Detailed breakdown of all fee components
- **Dynamic Calculation**: Real-time fee calculation based on tool configuration
- **Error Handling**: Graceful handling of fee loading failures

#### Interface

```typescript
interface FeeCalculationResult {
  totalFeeLamports: number
  baseFee: number
  networkFee: number
  priorityFee: number
  additionalFees: Record<string, number>
  breakdown: Array<{ name: string; amount: number; description?: string }>
  isLoading: boolean
  error: string | null
}
```

### 3. Unified Token Creator (`useTokenCreatorUnified`)

Reference implementation demonstrating the unified architecture:

#### Integration Points

- Uses `useToolBase` for core functionality
- Integrates `useFeeCalculation` for fee handling
- Combines with existing `tokenCreatorKit` business logic
- Provides backward-compatible API

## Implementation Guide

### Step 1: Tool Configuration

Define your tool's configuration:

```typescript
const toolConfig: ToolExecutionConfig = {
  toolId: 'your-tool-id',
  toolName: 'Your Tool Name',
  requiresWallet: true, // Set to false if wallet not required
  requiresBalance: false, // Optional balance requirement
  minBalance: 0, // Minimum balance in lamports
}
```

Note: This `ToolExecutionConfig` is for tool execution configuration (wallet requirements, validation), different from:

- `ToolUIConfig` which defines UI display properties (title, icon, variant)
- Contentful `ToolConfiguration` which defines business logic (isEnabled, fees)

### Step 2: Fee Configuration

Configure fee calculation:

```typescript
const feeConfig: FeeCalculationConfig = {
  toolId: 'your-tool-id',
  baseFeeLamports: 0.001 * 1_000_000_000, // Base fee in lamports
  additionalFees: {
    'feature-name': 0.0005 * 1_000_000_000, // Additional fees
  },
}
```

### Step 3: Business Logic Function

Implement your tool's core business logic:

```typescript
const executeBusinessLogic = useCallback(
  async (context: ToolExecutionContext, data: FormData): Promise<Result> => {
    // Your business logic here
    // Access wallet via context.walletAddress, context.publicKey, context.signTransaction
    // Process form data
    // Return result
  },
  [dependencies]
)
```

### Step 4: Create Tool Hook

Combine everything into a unified hook:

```typescript
export function useYourTool(config: Partial<YourToolConfig> = {}) {
  const logger = getLogger({ ... })

  const toolConfig = { ...defaultConfig, ...config }
  const feeCalculation = useFeeCalculation(feeConfig)
  const baseHook = useToolBase(toolConfig, executeBusinessLogic)

  return {
    ...baseHook,
    feeCalculation,
    // Any tool-specific methods
  }
}
```

## Form Validation Strategy

### Zod Schema Integration

All forms use Zod schemas for validation:

```typescript
export const YourToolFormSchema = z.object({
  field1: z.string().min(1, 'Required'),
  field2: z.number().positive('Must be positive'),
  // ... other fields
})

export type YourToolFormData = z.infer<typeof YourToolFormSchema>
```

### React Hook Form Integration

Forms integrate Zod with React Hook Form:

```typescript
const form = useForm<YourToolFormData>({
  resolver: zodResolver(YourToolFormSchema),
  defaultValues: { ... },
})
```

### Three-Layer Validation

1. **Form Validation**: Zod schema validates form inputs
2. **Requirements Validation**: Base hook validates wallet/system requirements
3. **Business Logic Validation**: Runtime validation within business logic

## Error Handling Strategy

### Centralized Error Management

All errors flow through the base hook:

1. **Validation Errors**: Shown immediately with toast notifications
2. **Execution Errors**: Logged and displayed with context
3. **Network Errors**: Handled gracefully with retry suggestions
4. **User Errors**: Clear, actionable error messages

### Toast Notifications

Consistent toast messaging:

- **Loading**: "Executing [Tool Name]..."
- **Success**: "[Tool Name] completed successfully! Completed in Xs"
- **Error**: "[Tool Name] failed: [Error Message]"
- **Warning**: "[Tool Name] already in progress"

### Logging Integration

Structured logging at all levels:

- **Info**: Successful operations and milestones
- **Warn**: Non-fatal issues and validation failures
- **Error**: Failures with full error context and stack traces
- **Debug**: Development and troubleshooting information

## Fee Handling Workflow

### Fee Calculation Process

1. **Contentful Fetch**: Load fee configuration from Contentful CMS
2. **Base Fee**: Apply tool-specific base fee
3. **Network Fee**: Add Solana network transaction fee
4. **Priority Fee**: Include priority fee if configured
5. **Additional Fees**: Add feature-specific fees
6. **Breakdown**: Generate detailed fee breakdown for UI display

### Fee Charging Implementation

```typescript
// In business logic function
const chargeableFees = {
  totalFee: feeCalculation.totalFeeLamports,
  breakdown: feeCalculation.breakdown,
}

// Add fee charging to your transaction logic
// (Implementation depends on your payment system)
```

## Tool-Specific Customization

### Extending Base Configuration

```typescript
interface YourToolConfig extends ToolConfig {
  customOption1: boolean
  customOption2: string
  enableFeatureX: boolean
}
```

### Adding Custom Methods

```typescript
export function useYourTool() {
  const baseHook = useToolBase(...)

  const customMethod = useCallback(() => {
    // Custom tool-specific logic
  }, [])

  return {
    ...baseHook,
    customMethod,
  }
}
```

### Custom Validation

```typescript
const customValidateRequirements = useCallback(() => {
  const baseValidation = baseHook.validateRequirements()

  // Add custom validation
  const customErrors = []
  if (customCondition) {
    customErrors.push('Custom error message')
  }

  return {
    isValid: baseValidation.isValid && customErrors.length === 0,
    errors: [...baseValidation.errors, ...customErrors],
  }
}, [baseHook])
```

## Migration Guide

### Existing Tool Migration

To migrate existing tools to the unified architecture:

1. **Extract Business Logic**: Move core functionality to separate function
2. **Update Hook**: Replace custom hook with unified pattern
3. **Update Components**: Use new hook interface
4. **Test Integration**: Verify all functionality works
5. **Update Documentation**: Document any tool-specific features

### Backward Compatibility

The unified architecture maintains backward compatibility:

- Existing hook interfaces are preserved
- Form schemas remain unchanged
- Component APIs stay consistent
- Migration can be done incrementally

## Best Practices

### Hook Development

- Keep business logic functions pure and testable
- Use proper TypeScript types for all data
- Implement proper error boundaries
- Add comprehensive logging

### Form Integration

- Always use Zod for form validation
- Provide clear error messages
- Implement loading states
- Show fee breakdowns to users

### Error Handling

- Provide actionable error messages
- Log errors with sufficient context
- Handle edge cases gracefully
- Implement retry mechanisms where appropriate

### Testing Strategy

- Unit test business logic functions
- Integration test hook behavior
- Test error conditions
- Validate fee calculations

## Examples

### Token Creator Implementation

See `useTokenCreatorUnified.ts` for a complete reference implementation that demonstrates:

- Base hook integration
- Fee calculation usage
- Business logic integration
- Error handling
- Logging implementation

### Future Tool Implementation

Use this pattern for all new tools:

```typescript
export function useNewTool() {
  const feeCalculation = useFeeCalculation(feeConfig)
  const baseHook = useToolBase(toolConfig, businessLogic)

  return {
    ...baseHook,
    feeCalculation,
  }
}
```

## Conclusion

The unified tool architecture provides a consistent, maintainable, and scalable foundation for all Crypto Forge tools. It eliminates code duplication, ensures consistent user experience, and simplifies the development of new tools while maintaining the flexibility to customize tool-specific behavior.

All future tools should follow this architecture, and existing tools should be migrated incrementally to take advantage of the unified approach.
