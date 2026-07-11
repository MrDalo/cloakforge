---
globs: '**/*.{ts,tsx,js,jsx}'
description: Systematic debugging patterns for efficient error resolution with minimal context loading
---

# Debugging Patterns

## Shell-First Debugging Strategy

### Pre-LLM Investigation
```bash
# 1. Basic health check (zero token cost):
npm run lint:nowarn && npx tsc --noEmit

# 2. Test failure analysis:
npm test 2>&1 | grep -A5 "FAIL" | head -20

# 3. Build failure check:
npm run build 2>&1 | grep "error" | head -10

# 4. Git state assessment:
git status --porcelain && git branch --show-current

# 5. Recent changes context:
git log --oneline -5
```

### Error Classification
- **Lint errors** → Auto-fix with `--fix` flag first
- **Type errors** → Analyze TypeScript output before LLM
- **Test failures** → Check test output and logs
- **Runtime errors** → Check browser console and server logs
- **Build errors** → Check dependency and import issues

## Systematic Error Resolution

### Pattern 1: Test Failures
```bash
# Step 1: Isolate failing tests
npm test -- --verbose --no-coverage 2>&1 | grep -B2 -A5 "FAIL"

# Step 2: Run specific test file
npm test -- src/components/SomeComponent.test.tsx --verbose

# Step 3: Check mock setup
grep -r "vi.mock\|jest.mock" src/ | head -10

# Step 4: Validate test environment
npm test -- --setupFilesAfterEnv | head -5
```

**Agent Brief (if shell debugging insufficient):**
```markdown
## Task Brief: Fix test failure in {specific-test-file}

**Agent**: tester
**Context**: 1 failing test file only
**Shell output**: {paste specific error message}

### FILES
- **Fix**: {specific-test-file}
- **Pattern**: {working-test-file} (if similar pattern exists)

### CONSTRAINTS
- Do NOT read entire test suite
- Do NOT explore src/components/ beyond failing component
- Do NOT modify production code (test-only fix)

### SUCCESS
- Specific test passes
- No other tests broken
- Shell validation: `npm test -- {test-file}`
```

### Pattern 2: Type Errors
```bash
# Step 1: Get specific type errors
npx tsc --noEmit | head -20

# Step 2: Check import/export issues
grep -r "import.*{error-type}" src/ | head -5

# Step 3: Validate schema/type files
find src/types src/lib/schemas -name "*.ts" -exec grep -l "{error-pattern}" {} \;
```

**Agent Brief (for complex type issues):**
```markdown
## Task Brief: Resolve type error in {specific-file}

**Agent**: backend | frontend (based on file location)
**Context**: Error file + 1 type definition file maximum
**TypeScript output**: {paste specific error}

### FILES
- **Fix**: {file-with-type-error}
- **Reference**: {type-definition-file} (if needed)

### CONSTRAINTS
- Do NOT read multiple type files
- Do NOT modify other imports/exports
- Do NOT explore entire type system

### SUCCESS
- TypeScript validation passes: `npx tsc --noEmit`
- No new type errors introduced
```

### Pattern 3: Runtime/Build Errors
```bash
# Step 1: Check dependency issues
npm ls | grep -i "deduped\|missing" | head -10

# Step 2: Import resolution check
find src/ -name "*.ts" -exec grep -l "cannot resolve" {} \; 2>/dev/null | head -5

# Step 3: Build output analysis
npm run build 2>&1 | grep -E "error|Error" | head -15

# Step 4: Server console check (for runtime)
curl -I http://localhost:3001 2>/dev/null || echo "Server not running"
```

## Error Context Minimization

### High-Efficiency Debug Briefs

#### Single File Focus
```markdown
## Task Brief: Debug {specific-error} in {exact-file}

**Context**: 1 file maximum
**Error output**: {exact-shell-output}
**Last working state**: {git-commit-hash} (if known)

### APPROACH
1. Read only the failing file
2. Compare with working pattern (if exists)
3. Apply minimal fix
4. Validate with shell command

### CONSTRAINTS
- Do NOT explore related files
- Do NOT investigate "root cause" beyond immediate error
- Do NOT refactor surrounding code
```

#### Pattern-Based Fix
```markdown
## Task Brief: Apply working pattern to fix {error}

**Pattern source**: {working-file-path}
**Target file**: {failing-file-path}
**Specific issue**: {1-line-error-description}

### APPROACH
1. Read pattern file for correct implementation
2. Read target file to identify difference
3. Apply minimal change to match pattern
4. Validate fix works

### CONSTRAINTS
- Do NOT read additional files beyond pattern + target
- Do NOT modify logic beyond pattern alignment
```

## Debugging Agent Specialization

### Frontend Debug Patterns
```bash
# React/Next.js specific:
grep -r "useEffect\|useState" src/components/ | grep -v ".test." | head -10

# Hook debugging:
grep -r "use[A-Z]" src/hooks/ | head -10

# Component debugging:
find src/components/ -name "*.tsx" -exec grep -l "Error\|error" {} \; | head -5
```

### Backend Debug Patterns
```bash
# API route debugging:
find src/app/api/ -name "route.ts" -exec grep -l "error\|Error" {} \; | head -5

# Server utility debugging:
find src/lib/solana/server-side/ -name "*.ts" -exec grep -l "throw\|Error" {} \; | head -5

# Schema validation debugging:
grep -r "z\." src/lib/schemas/ | grep -v ".test." | head -10
```

### Solana Debug Patterns
```bash
# Transaction debugging:
grep -r "Transaction\|PublicKey" src/lib/solana/ | grep -v ".test." | head -10

# RPC debugging:
grep -r "connection\." src/ | grep -v ".test." | head -10

# Wallet debugging:
grep -r "wallet\|signTransaction" src/ | head-10
```

## Emergency Debug Protocols

### When Standard Debugging Fails

#### Context Reset Pattern
1. **Stop all debugging agents**
2. **Revert to last known working state**: `git checkout {last-working-commit}`
3. **Identify minimal reproduction**: Create simple test case
4. **Apply change incrementally**: One logical change at a time
5. **Validate each step**: Shell commands after each change

#### Systematic Isolation
```bash
# 1. Disable features to isolate:
# Comment out recent changes
# Revert to working version
# Apply changes one by one

# 2. Binary search approach:
git log --oneline -10
# Test each commit to find breaking change

# 3. Minimal reproduction:
# Create isolated test case
# Remove unrelated code
# Focus on core error only
```

## Debug Quality Gates

### Before Agent Dispatch
- [ ] Shell commands attempted
- [ ] Error message captured exactly
- [ ] Scope limited to 1-2 files maximum
- [ ] Recent changes identified (`git log --oneline -5`)

### Agent Debug Success Criteria
- [ ] Specific error resolved
- [ ] No new errors introduced
- [ ] Shell validation passes
- [ ] Minimal code change (< 10 lines if possible)

### Post-Debug Validation
```bash
# Full validation suite:
npm run lint:nowarn && npx tsc --noEmit && npm test

# Performance check (ensure no regression):
npm run build | grep "bundle size"

# Integration validation:
npm run dev # Manual check if needed
```

## Debug Cost Optimization

### High-ROI Debug Actions
- ✅ Shell command error analysis
- ✅ Single file focus
- ✅ Pattern-based fixes
- ✅ Minimal reproduction cases

### Low-ROI Debug Actions
- ❌ "Figure out what's wrong" exploration
- ❌ Reading entire modules for context
- ❌ Root cause analysis beyond immediate fix
- ❌ Refactoring while debugging

## Common Debug Agent Briefs

### Quick Pattern Fix
```markdown
**Agent**: {domain-agent}
**Files**: 1 broken + 1 pattern
**Task**: Copy working pattern to fix {specific-error}
**Time**: < 2 minutes
```

### Isolated Error Fix
```markdown
**Agent**: {domain-agent}
**Files**: 1 failing file only
**Task**: Fix {exact-error-message}
**Shell output**: {paste-error}
**Time**: < 3 minutes
```

### Test-Specific Debug
```markdown
**Agent**: tester
**Files**: 1 test file
**Task**: Make {specific-test-name} pass
**Error**: {test-failure-output}
**Time**: < 2 minutes
```