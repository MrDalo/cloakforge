# 🎯 CloakForge Prompt Structure Template

> **Optimal prompt structure for maximum AI assistant effectiveness**

This template helps you provide comprehensive context for any task, ensuring fast, accurate, and aligned solutions that follow CloakForge's principles and patterns.

---

## 📋 Why This Template?

**Based on successful collaboration patterns:**

- Provides complete context upfront (reduces back-and-forth)
- Aligns with CloakForge's documentation-first approach
- Ensures solutions follow established patterns
- Makes it easy to reference existing code
- Helps AI understand constraints and preferences

**Not all sections required** - Use what's relevant for your task!

---

## 🔥 Quick Template (Copy & Use)

```markdown
## 🎯 Task Overview

[One-sentence description of what you want to achieve]

## 📌 Current State (Issue/Problem)

**What's happening now:**

- [Current behavior/state]
- [Problems/limitations]
- [Affected files/components]

**Error messages (if any):**
```

[Paste exact error messages, stack traces, or console output]

```

**Environment:**
- [ ] Development
- [ ] Production
- [ ] Both

## ✅ Desired Final State
**What success looks like:**
- [Expected behavior after fix/implementation]
- [Success criteria - how do we know it works?]
- [User-facing impact]

**Acceptance criteria:**
1. [Criteria 1]
2. [Criteria 2]
3. [Criteria 3]

## 🛠️ Technical Context

### Affected Areas
- **Files**: [List specific files if known, or "unknown"]
- **Components**: [Which components are involved]
- **Layers**: (Check all that apply)
  - [ ] UI/Page Component
  - [ ] Form Component
  - [ ] Hook
  - [ ] API Route
  - [ ] Server Utility
  - [ ] Types/Schemas
  - [ ] Error Handling
  - [ ] Logging

### Related Patterns
- **Similar implementations**: [e.g., "Token Creator uses similar pattern", "Check BurnTokens for reference"]
- **Relevant docs**: [Which of the 4 core docs apply: ARCHITECTURE, DEVELOPMENT, TOOLING, TROUBLESHOOTING]
- **Existing components/utilities**: [Any from `components/common/` or `lib/` to reuse]

### Technology Stack
**Technologies involved:**
- [ ] React/Next.js
- [ ] TypeScript
- [ ] React Query (TanStack Query)
- [ ] Zustand
- [ ] Solana Web3.js
- [ ] React Hook Form + Zod
- [ ] Other: [specify]

**Preferred approach:** [If you have a preference or constraint]

**Constraints:**
- [Any limitations, requirements, or things to avoid]

## 📝 Implementation Guidance

### Preferred Approach
- [ ] Follow existing pattern from: [feature/file name]
- [ ] Use existing components from `components/common/` (list which ones)
- [ ] Use existing utilities from `lib/` (list which ones)
- [ ] Extend existing code (which files?)
- [ ] New implementation (explain why existing patterns don't apply)

### Step-by-Step (Optional)
If you have a specific implementation approach in mind:
1. [Step 1 - e.g., "Create Zod schema for form validation"]
2. [Step 2 - e.g., "Add API route following TOOLING.md pattern"]
3. [Step 3 - e.g., "Create hook using useToolBase"]
4. [Continue as needed...]

Or just: "Follow standard tool implementation pattern from TOOLING.md"

### Code Changes
**Direct changes needed:**
- [ ] Please make direct code changes (use replace_string_in_file)
- [ ] Show me the code, I'll implement
- [ ] Provide guidance/approach only

## 🎨 Additional Context

### User Story (Optional but helpful)
As a [user type - e.g., "token creator", "developer", "admin"],
I want to [action - e.g., "burn multiple tokens at once"],
So that [benefit - e.g., "I can manage token supply efficiently"].

### Edge Cases to Consider
- [Edge case 1 - e.g., "What if wallet has 0 SOL?"]
- [Edge case 2 - e.g., "What if token account doesn't exist?"]
- [Edge case 3]

### Performance Requirements
- [e.g., "Must handle 500 recipients in batch operation"]
- [e.g., "Should load in < 2 seconds"]

### Security Considerations
- [e.g., "Must validate ownership before operation"]
- [e.g., "Never expose private keys"]

### UX Requirements
- [e.g., "Show loading spinner during transaction"]
- [e.g., "Display clear error messages"]
- [e.g., "Mobile-responsive"]

## 🚫 Non-Negotiables

These are ALWAYS required (check all):
- [ ] ZERO ESLint warnings (`npm run lint:nowarn`)
- [ ] TypeScript strict mode compliance
- [ ] Follow existing code patterns (DRY - reuse utilities/components)
- [ ] Update existing documentation (NEVER create new .md files)
- [ ] Follow CloakForge's 5 core principles:
  - KISS (Keep it simple)
  - DRY (Don't repeat yourself)
  - Clear Purpose (single responsibility)
  - Developer-First (readable, maintainable)
  - Maintainability (easy to change/test)

### Testing Requirements
- [ ] Test on devnet first (for Solana operations)
- [ ] Verify build passes (`npm run build`)
- [ ] Test different wallet types
- [ ] Test error scenarios
- [ ] Test edge cases listed above

## 📎 References

### Related Code
- **Similar implementations**: [File paths or feature names]
- **Components to reuse**: [From `components/common/`]
- **Utilities to reuse**: [From `lib/`]

### Documentation
- **Relevant sections**: [Which parts of ARCHITECTURE, DEVELOPMENT, TOOLING, or TROUBLESHOOTING apply]
- **Patterns to follow**: [Reference specific documented patterns]

### External Resources (if applicable)
- **Design/Mockups**: [Figma links, screenshots]
- **Related Issues/PRs**: [GitHub links]
- **Solana Docs**: [Specific Solana documentation links]
- **Third-party APIs**: [Any external services involved]

## 💡 Additional Notes
[Any other context, concerns, or questions you have]
```

---

## 📚 Example Prompts

### Example 1: Bug Fix

```markdown
## 🎯 Task Overview

Fix double logging issue in error handling system

## 📌 Current State (Issue/Problem)

**What's happening now:**

- Every error is logged twice: once in catch block, once inside handleError()
- Causes log noise and performance overhead
- Breaks separation of concerns

**Error messages:**
No error messages, but logs show:
```

[ERROR] Token creation failed ... (from catch block)
[ERROR] Token creation failed ... (from handleError function)

```

## ✅ Desired Final State
**What success looks like:**
- Each error logged exactly once with full context
- handleError() is a pure function (no side effects)
- Consistent pattern across all files

## 🛠️ Technical Context

### Affected Areas
- **Files**: `src/lib/errors/errorHandler.ts` and all files using handleError
- **Layers**: Error Handling, Logging

### Related Patterns
- **Relevant docs**: TROUBLESHOOTING.md (error handling section)

### Preferred Approach
Make handleError() pure - remove all logging, log only in catch blocks

## 📝 Implementation Guidance

### Step-by-Step
1. Remove getLogger import from errorHandler.ts
2. Remove all logger calls from handleError()
3. Update all call sites to remove context parameter
4. Update documentation

### Code Changes
- [x] Please make direct code changes

## 🚫 Non-Negotiables
- [x] Zero ESLint warnings
- [x] Update TROUBLESHOOTING.md with new pattern
- [x] Verify build passes
```

---

### Example 2: New Feature

```markdown
## 🎯 Task Overview

Implement batch token freezing functionality

## 📌 Current State

**What's happening now:**

- We can only freeze one token account at a time
- Users need to freeze multiple accounts for security

## ✅ Desired Final State

**What success looks like:**

- Users can freeze up to 100 accounts in one transaction
- CSV import support for bulk operations
- Clear progress feedback
- Works with both Token Program and Token Extensions

**Acceptance criteria:**

1. Form accepts multiple addresses (textarea or CSV)
2. Validates all addresses before submission
3. Shows progress during batch operation
4. Displays success/failure for each account

## 🛠️ Technical Context

### Affected Areas

- **Files**: New page in `src/app/tools/freeze-accounts/`, new hook, new API route
- **Layers**: All layers (UI, Hook, API, Server Utility)

### Related Patterns

- **Similar implementations**: Follow Token Creator and Burn Tokens patterns
- **Relevant docs**: TOOLING.md (tool implementation guide)
- **Existing components**: Use FileUpload, FeeBreakdown, InfoTooltip from `components/common/`

### Technology Stack

- [x] React/Next.js
- [x] React Hook Form + Zod
- [x] React Query
- [x] Solana Web3.js

## 📝 Implementation Guidance

### Preferred Approach

- [x] Follow existing pattern from Token Creator
- [x] Use existing components from `components/common/`
- [x] Use existing utilities from `lib/solana/`
- [ ] Extend existing code
- [ ] New implementation

### Step-by-Step

Follow standard tool implementation pattern from TOOLING.md:

1. Create form schema with Zod
2. Create page component following established structure
3. Create hook using useToolBase
4. Create API route
5. Create server utility

### Code Changes

- [x] Please make direct code changes

## 🎨 Additional Context

### User Story

As a token creator,
I want to freeze multiple token accounts at once,
So that I can quickly respond to security threats.

### Edge Cases

- What if some accounts are already frozen?
- What if user doesn't have freeze authority?
- What if transaction size exceeds limit?

### Performance Requirements

- Must handle up to 100 accounts
- Use versioned transactions for optimization

### UX Requirements

- Show validation errors clearly
- Display progress during batch operation
- Mobile-responsive design

## 🚫 Non-Negotiables

- [x] Zero ESLint warnings
- [x] TypeScript strict mode
- [x] Update TOOLING.md with any new patterns
- [x] Test on devnet first
- [x] Follow all 5 core principles

## 📎 References

### Related Code

- **Similar implementations**:
  - `src/hooks/solana/useTokenCreator.ts`
  - `src/hooks/solana/useBurnTokens.ts`
- **Components to reuse**: FeeBreakdown, InfoTooltip, FileUpload
- **Utilities to reuse**: validateBalance, createServiceMemoInstruction

### Documentation

- **TOOLING.md**: Tool implementation pattern
- **ARCHITECTURE.md**: Hybrid architecture pattern
```

---

### Example 3: Quick Fix

```markdown
## 🎯 Task Overview

Remove unused ERROR_MESSAGES import causing ESLint warning

## 📌 Current State

**Error message:**
```

./src/app/api/solana/token-creator/route.ts
7:20 Warning: 'ERROR_MESSAGES' is defined but never used. @typescript-eslint/no-unused-vars

```

## ✅ Desired Final State
- No ESLint warnings
- Clean import statement

## 🛠️ Technical Context
- **Files**: `src/app/api/solana/token-creator/route.ts`
- **Layers**: API Route

## 📝 Implementation Guidance
Remove ERROR_MESSAGES from import on line 7

### Code Changes
- [x] Please make direct code changes

## 🚫 Non-Negotiables
- [x] Zero ESLint warnings
```

---

## 🎯 Best Practices

### ✅ DO

1. **Be Specific**
   - "Fix error in useBurnTokens hook line 47" > "Fix error in burn feature"
   - Include file paths, line numbers, exact error messages

2. **Reference Existing Code**
   - "Follow pattern from useTokenCreator" > "Make it work somehow"
   - Point to similar implementations

3. **Provide Error Messages**
   - Always paste exact error messages/stack traces
   - Include console output if relevant

4. **State Your Preferences**
   - "Use existing FeeBreakdown component" > Letting AI guess
   - "Follow TOOLING.md pattern" > Reinventing the wheel

5. **Include Success Criteria**
   - Clear acceptance criteria help ensure complete solutions
   - Easier to verify the fix worked

### ❌ DON'T

1. **Be Vague**
   - ❌ "Fix the error"
   - ✅ "Fix TypeError on line 47 in useBurnTokens.ts"

2. **Skip Context**
   - ❌ Just paste error message
   - ✅ Error message + what you were trying to do + expected behavior

3. **Request Anti-Patterns**
   - ❌ "Create new documentation file for this feature"
   - ✅ "Update TOOLING.md with this pattern"

4. **Forget Testing Requirements**
   - ❌ "Make it work"
   - ✅ "Make it work and test on devnet with different wallets"

5. **Ignore Existing Code**
   - ❌ "Build a new error handling system"
   - ✅ "Use existing AppError system from lib/errors"

---

## 🚀 Quick Reference Checklist

Before submitting your prompt, verify:

- [ ] **Clear objective**: What do you want to achieve?
- [ ] **Current state**: What's the problem or current behavior?
- [ ] **Desired state**: What should happen instead?
- [ ] **Technical context**: Which files/layers/technologies?
- [ ] **Existing patterns**: Referenced similar code or docs?
- [ ] **Constraints**: Mentioned any limitations or requirements?
- [ ] **Code preference**: Direct changes or guidance?
- [ ] **Testing**: Specified testing requirements?
- [ ] **Non-negotiables**: Acknowledged quality standards?

**The more context you provide, the better the solution!**

---

## 💡 Pro Tips

### For Complex Features

- Break into smaller tasks
- Reference TOOLING.md for full implementation pattern
- Point to reference implementations (Token Creator, Burn Tokens)

### For Bug Fixes

- Include exact error messages
- Describe what you were doing when error occurred
- Mention if error is consistent or intermittent

### For Refactoring

- Explain why refactoring is needed
- State which principle is being violated (KISS, DRY, etc.)
- Reference target state from documentation

### For Documentation Updates

- Specify which of the 4 core docs to update
- Provide content or outline
- Never ask to create new .md files

---

## 📖 Related Documentation

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System design and patterns
- [DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Development workflows
- [TOOLING.md](./docs/TOOLING.md) - Tool implementation guide
- [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - Error handling and debugging
- [Copilot Instructions](./.github/copilot-instructions.md) - AI assistant guidelines

---

**This template evolves with the project. Suggest improvements based on collaboration experience!** ✨

**Remember: More context = Better solutions = Less back-and-forth = Faster delivery** 🚀
