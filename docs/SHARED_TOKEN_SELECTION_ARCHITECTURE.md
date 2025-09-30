# Shared Token Selection Component Architecture

## Overview

The shared token selection component architecture provides reusable, maintainable components for token selection across all CloakForge tools. This eliminates code duplication and provides consistent user experience.

## Architecture

### Core Components

- **TokenSelectionForm**: Main orchestrating component that combines all sub-components
- **TokenSelectionModeToggle**: Toggle between wallet and manual token selection modes
- **WalletTokensList**: Lists tokens from connected wallet with tool-specific filtering
- **ManualTokenEntry**: Manual token address input with validation

### Component Location

```
src/components/common/TokenSelection/
├── index.ts                     # Barrel exports
├── types.ts                     # Shared TypeScript interfaces
├── TokenSelectionForm.tsx       # Main orchestrating component
├── TokenSelectionModeToggle.tsx # Mode toggle component
├── WalletTokensList.tsx         # Wallet token listing
└── ManualTokenEntry.tsx         # Manual token entry
```

## Usage

### Basic Implementation

```tsx
import { TokenSelectionForm } from '@/components/common/TokenSelection'
import { validateBurnToken } from './validateBurnToken'

const MyToolForm = ({ form }) => {
  const [selectedTokenData, setSelectedTokenData] = useState()

  return (
    <TokenSelectionForm
      control={form.control}
      selectedTokenData={selectedTokenData}
      onSelectedTokenDataChange={setSelectedTokenData}
      onTokenSelect={(address) => form.setValue('tokenAddress', address)}
      config={{
        hookName: 'useWalletTokensForBurnTool',
        context: 'my-tool',
        emptyStateMessage: 'No tokens found for this tool',
        selectLabel: 'Select Token *',
        placeholder: 'Choose a token',
        validateToken: validateBurnToken,
        helpText: 'Enter token address for your specific use case.',
      }}
    />
  )
}
```

### Tool-Specific Configuration

Each tool needs to provide:

1. **Hook Name**: Either `'useWalletTokensForBurnTool'` or `'useWalletTokensForRevokeMintAuthority'`
2. **Context**: Tool identifier for logging
3. **Validation Function**: Tool-specific token validation logic
4. **UI Configuration**: Labels, messages, and help text

### Token Validation Function

Create a validation function that matches the `TokenValidationFunction` type:

```tsx
import { TokenValidationFunction } from '@/components/common/TokenSelection'

export const validateMyToolToken: TokenValidationFunction = async (
  tokenAddress: PublicKey,
  connection: Connection,
  walletAddress?: PublicKey
): Promise<TokenValidationResult> => {
  try {
    // Tool-specific validation logic
    const tokenData = await getTokenData(tokenAddress, connection, walletAddress)

    return {
      isValid: true,
      tokenData: {
        // Map to TokenWithAuthorities format
        tokenAddress: tokenData.tokenAddress,
        mint: tokenData.mint,
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        balance: tokenData.balance,
        image: tokenData.image,
        programId: tokenData.programId,
        source: 'mint-only',
        // Add tool-specific properties
        mintAuthority: tokenData.mintAuthority,
        hasMintAuthority: tokenData.hasMintAuthority,
      },
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Token validation failed: ' + error.message,
    }
  }
}
```

## Tool Integration Examples

### Burn Tokens Tool

```tsx
// FormSections.tsx
<TokenSelectionForm
  config={{
    hookName: 'useWalletTokensForBurnTool',
    context: 'burn-tokens',
    emptyStateMessage: 'No tokens found in your wallet',
    selectLabel: 'Select Token *',
    placeholder: 'Choose a token to burn',
    validateToken: (tokenAddress, connection) => validateBurnToken(tokenAddress, connection, walletAddress || undefined),
    helpText: 'Enter the mint address of the token you want to burn. This action is irreversible.',
  }}
  // ... other props
/>
```

### Revoke Mint Authority Tool

```tsx
// FormSections.tsx
<TokenSelectionForm
  config={{
    hookName: 'useWalletTokensForRevokeMintAuthority',
    context: 'revoke-mint-authority',
    emptyStateMessage: 'No tokens with mint authority found in your wallet',
    selectLabel: 'Select Token *',
    placeholder: 'Choose a token to revoke mint authority',
    validateToken: (tokenAddress, connection) => validateRevokeMintAuthorityToken(tokenAddress, connection, walletAddress || undefined),
    helpText: 'Enter the mint address of a token where you are the mint authority. This action is irreversible.',
  }}
  // ... other props
/>
```

## Type Definitions

### Key Interfaces

```tsx
// Base form data that all tools must extend
interface BaseTokenFormData extends FieldValues {
  tokenAddress: string
}

// Main component props
interface TokenSelectionFormProps {
  control: Control<any>
  onTokenSelect: (tokenAddress: string) => void
  selectedTokenData?: TokenWithAuthorities
  onSelectedTokenDataChange: (tokenData?: TokenWithAuthorities) => void
  config: TokenSelectionConfig
  defaultMode?: TokenSelectionMode
}

// Tool configuration
interface TokenSelectionConfig {
  hookName: 'useWalletTokensForBurnTool' | 'useWalletTokensForRevokeMintAuthority'
  context: string
  tokenFilter?: (token: TokenWithAuthorities) => boolean
  emptyStateMessage?: string
  selectLabel?: string
  placeholder?: string
  validateToken: TokenValidationFunction
  helpText?: string
}
```

## Migration Guide

### For Existing Tools

1. **Import shared components**:

   ```tsx
   import { TokenSelectionForm } from '@/components/common/TokenSelection'
   ```

2. **Create validation function** following the pattern in `validateBurnToken.ts`

3. **Replace existing TokenSelectionForm** with shared version

4. **Configure tool-specific settings** in the config object

5. **Remove old duplicated files**:
   - `TokenSelectionForm.tsx`
   - `ManualTokenEntry.tsx`
   - `WalletTokensList.tsx`
   - `TokenSelectionModeToggle.tsx`

6. **Update exports** in `index.ts` to remove references to deleted components

### For New Tools

1. Import the shared `TokenSelectionForm`
2. Create your tool-specific validation function
3. Configure the component with your tool's requirements
4. No need to create duplicate token selection components

## Benefits

### Code Reuse

- Single source of truth for token selection logic
- Consistent behavior across all tools
- Easier maintenance and bug fixes

### Type Safety

- Shared TypeScript interfaces ensure consistency
- Generic types support tool-specific form data
- Validation functions have strict type contracts

### User Experience

- Consistent UI/UX across all tools
- Unified error handling and user feedback
- Standardized loading states and validation

### Developer Experience

- Easy integration for new tools
- Well-documented interfaces and examples
- Comprehensive TypeScript support

## Future Enhancements

### Planned Features

- Support for additional token programs (Token Extensions)
- Batch token selection for multi-token operations
- Advanced filtering and sorting options
- Cached token metadata for performance

### Extension Points

- Custom token filters per tool
- Tool-specific UI customizations
- Additional validation modes
- Enhanced error handling strategies

## Troubleshooting

### Common Issues

1. **TypeScript errors with form control**:
   - Ensure your form extends `BaseTokenFormData`
   - Use proper typing for the control prop

2. **Validation function errors**:
   - Check that the function signature matches `TokenValidationFunction`
   - Handle all error cases and return proper `TokenValidationResult`

3. **Hook name mismatches**:
   - Use correct hook name for your tool type
   - Ensure the hook exists and is properly imported

### Debug Logging

All components use structured logging with the provided context:

```tsx
const logger = getLogger({
  context: 'your-tool-name',
  component: 'TokenSelectionForm',
})
```

## Testing

### Unit Tests

- Each component should have comprehensive unit tests
- Mock the validation functions for isolated testing
- Test both success and error scenarios

### Integration Tests

- Test with real wallet connections
- Verify tool-specific filtering works correctly
- Ensure proper form data updates

### End-to-End Tests

- Test complete user workflows
- Verify token selection, validation, and form submission
- Test across different wallet types and network conditions

## Maintenance

### Code Quality

- All components follow CloakForge code standards
- Zero ESLint warnings policy maintained
- Comprehensive TypeScript coverage

### Documentation

- Keep this document updated with any changes
- Document new validation patterns
- Provide examples for new tool integrations

### Performance

- Monitor component render performance
- Optimize API calls and caching strategies
- Profile user interactions and loading times
