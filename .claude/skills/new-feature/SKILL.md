---
name: new-feature
description: 'Plan and implement a new feature end-to-end following CloakForge patterns'
disable-model-invocation: true
context: fork
---

# /new-feature — Plan and Implement a Feature

## Before Starting

Read these docs for context:

- @docs/ARCHITECTURE.md — system design
- @docs/TOOLING.md — tool patterns (if feature is a tool)
- @docs/DEVELOPMENT.md — coding conventions

## Process

### Step 1: Research

Scan `src/` for similar implementations. Understand how the codebase currently handles related functionality. Check `src/components/common/` for reusable components.

### Step 2: Clarify

If the feature request is ambiguous, ask:

- What's the user-facing behavior?
- Which pages/routes are affected?
- Does it involve Solana transactions?
- Are there new API routes needed?
- What state management is needed?
- What error scenarios exist?

### Step 3: Plan

Create a phased implementation plan:

```
Phase 1: Foundation
- Types and schemas
- Server utilities (if Solana ops)

Phase 2: API
- API routes
- Error handling

Phase 3: Client
- Hooks
- Components
- Page integration

Phase 4: Quality
- Tests (unit + component)
- Lint + type check
- Accessibility audit
```

For each file, specify:

- Full path
- What it does
- Dependencies
- Which agent should handle it (main conversation for implementation, tester for tests, reviewer for review)

### Step 4: Definition of Done

- [ ] All files created per plan
- [ ] Zero lint warnings (`npm run lint:nowarn`)
- [ ] Zero type errors (`npx tsc --noEmit`)
- [ ] Tests written and passing
- [ ] Accessibility verified (keyboard nav, screen reader)
- [ ] Follows existing patterns (DRY, no new common components if one exists)
- [ ] Docs updated if architecture changed

### Step 5: Implement

Execute the plan phase by phase. After each phase, verify with lint and type check.

### Step 6: Review

Use the reviewer subagent to review all changes before committing.
