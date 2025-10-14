# 🔄 Error Handling Migration Guide

> **Step-by-step guide to migrate from old error system to new unified approach**

Last updated: 2025-01-14

## 📋 Quick Reference

### Before (Old System) ❌
```tsx
import { SolanaError, AppError, getUserErrorMessageFromError } from '@/types/error'
import { getAppErrorMessage } from '@/lib/utils/getAppErrorMessage'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'

// Multiple error classes
throw new SolanaError('Error message', SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS)
throw new AppError('INVALID_INPUT')

// Complex error message resolution
const message = getUserErrorMessageFromError(error, { tool: 'burn-tokens' })
```

### After (New System) ✅
```tsx
import { AppError, handleError } from '@/lib/errors'

// Single error class
throw new AppError('INSUFFICIENT_FUNDS')
throw new AppError('INVALID_INPUT')

// Simple error handling
const message = handleError(error, { tool: 'burn-tokens' })
```

---

## 🔍 Migration Steps

### Step 1: Update Imports

**Find all old imports:**
```bash
# Search for old error imports
grep -r "from '@/types/error'" src/
grep -r "from '@/lib/utils/getAppErrorMessage'" src/
grep -r "from '@/lib/utils/getSolanaErrorMessage'" src/
grep -r "from '@/lib/utils/getUserErrorMessageFromError'" src/
```

**Replace with:**
```tsx
// ✅ New unified import
import { AppError, handleError } from '@/lib/errors'
```

---

### Step 2: Replace Error Classes

#### Pattern 1: SolanaError → AppError
```tsx
// ❌ OLD
throw new SolanaError(
  'Insufficient funds for transaction',
  SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS
)

// ✅ NEW
throw new AppError('INSUFFICIENT_FUNDS')
```

#### Pattern 2: AppError with code → AppError
```tsx
// ❌ OLD
throw new AppError('INVALID_AMOUNT')

// ✅ NEW (same, just change import!)
throw new AppError('INVALID_AMOUNT')
```

#### Pattern 3: HTTPError → AppError
```tsx
// ❌ OLD
throw new HTTPError(400, 'Invalid request')

// ✅ NEW
throw new AppError('VALIDATION_ERROR')
```

---

### Step 3: Replace Error Handlers

#### Pattern 1: getUserErrorMessageFromError → handleError
```tsx
// ❌ OLD
catch (error) {
  const message = getUserErrorMessageFromError(error, { tool: 'my-tool' })
  toast.error(message)
}

// ✅ NEW
catch (error) {
  const message = handleError(error, { tool: 'my-tool' })
  toast.error(message)
}
```

#### Pattern 2: getAppErrorMessage → Use AppError directly
```tsx
// ❌ OLD
const message = getAppErrorMessage('INVALID_AMOUNT')

// ✅ NEW
import { ERROR_MESSAGES } from '@/lib/errors'
const message = ERROR_MESSAGES.INVALID_AMOUNT
```

#### Pattern 3: getSolanaErrorMessage → handleError
```tsx
// ❌ OLD
const message = getSolanaErrorMessage(error)

// ✅ NEW
const message = handleError(error) // Auto-detects Solana errors!
```

---

### Step 4: Update API Routes

#### Before:
```tsx
import { SolanaError, HTTPError } from '@/types/error'
import { getUserErrorMessageFromError } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    // ... validation
    if (!valid) {
      throw new HTTPError(400, 'Validation failed')
    }
    
    // ... operation
    if (solanaError) {
      throw new SolanaError('Transaction failed', 'TRANSACTION_FAILED')
    }
    
  } catch (error) {
    const message = getUserErrorMessageFromError(error)
    return NextResponse.json({
      status: 'error',
      error_message: message
    })
  }
}
```

#### After:
```tsx
import { AppError, handleError } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    // ... validation
    if (!valid) {
      throw new AppError('VALIDATION_ERROR')
    }
    
    // ... operation
    if (solanaError) {
      throw new AppError('TRANSACTION_FAILED')
    }
    
  } catch (error) {
    const message = handleError(error, { context: 'api' })
    return NextResponse.json({
      status: 'error',
      error_message: message
    })
  }
}
```

---

### Step 5: Update Hooks

#### Before:
```tsx
import { SolanaError } from '@/types/error'
import { getUserErrorMessageFromError } from '@/lib/utils'
import { SOLANA_ERROR_CODES } from '@/lib/utils/solanaErrorCodes'

export function useMyTool() {
  const execute = async (params) => {
    try {
      if (balance < required) {
        throw new SolanaError(
          'Insufficient balance',
          SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS
        )
      }
      // ... operation
    } catch (error) {
      const message = getUserErrorMessageFromError(error, { tool: 'my-tool' })
      toast.error(message)
      throw error
    }
  }
}
```

#### After:
```tsx
import { AppError, handleError } from '@/lib/errors'

export function useMyTool() {
  const execute = async (params) => {
    try {
      if (balance < required) {
        throw new AppError('INSUFFICIENT_FUNDS')
      }
      // ... operation
    } catch (error) {
      const message = handleError(error, { tool: 'my-tool' })
      toast.error(message)
      throw error
    }
  }
}
```

---

## 🎯 Common Patterns

### Error Code Mapping

| Old Code (from constants)          | New Code                      |
|------------------------------------|-------------------------------|
| `SOLANA_ERROR_CODES.WALLET_NOT_CONNECTED` | `'WALLET_NOT_CONNECTED'`      |
| `SOLANA_ERROR_CODES.INSUFFICIENT_FUNDS`   | `'INSUFFICIENT_FUNDS'`        |
| `SOLANA_ERROR_CODES.TRANSACTION_FAILED`   | `'TRANSACTION_FAILED'`        |
| `APP_ERROR_CODES.INVALID_INPUT`           | `'INVALID_INPUT'`             |
| `APP_ERROR_CODES.VALIDATION_ERROR`        | `'VALIDATION_ERROR'`          |

### Error Detection

The new `handleError()` function **automatically detects** Solana errors from error messages:

```tsx
// These will be auto-detected as Solana errors:
- "insufficient funds"
- "blockhash not found"
- "account already frozen"
- "invalid authority"
// ... and 15+ more patterns!

// No need to manually categorize!
```

---

## 🔄 Automated Migration

### Find and Replace Script

```bash
#!/bin/bash
# Save as: migrate-errors.sh

echo "🔍 Finding old error imports..."

# Find files with old imports
FILES=$(grep -rl "from '@/types/error'" src/)

for file in $FILES; do
  echo "📝 Updating: $file"
  
  # Replace SolanaError with AppError
  sed -i '' 's/new SolanaError(/new AppError(/g' "$file"
  
  # Replace error imports
  sed -i '' "s/from '@\/types\/error'/from '@\/lib\/errors'/g" "$file"
  
  # Replace error handlers
  sed -i '' 's/getUserErrorMessageFromError/handleError/g' "$file"
done

echo "✅ Migration complete! Run 'npm run lint' to check for issues."
```

**Usage:**
```bash
chmod +x migrate-errors.sh
./migrate-errors.sh
```

---

## ✅ Verification Checklist

After migration:

- [ ] Run `npm run lint:nowarn` - should pass with zero warnings
- [ ] Run `npm run type-check` - should pass with zero TypeScript errors
- [ ] Search for old imports: `grep -r "from '@/types/error'" src/` - should be empty
- [ ] Search for old handlers: `grep -r "getUserErrorMessageFromError" src/` - should be empty
- [ ] Test on devnet - all tools should work correctly
- [ ] Test error scenarios - error messages should be user-friendly
- [ ] Check console logs - no error handling warnings

---

## 📊 Expected Impact

### Files Affected
- **Hooks**: ~15 files (`src/hooks/solana/`)
- **API Routes**: ~10 files (`src/app/api/solana/`)
- **Components**: ~5 files (error boundaries, forms)
- **Utilities**: ~3 files (validation helpers)

### Code Reduction
- **Before**: 860 lines across 10+ error files
- **After**: 313 lines in 3 clean files
- **Reduction**: 63% less code to maintain! 🎉

### Benefits
- ✅ **Simpler**: One import, one error class, one handler
- ✅ **Smarter**: Automatic Solana error detection
- ✅ **Cleaner**: No scattered error utilities
- ✅ **Maintainable**: Central error code registry
- ✅ **Type-safe**: Full TypeScript support

---

## 🐛 Troubleshooting

### Issue: Import errors after migration
**Solution**: Ensure you've removed all old imports:
```bash
grep -r "from '@/types/error'" src/
grep -r "from '@/lib/utils/get.*ErrorMessage'" src/
```

### Issue: Missing error codes
**Solution**: Check `src/lib/errors/AppError.ts` for available codes. Add new ones if needed:
```tsx
export const ERROR_MESSAGES = {
  // Add your custom code here
  MY_CUSTOM_ERROR: 'User-friendly message here',
}
```

### Issue: Error messages not user-friendly
**Solution**: The new system has built-in user-friendly messages. If you need custom messages:
```tsx
throw new AppError('GENERIC_ERROR', 'Your custom message here')
```

---

## 📚 Related Documentation

- [Error Handling System](./TROUBLESHOOTING.md#error-handling-system) - Complete error handling docs
- [Phase 2 Complete](./PHASE_2_COMPLETE.md) - Full migration summary
- [Architecture Guide](./ARCHITECTURE.md) - System design principles

---

**Questions?** Check the [Phase 2 Complete](./PHASE_2_COMPLETE.md) doc or review the reference implementation in `src/lib/errors/`.

**Built with ❤️ following KISS, DRY, and Clear Purpose principles**
